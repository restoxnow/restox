import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encrypt'
import { fetchPaymentMethodsForRetailer } from '@/lib/fetch-payment-methods'
import { logError } from '@/lib/log-error'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const ALLOWED_BRANDS = ['Visa', 'Mastercard', 'American Express', 'Discover', 'Other'] as const

// ---------------------------------------------------------------------------
// POST /api/retailers/payment-methods/sync
// Two modes:
//   Self-entry: body includes { last4, brand } — stores user-provided card info.
//   OAuth sync: fetches payment methods from retailer API (existing behavior).
// Auth: Supabase session (client) OR Bearer ORDER_SYNC_SECRET (n8n).
// Body: { retailer_name: string, last4?: string, brand?: string, user_id?: string }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let userId: string

  const authHeader  = req.headers.get('authorization') ?? ''
  const syncSecret  = process.env.ORDER_SYNC_SECRET
  const body        = await req.json().catch(() => ({}))
  const retailerName: string = body.retailer_name ?? ''

  if (!retailerName) {
    return NextResponse.json({ error: 'Missing retailer_name' }, { status: 400 })
  }

  if (syncSecret && authHeader === `Bearer ${syncSecret}`) {
    if (!body.user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    userId = body.user_id
  } else {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  }

  const admin = adminClient()

  // ── Self-entry mode ───────────────────────────────────────────────────────
  if (body.last4 !== undefined || body.brand !== undefined) {
    const brand = String(body.brand ?? '')
    const last4 = String(body.last4 ?? '')

    if (!ALLOWED_BRANDS.includes(brand as typeof ALLOWED_BRANDS[number])) {
      return NextResponse.json({ error: 'Invalid brand' }, { status: 400 })
    }
    if (!/^\d{4}$/.test(last4)) {
      return NextResponse.json({ error: 'last4 must be exactly 4 digits' }, { status: 400 })
    }

    const { error } = await admin
      .from('retailer_payment_methods')
      .upsert(
        {
          user_id:                 userId,
          retailer_name:           retailerName,
          payment_method_id:       'self-entered',
          last4,
          brand,
          is_default:              true,
          selected_for_auto_order: true,
        },
        { onConflict: 'user_id,retailer_name,payment_method_id', ignoreDuplicates: false }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ synced: 1, manual: true })
  }

  // Look up the retailer's stored OAuth token
  const { data: retailer } = await admin
    .from('retailers')
    .select('access_token, connection_type, connection_status')
    .eq('user_id', userId)
    .eq('name', retailerName)
    .single()

  if (!retailer || retailer.connection_type !== 'oauth' || retailer.connection_status !== 'connected') {
    // Not an OAuth retailer — nothing to fetch; return empty gracefully
    return NextResponse.json({ synced: 0, message: 'No OAuth connection for this retailer' })
  }

  if (!retailer.access_token) {
    return NextResponse.json({ synced: 0, message: 'No access token stored' })
  }

  let accessToken: string
  try {
    accessToken = decrypt(retailer.access_token)
  } catch {
    return NextResponse.json({ synced: 0, message: 'Could not decrypt access token' })
  }

  let methods = []
  try {
    methods = await fetchPaymentMethodsForRetailer(retailerName, accessToken)
  } catch (err) {
    await logError({ route: '/api/retailers/payment-methods/sync', error: err, userId })
    return NextResponse.json({ synced: 0, message: 'Fetch failed' })
  }

  if (methods.length === 0) {
    // Retailer API doesn't expose payment methods — graceful fallback
    return NextResponse.json({ synced: 0, message: 'No payment methods available from retailer API' })
  }

  // Upsert each method; conflict on (user_id, retailer_name, payment_method_id)
  const now = new Date().toISOString()
  const rows = methods.map(m => ({
    user_id:           userId,
    retailer_name:     retailerName,
    payment_method_id: m.id,
    last4:             m.last4,
    brand:             m.brand,
    expiry_month:      m.expiryMonth,
    expiry_year:       m.expiryYear,
    is_default:        m.isDefault,
    updated_at:        now,
  }))

  try {
    await admin
      .from('retailer_payment_methods')
      .upsert(rows, { onConflict: 'user_id,retailer_name,payment_method_id', ignoreDuplicates: false })
  } catch (err) {
    await logError({ route: '/api/retailers/payment-methods/sync', error: err, userId })
    return NextResponse.json({ error: 'DB upsert failed' }, { status: 500 })
  }

  return NextResponse.json({ synced: methods.length })
}
