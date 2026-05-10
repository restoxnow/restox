import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://restox.net'

export async function POST() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  const customerId = profile?.stripe_customer_id as string | null
  if (!customerId) return NextResponse.json({ error: 'No billing account found' }, { status: 400 })

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${BASE_URL}/dashboard/settings/billing`,
  })

  return NextResponse.json({ url: session.url })
}
