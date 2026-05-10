import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log-error'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ---------------------------------------------------------------------------
// Kroger Products API — client credentials (no user OAuth required)
// ---------------------------------------------------------------------------
async function getKrogerClientToken(): Promise<string | null> {
  const clientId     = process.env.KROGER_CLIENT_ID
  const clientSecret = process.env.KROGER_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  try {
    const resp = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization:  `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=product.compact',
    })
    if (!resp.ok) return null
    const json = await resp.json().catch(() => null)
    return (json?.access_token as string) ?? null
  } catch {
    return null
  }
}

async function fetchKrogerPrice(productName: string, token: string): Promise<number | null> {
  try {
    const url = new URL('https://api.kroger.com/v1/products')
    url.searchParams.set('filter.term', productName.slice(0, 80))
    url.searchParams.set('filter.limit', '5')

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    if (!resp.ok) return null
    const json = await resp.json().catch(() => null)

    const items = (json?.data ?? []) as any[]
    for (const product of items) {
      for (const item of (product.items ?? [])) {
        const price = item?.price?.regular ?? item?.price?.promo
        if (typeof price === 'number' && price > 0.5 && price < 10000) return price
      }
    }
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// HTML price scraper — best-effort, marks result as estimated
// ---------------------------------------------------------------------------
const PRICE_PATTERNS = [
  // JSON-LD structured data
  /"price"\s*:\s*"?([\d.]+)"?/g,
  // dollar amounts $X.XX or $X,XXX.XX
  /\$\s*([\d,]+\.\d{2})/g,
  // data attributes
  /data-price="([\d.]+)"/g,
  /data-cost="([\d.]+)"/g,
  // itemprop
  /itemprop="price"\s+content="([\d.]+)"/g,
]

async function fetchHtmlPrice(productUrl: string): Promise<number | null> {
  try {
    const resp = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })
    if (!resp.ok) return null

    const html = await resp.text()
    const candidates: number[] = []

    for (const pattern of PRICE_PATTERNS) {
      pattern.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = pattern.exec(html)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ''))
        if (price > 0.50 && price < 10000) candidates.push(price)
      }
    }

    if (candidates.length === 0) return null

    // Return the most common price (or smallest if no consensus)
    const freq = new Map<number, number>()
    for (const p of candidates) freq.set(p, (freq.get(p) ?? 0) + 1)
    const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1])
    return sorted[0][0]
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Retailer display name normalisation
// ---------------------------------------------------------------------------
function normaliseRetailerName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('kroger') || lower.includes('fred meyer') || lower.includes('ralphs')) return 'Kroger'
  return name
}

// ---------------------------------------------------------------------------
// POST /api/price-compare/fetch
// Auth: Supabase session (client) OR Bearer ORDER_SYNC_SECRET (n8n).
// Body: { schedule_id: string }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { schedule_id } = body

  if (!schedule_id) {
    return NextResponse.json({ error: 'Missing schedule_id' }, { status: 400 })
  }

  // Auth
  const authHeader = req.headers.get('authorization') ?? ''
  const syncSecret = process.env.ORDER_SYNC_SECRET
  let sessionUserId: string | null = null

  if (syncSecret && authHeader === `Bearer ${syncSecret}`) {
    // n8n — trust the schedule_id; user_id derived from the schedule record
  } else {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    sessionUserId = user.id
  }

  const admin = adminClient()

  // Read the schedule (admin bypasses RLS so this works for both auth paths)
  const { data: schedule, error: scheduleError } = await admin
    .from('purchase_schedules')
    .select('id, user_id, product_name, retailer, product_url')
    .eq('id', schedule_id)
    .single()

  if (scheduleError || !schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
  }

  // For session-auth path, verify ownership
  if (sessionUserId && schedule.user_id !== sessionUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId       = schedule.user_id
  const productName  = schedule.product_name ?? 'Unknown product'
  const sourceRetailer = normaliseRetailerName(schedule.retailer ?? 'Unknown')
  const productUrl   = schedule.product_url ?? null

  // ------------------------------------------------------------------
  // Collect price results
  // ------------------------------------------------------------------
  const now = new Date().toISOString()
  const results: {
    retailer_name: string
    price: number
    is_estimated: boolean
  }[] = []

  // 1. Source retailer — scrape from product URL
  if (productUrl) {
    const htmlPrice = await fetchHtmlPrice(productUrl)
    if (htmlPrice !== null) {
      results.push({ retailer_name: sourceRetailer, price: htmlPrice, is_estimated: true })
    }
  }

  // 2. Kroger comparison — client credentials, no user OAuth needed
  const krogerToken = await getKrogerClientToken()
  if (krogerToken) {
    const krogerPrice = await fetchKrogerPrice(productName, krogerToken)
    if (krogerPrice !== null && sourceRetailer !== 'Kroger') {
      results.push({ retailer_name: 'Kroger', price: krogerPrice, is_estimated: false })
    } else if (krogerPrice !== null && sourceRetailer === 'Kroger') {
      // Source is Kroger — use API price (not scraped), mark live
      const existing = results.findIndex(r => r.retailer_name === 'Kroger')
      if (existing >= 0) {
        results[existing] = { retailer_name: 'Kroger', price: krogerPrice, is_estimated: false }
      } else {
        results.push({ retailer_name: 'Kroger', price: krogerPrice, is_estimated: false })
      }
    }
  }

  if (results.length === 0) {
    return NextResponse.json({ fetched: 0, message: 'No prices could be retrieved' })
  }

  // ------------------------------------------------------------------
  // Delete existing rows for this schedule, then insert fresh results
  // ------------------------------------------------------------------
  try {
    await admin
      .from('price_comparisons')
      .delete()
      .eq('schedule_id', schedule_id)

    const rows = results.map(r => ({
      user_id:       userId,
      schedule_id,
      retailer_name: r.retailer_name,
      price:         r.price,
      is_estimated:  r.is_estimated,
      fetched_at:    now,
      checked_at:    now,
    }))

    const { error: insertError } = await admin
      .from('price_comparisons')
      .insert(rows)

    if (insertError) {
      Sentry.captureException(insertError)
      await logError({ route: '/api/price-compare/fetch', error: insertError, userId })
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  } catch (err) {
    Sentry.captureException(err)
    await logError({ route: '/api/price-compare/fetch', error: err, userId })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ fetched: results.length })
}
