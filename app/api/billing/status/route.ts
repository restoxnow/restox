import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('plan_tier, payment_failed_at, previous_plan_tier, stripe_customer_id')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    planTier:          profile?.plan_tier ?? 'free',
    paymentFailedAt:   profile?.payment_failed_at ?? null,
    previousPlanTier:  profile?.previous_plan_tier ?? null,
    hasStripeCustomer: !!profile?.stripe_customer_id,
  })
}
