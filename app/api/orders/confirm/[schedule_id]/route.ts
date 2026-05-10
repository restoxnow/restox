import { NextRequest, NextResponse } from 'next/server'
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
