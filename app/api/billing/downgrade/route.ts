import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { TIER_CAPS } from '@/lib/tier-caps'
import type { PlanTier } from '@/lib/tier-caps'

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tier: targetTier } = await request.json() as { tier: PlanTier }
  const caps = TIER_CAPS[targetTier] ?? TIER_CAPS.free

  const [retailersRes, schedulesRes, profileRes] = await Promise.all([
    supabase.from('retailers').select('id, created_at').eq('user_id', user.id).eq('is_suspended', false).order('created_at', { ascending: true }).then(r => r),
    supabase.from('purchase_schedules').select('id, created_at').eq('user_id', user.id).eq('is_suspended', false).order('created_at', { ascending: true }).then(r => r),
    supabase.from('users').select('stripe_customer_id, plan_tier').eq('id', user.id).single().then(r => r),
  ])

  const retailers = (retailersRes.data ?? []) as { id: string }[]
  const schedules  = (schedulesRes.data ?? []) as { id: string }[]

  const retailerCap = caps.retailers === Infinity ? retailers.length : caps.retailers
  const scheduleCap = caps.schedules === Infinity ? schedules.length : caps.schedules

  const excessRetailerIds = retailers.slice(retailerCap).map(r => r.id)
  const excessScheduleIds = schedules.slice(scheduleCap).map(s => s.id)

  // Update plan tier
  await supabase.from('users').update({ plan_tier: targetTier }).eq('id', user.id)

  // Suspend excess retailers and their products
  if (excessRetailerIds.length > 0) {
    await supabase.from('retailers').update({ is_suspended: true }).in('id', excessRetailerIds)
    await supabase.from('products').update({ is_suspended: true }).eq('user_id', user.id).in('retailer_id', excessRetailerIds)
  }

  // Suspend excess schedules
  if (excessScheduleIds.length > 0) {
    await supabase.from('purchase_schedules').update({ is_suspended: true }).in('id', excessScheduleIds)
  }

  // Cancel/downgrade subscription in Stripe if customer exists
  const customerId = (profileRes.data as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null
  if (customerId && targetTier === 'free') {
    try {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 })
      if (subs.data.length > 0) await stripe.subscriptions.cancel(subs.data[0].id)
    } catch { /* non-fatal */ }
  } else if (customerId) {
    try {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 })
      if (subs.data.length > 0) {
        const priceId = process.env[`STRIPE_PRICE_${targetTier.toUpperCase()}`]
        if (priceId) {
          await stripe.subscriptions.update(subs.data[0].id, {
            items: [{ id: subs.data[0].items.data[0].id, price: priceId }],
            proration_behavior: 'always_invoice',
          })
        }
      }
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ success: true, targetTier, suspended: { retailers: excessRetailerIds.length, schedules: excessScheduleIds.length } })
}
