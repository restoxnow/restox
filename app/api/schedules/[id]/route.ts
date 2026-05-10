import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const PATCHABLE = new Set(['monitor_only', 'status', 'frequency_days', 'notification_timing', 'notification_channel'])

const TIMING_TO_HOURS: Record<string, number> = { '6hr': 6, '12hr': 12, '24hr': 24, '48hr': 48 }

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // Only allow whitelisted fields to be patched
  const patch: Record<string, unknown> = {}
  for (const key of Object.keys(body)) {
    if (PATCHABLE.has(key)) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No patchable fields provided' }, { status: 400 })
  }

  // Keep pre_order_confirmation_hours in sync with notification_timing
  if (patch['notification_timing']) {
    const hours = TIMING_TO_HOURS[patch['notification_timing'] as string]
    if (hours) patch['pre_order_confirmation_hours'] = hours
  }

  const { error } = await supabase
    .from('purchase_schedules')
    .update(patch)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
