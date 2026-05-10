import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  // Two-query pattern: user profile + detected schedule count
  const [profileRes, schedulesRes] = await Promise.all([
    admin
      .from('users')
      .select('plan_tier, is_admin, dismissed_nudge_at, nudge_email_unsubscribed')
      .eq('id', user.id)
      .single(),
    admin
      .from('purchase_schedules')
      .select('id')
      .eq('user_id', user.id)
      .eq('subscription_detected', true)
      .eq('status', 'active'),
  ])

  const profile = profileRes.data
  if (!profile) return NextResponse.json({ count: 0 })

  const planTier = (profile.plan_tier as string) ?? 'free'
  const isAdmin = (profile.is_admin as boolean) ?? false

  // Nudge is only for Free and Consumer tier, non-admin users
  if (isAdmin || !['free', 'consumer'].includes(planTier)) {
    return NextResponse.json({ count: 0, eligible: false })
  }

  const count = (schedulesRes.data ?? []).length
  const dismissedAt = profile.dismissed_nudge_at as string | null
  const unsubscribed = (profile.nudge_email_unsubscribed as boolean) ?? false

  // Show banner if: count > 0 AND (never dismissed OR dismissed > 7 days ago)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const shouldShow =
    count > 0 &&
    (!dismissedAt || new Date(dismissedAt).getTime() < sevenDaysAgo)

  return NextResponse.json({
    count,
    eligible: true,
    shouldShow,
    dismissedAt,
    nudgeEmailUnsubscribed: unsubscribed,
  })
}
