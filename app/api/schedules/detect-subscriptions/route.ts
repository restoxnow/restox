import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { detectSubscription, orderMatchesProduct } from '@/lib/detect-subscription'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  // Auth: session cookie OR Bearer ORDER_SYNC_SECRET + body.user_id
  let userId: string
  const authHeader = req.headers.get('authorization') ?? ''
  const syncSecret = process.env.ORDER_SYNC_SECRET

  if (syncSecret && authHeader === `Bearer ${syncSecret}`) {
    const body = await req.json().catch(() => ({}))
    if (!body.user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    userId = body.user_id
  } else {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  }

  const admin = adminClient()

  // Two-query pattern to avoid ambiguous FK errors
  const [schedulesRes, historyRes] = await Promise.all([
    admin
      .from('purchase_schedules')
      .select('id, product_name, retailer')
      .eq('user_id', userId)
      .eq('status', 'active'),
    admin
      .from('order_history')
      .select('retailer_name, order_date, items')
      .eq('user_id', userId)
      .order('order_date', { ascending: false })
      .limit(200),
  ])

  const schedules = (schedulesRes.data ?? []) as {
    id: string; product_name: string; retailer: string
  }[]
  const history = (historyRes.data ?? []) as {
    retailer_name: string; order_date: string; items: { product_name?: string }[]
  }[]

  if (schedules.length === 0) return NextResponse.json({ updated: 0 })

  const updates: Promise<void>[] = schedules.map(async (schedule) => {
    const retailerLower = (schedule.retailer ?? '').toLowerCase()

    // Find matching orders: same retailer, product name fuzzy-match, last 6
    const matching = history
      .filter(o =>
        o.retailer_name.toLowerCase() === retailerLower &&
        orderMatchesProduct(o.items ?? [], schedule.product_name ?? '')
      )
      .slice(0, 6)

    const result = detectSubscription(matching.map(o => o.order_date))

    await admin
      .from('purchase_schedules')
      .update({
        subscription_detected:      result.isLikelySubscription,
        subscription_confidence:    result.isLikelySubscription ? result.confidence : null,
        subscription_interval_days: result.detectedIntervalDays,
      })
      .eq('id', schedule.id)
  })

  await Promise.allSettled(updates)

  return NextResponse.json({ updated: schedules.length })
}
