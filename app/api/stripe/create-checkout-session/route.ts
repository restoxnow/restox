import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { stripe, getPriceId } from '@/lib/stripe'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://restox.net'

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tier, billingPeriod = 'monthly' } = await request.json() as { tier: string; billingPeriod?: 'monthly' | 'annual' }

  const priceId = getPriceId(tier, billingPeriod)
  if (!priceId) return NextResponse.json({ error: 'Invalid tier or price not configured' }, { status: 400 })

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id as string | undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    success_url: `${BASE_URL}/dashboard/settings/billing?upgraded=true`,
    cancel_url:  `${BASE_URL}/dashboard/settings/billing`,
    metadata: { supabase_user_id: user.id, tier, billingPeriod },
  })

  return NextResponse.json({ url: session.url })
}
