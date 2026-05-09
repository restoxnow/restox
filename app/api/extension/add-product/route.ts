import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Authenticates via Bearer JWT. Per-request client so auth.uid() resolves in RLS.

const FREQ_TEXT_TO_DAYS: Record<string, number> = {
  weekly: 7, 'bi-weekly': 14, monthly: 30,
  'six-weekly': 42, 'bi-monthly': 60, quarterly: 90,
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

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
  const { name, product_url, retailer_name } = body

  if (!name || !retailer_name) {
    return NextResponse.json(
      { error: 'Missing required fields: name, retailer_name' },
      { status: 400 }
    )
  }

  // ── Fetch user's default frequency and convert to days ───────────────────
  const { data: userRow } = await supabase
    .from('users')
    .select('default_frequency')
    .eq('id', user.id)
    .maybeSingle()

  const frequencyDays = FREQ_TEXT_TO_DAYS[userRow?.default_frequency ?? 'monthly'] ?? 30

  // ── Insert purchase schedule directly (product info stored denormalized) ──
  const { error: scheduleError } = await supabase
    .from('purchase_schedules')
    .insert({
      user_id:               user.id,
      product_name:          name.slice(0, 255),
      product_url:           product_url ?? null,
      retailer:              retailer_name,
      quantity:              1,
      frequency_days:        frequencyDays,
      status:                'active',
      ai_managed:            false,
      notification_timing:   '24hr',
      confirmation_required: false,
      notification_channel:  'email',
    })

  if (scheduleError) {
    return NextResponse.json(
      { error: scheduleError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
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
