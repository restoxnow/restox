import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import BillingPageClient from './BillingPageClient'

export const metadata = { title: 'Billing & Plan — Restox' }

export default async function BillingPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, retailerRes, scheduleRes] = await Promise.all([
    supabase
      .from('users')
      .select('plan_tier, payment_failed_at, previous_plan_tier, stripe_customer_id, is_admin')
      .eq('id', user.id)
      .single(),
    supabase
      .from('retailers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('purchase_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data as {
    plan_tier: string
    payment_failed_at: string | null
    previous_plan_tier: string | null
    stripe_customer_id: string | null
    is_admin: boolean
  } | null

  return (
    <BillingPageClient
      planTier={profile?.plan_tier ?? 'free'}
      paymentFailedAt={profile?.payment_failed_at ?? null}
      previousPlanTier={profile?.previous_plan_tier ?? null}
      hasStripeCustomer={!!profile?.stripe_customer_id}
      isAdmin={profile?.is_admin ?? false}
      retailerCount={retailerRes.count ?? 0}
      scheduleCount={scheduleRes.count ?? 0}
    />
  )
}
