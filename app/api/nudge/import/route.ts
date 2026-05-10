import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// POST { scheduleIds: string[] }
// Pro+ only: enable AI management on selected detected schedules.
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  // Verify Pro+ tier
  const { data: profile } = await admin
    .from('users')
    .select('plan_tier, is_admin')
    .eq('id', user.id)
    .single()

  const planTier = (profile?.plan_tier as string) ?? 'free'
  const isAdmin = (profile?.is_admin as boolean) ?? false
  const isPro = isAdmin || ['professional', 'business'].includes(planTier)

  if (!isPro) {
    return NextResponse.json({ error: 'Professional or above required' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const scheduleIds: string[] = Array.isArray(body.scheduleIds) ? body.scheduleIds : []

  if (scheduleIds.length === 0) {
    return NextResponse.json({ error: 'No scheduleIds provided' }, { status: 400 })
  }

  // Enable AI management — set frequency_days from subscription_interval_days if not already set
  // Two separate updates to avoid complex CASE expressions via REST
  const { data: schedules } = await admin
    .from('purchase_schedules')
    .select('id, frequency_days, subscription_interval_days')
    .eq('user_id', user.id)
    .in('id', scheduleIds)

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ error: 'No matching schedules found' }, { status: 404 })
  }

  // Build per-row updates
  await Promise.all(
    schedules.map(s =>
      admin
        .from('purchase_schedules')
        .update({
          ai_managed: true,
          frequency_days: s.frequency_days ?? s.subscription_interval_days ?? 30,
        })
        .eq('id', s.id)
        .eq('user_id', user.id)
    )
  )

  return NextResponse.json({ ok: true, imported: schedules.length })
}
