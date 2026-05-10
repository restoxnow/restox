import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encrypt'

const SYNC_RATE_LIMIT_MS = 24 * 60 * 60 * 1000 // 24 hours

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ---------------------------------------------------------------------------
// Retailer-specific order history fetchers
// ---------------------------------------------------------------------------

interface OrderItem {
  product_name: string
  quantity: number
  price: number
}

interface OrderRecord {
  retailer_name: string
  order_date: string
  items: OrderItem[]
}

async function fetchKrogerHistory(accessToken: string): Promise<OrderRecord[]> {
  const res = await fetch('https://api.kroger.com/v1/purchase-history?filter.limit=50', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return []

  const json = await res.json().catch(() => null)
  if (!json?.data) return []

  return (json.data as any[]).map((order: any) => ({
    retailer_name: 'Kroger',
    order_date: order.transactionDate ?? new Date().toISOString(),
    items: (order.items ?? []).map((item: any) => ({
      product_name: item.description ?? item.upc ?? 'Unknown item',
      quantity: Number(item.quantity ?? 1),
      price: Number(item.price ?? 0),
    })),
  }))
}

async function fetchAmazonHistory(accessToken: string): Promise<OrderRecord[]> {
  // Amazon's buyer-facing order history requires the SP-API with seller permissions;
  // the LWA profile token we store only grants profile scope.
  // TODO: integrate Amazon SP-API when seller/buyer order history API becomes available.
  return []
}

// Stub for all other retailers — extend as APIs become available
async function fetchStubHistory(_accessToken: string, retailerName: string): Promise<OrderRecord[]> {
  // TODO: implement ${retailerName} order history fetch
  return []
}

async function fetchHistoryForRetailer(
  retailerName: string,
  accessToken: string,
): Promise<OrderRecord[]> {
  switch (retailerName.toLowerCase()) {
    case 'kroger':
    case 'kroger (fred meyer)':
    case 'kroger (ralphs)':
      return fetchKrogerHistory(accessToken)
    case 'amazon':
      return fetchAmazonHistory(accessToken)
    default:
      return fetchStubHistory(accessToken, retailerName)
  }
}

// ---------------------------------------------------------------------------
// POST /api/retailers/order-history/sync
// Triggered on first retailer connect and daily by n8n.
// Auth: Supabase session (client) OR Bearer SYNC_SECRET + body.user_id (n8n).
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let userId: string

  const authHeader = req.headers.get('authorization') ?? ''
  const syncSecret = process.env.ORDER_SYNC_SECRET

  if (syncSecret && authHeader === `Bearer ${syncSecret}`) {
    // n8n machine-to-machine call
    const body = await req.json().catch(() => ({}))
    if (!body.user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }
    userId = body.user_id
  } else {
    // Client session call
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  }

  const admin = adminClient()
  const now = new Date()
  const rateLimitCutoff = new Date(now.getTime() - SYNC_RATE_LIMIT_MS).toISOString()

  // Fetch OAuth-connected retailers that haven't been synced within 24h
  const { data: retailers, error: retailersError } = await admin
    .from('retailers')
    .select('id, name, access_token, last_history_sync')
    .eq('user_id', userId)
    .eq('connection_type', 'oauth')
    .eq('connection_status', 'connected')
    .not('access_token', 'is', null)

  if (retailersError) {
    return NextResponse.json({ error: 'Failed to fetch retailers' }, { status: 500 })
  }

  if (!retailers || retailers.length === 0) {
    return NextResponse.json({ synced: [], skipped: [] })
  }

  const synced: string[] = []
  const skipped: string[] = []

  for (const retailer of retailers) {
    // Rate-limit: skip if synced within last 24h
    if (retailer.last_history_sync && retailer.last_history_sync > rateLimitCutoff) {
      skipped.push(retailer.name)
      continue
    }

    let accessToken: string
    try {
      accessToken = decrypt(retailer.access_token)
    } catch {
      skipped.push(retailer.name)
      continue
    }

    const orders = await fetchHistoryForRetailer(retailer.name, accessToken)

    if (orders.length > 0) {
      const rows = orders.map(o => ({
        user_id: userId,
        retailer_name: o.retailer_name,
        order_date: o.order_date,
        items: o.items,
      }))

      // Upsert by user_id + retailer_name + order_date to avoid duplicates
      await admin
        .from('order_history')
        .upsert(rows, { onConflict: 'user_id,retailer_name,order_date', ignoreDuplicates: true })
    }

    // Update last_history_sync regardless (even if 0 orders, we attempted)
    await admin
      .from('retailers')
      .update({ last_history_sync: now.toISOString() })
      .eq('id', retailer.id)

    synced.push(retailer.name)
  }

  return NextResponse.json({ synced, skipped })
}
