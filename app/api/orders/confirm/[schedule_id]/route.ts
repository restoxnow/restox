import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log-error'
import { verifyOrderToken } from '@/lib/order-token'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ---------------------------------------------------------------------------
// POST /api/orders/confirm/[schedule_id]
// Confirms the pending pre-order for a schedule. Marks the order_confirmations
// record as 'confirmed' and stubs out actual order placement (future task).
// ---------------------------------------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: { schedule_id: string } }
) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { schedule_id } = params
  const admin = adminClient()

  // Verify the schedule belongs to this user (two-query pattern: read separately)
  const { data: schedule } = await admin
    .from('purchase_schedules')
    .select('id, user_id, product_name, retailer')
    .eq('id', schedule_id)
    .single()

  if (!schedule || schedule.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Find the most recent pending confirmation for this schedule
  const { data: confirmation } = await admin
    .from('order_confirmations')
    .select('id, status')
    .eq('schedule_id', schedule_id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!confirmation) {
    return NextResponse.json({ error: 'No pending confirmation found for this schedule' }, { status: 404 })
  }

  const { error } = await admin
    .from('order_confirmations')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', confirmation.id)

  if (error) {
    await logError({ route: `/api/orders/confirm/${schedule_id}`, error, userId: user.id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: trigger actual order placement via retailer API.
  // This requires retailer-specific ordering APIs (Amazon Buy API, Kroger Cart API, etc.)
  // which require additional partnership agreements. Implement per retailer when available.
  // The selected payment method ID is stored in order_confirmations.payment_method_id.

  return NextResponse.json({ ok: true, message: 'Order confirmed — placement coming soon' })
}

// ---------------------------------------------------------------------------
// GET /api/orders/confirm/[schedule_id]?token=...
// Token-based confirm for one-click email links — no login required.
// ---------------------------------------------------------------------------
const HTML = (title: string, emoji: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Restox</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:white;border-radius:16px;padding:48px 40px;max-width:440px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    h1{color:#1A1A2E;font-size:22px;margin:0 0 12px}
    p{color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px}
    a{display:inline-block;padding:10px 24px;background:#F47C20;color:white;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600}
    .icon{font-size:40px;margin-bottom:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${emoji}</div>
    <h1>${title}</h1>
    ${body}
    <a href="https://restox.net/dashboard">Go to Dashboard</a>
  </div>
</body>
</html>`

export async function GET(
  req: NextRequest,
  { params }: { params: { schedule_id: string } }
) {
  const { schedule_id } = params
  const token = req.nextUrl.searchParams.get('token')

  if (!token || !verifyOrderToken(token, schedule_id, 'confirm')) {
    return new NextResponse(
      HTML('Invalid link', '❌', '<p>This confirmation link is invalid or has expired. Please visit your dashboard to manage your orders.</p>'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const admin = adminClient()
  const { data: conf } = await admin
    .from('order_confirmations')
    .select('id')
    .eq('schedule_id', schedule_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!conf) {
    return new NextResponse(
      HTML('Already actioned', 'ℹ️', '<p>This order has already been confirmed or skipped. Check your dashboard for the latest status.</p>'),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  await admin
    .from('order_confirmations')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', conf.id)

  return new NextResponse(
    HTML('Order confirmed!', '✅', '<p>Your order has been confirmed. We\'ll place it automatically on the scheduled date.</p>'),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
