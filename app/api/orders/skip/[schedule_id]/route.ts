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
// POST /api/orders/skip/[schedule_id]
// Skips the pending pre-order for a schedule. Marks it as 'skipped' and
// returns the next scheduled order date (schedule_date + frequency_days)
// so the caller/n8n can reschedule accordingly.
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

  // Verify the schedule belongs to this user
  const { data: schedule } = await admin
    .from('purchase_schedules')
    .select('id, user_id, frequency_days')
    .eq('id', schedule_id)
    .single()

  if (!schedule || schedule.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Find the most recent pending confirmation for this schedule
  const { data: confirmation } = await admin
    .from('order_confirmations')
    .select('id, scheduled_order_date')
    .eq('schedule_id', schedule_id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!confirmation) {
    return NextResponse.json({ error: 'No pending confirmation found for this schedule' }, { status: 404 })
  }

  const skippedAt = new Date().toISOString()

  const { error } = await admin
    .from('order_confirmations')
    .update({ status: 'skipped', skipped_at: skippedAt })
    .eq('id', confirmation.id)

  if (error) {
    await logError({ route: `/api/orders/skip/${schedule_id}`, error, userId: user.id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate next order date: original date + frequency_days
  const originalDate  = new Date(confirmation.scheduled_order_date)
  const nextOrderDate = new Date(originalDate)
  nextOrderDate.setDate(nextOrderDate.getDate() + (schedule.frequency_days ?? 30))

  return NextResponse.json({
    ok: true,
    next_order_date: nextOrderDate.toISOString().split('T')[0],
  })
}
