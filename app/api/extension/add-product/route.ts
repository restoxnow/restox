import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This route authenticates via Bearer JWT (Supabase access token from the extension).
// We create the client per-request with the token in the Authorization header so that
// auth.uid() resolves correctly in RLS policies for all inserts/selects.

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

  // Create a per-request client with the Bearer token so RLS policies
  // see the correct auth.uid() on every query.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth:   { persistSession: false },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { name, price, image_url, product_url, retailer_name } = body

  if (!name || !retailer_name) {
    return NextResponse.json(
      { error: 'Missing required fields: name, retailer_name' },
      { status: 400 }
    )
  }

  // ── Find or create retailer record ──────────────────────────────────────
  let retailerId: string | null = null

  const { data: existingRetailer, error: lookupError } = await supabase
    .from('retailers')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', retailer_name)
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json(
      { error: 'Retailer lookup failed', detail: lookupError.message },
      { status: 500 }
    )
  }

  if (existingRetailer) {
    retailerId = existingRetailer.id
  } else {
    const { data: newRetailer, error: retailerError } = await supabase
      .from('retailers')
      .insert({
        user_id:          user.id,
        name:             retailer_name,
        connection_type:  'credentials',
        connection_status: 'connected',
      })
      .select('id')
      .single()

    if (retailerError) {
      return NextResponse.json(
        { error: 'Failed to create retailer record', detail: retailerError.message },
        { status: 500 }
      )
    }
    retailerId = newRetailer.id
  }

  // ── Fetch user's default frequency ───────────────────────────────────────
  const { data: userRow } = await supabase
    .from('users')
    .select('default_frequency')
    .eq('id', user.id)
    .maybeSingle()

  const defaultFrequency = userRow?.default_frequency ?? 'monthly'

  // ── Insert product ────────────────────────────────────────────────────────
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      user_id:          user.id,
      name:             name.slice(0, 255),
      retailer_id:      retailerId,
      category:         null,
      reorder_quantity: 1,
      product_url:      product_url ?? null,
    })
    .select('id')
    .single()

  if (productError) {
    return NextResponse.json(
      { error: productError.message },
      { status: 500 }
    )
  }

  // ── Create default purchase schedule ─────────────────────────────────────
  await supabase.from('purchase_schedules').insert({
    product_id:            product.id,
    user_id:               user.id,
    frequency:             defaultFrequency,
    status:                'active',
    ai_managed:            false,
    notification_timing:   '24hr',
    confirmation_required: false,
    notification_channel:  'email',
  })

  return NextResponse.json({
    success: true,
    product_id: product.id,
    message: `${name} added to Restox`,
  })
}

// Handle OPTIONS preflight for extension cross-origin requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
