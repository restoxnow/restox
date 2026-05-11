import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { TIER_CAPS } from '@/lib/tier-caps'

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
}

// Admin Supabase client — bypasses RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send'
const FROM_EMAIL   = 'hello@restox.net'
const BASE_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://restox.net'

async function logError(opts: {
  userId: string | null
  eventType: string
  errorMessage: string
  metadata?: Record<string, unknown>
}) {
  try {
    await adminSupabase.from('error_logs').insert({
      user_id:       opts.userId,
      event_type:    opts.eventType,
      error_message: opts.errorMessage,
      metadata:      opts.metadata ?? null,
    })
  } catch { /* logging must never block the main flow */ }
}

async function sendSlackAlert(message: string) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
  } catch { /* non-fatal */ }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SENDGRID_API_KEY) return
  await fetch(SENDGRID_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: 'Restox' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })
}

function emailTemplate(heading: string, body: string, ctaLabel: string, ctaHref: string, secondaryCta?: { label: string; href: string }) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
    <img src="https://restox.net/restox-logo-icon.png" alt="Restox" width="32" style="border-radius:8px;margin-bottom:24px"/>
    <h2 style="color:#1A1A2E;font-size:20px;margin:0 0 12px">${heading}</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px">${body}</p>
    <a href="${ctaHref}" style="display:inline-block;padding:12px 28px;background:#F47C20;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">${ctaLabel}</a>
    ${secondaryCta ? `<br/><br/><a href="${secondaryCta.href}" style="color:#374151;font-size:14px">${secondaryCta.label}</a>` : ''}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
    <p style="color:#9ca3af;font-size:12px;margin:0">Restox LLC · Nevada, USA</p>
  </div>`
}

async function getUserByCustomerId(customerId: string) {
  const { data } = await adminSupabase
    .from('users')
    .select('id, email, plan_tier, previous_plan_tier, stripe_customer_id')
    .eq('stripe_customer_id', customerId)
    .single()
  return data as { id: string; email: string; plan_tier: string; previous_plan_tier: string | null; stripe_customer_id: string } | null
}

async function suspendExcessData(userId: string, tierCap: { retailers: number; schedules: number }) {
  const [retailersRes, schedulesRes] = await Promise.all([
    adminSupabase
      .from('retailers')
      .select('id')
      .eq('user_id', userId)
      .eq('is_suspended', false)
      .order('created_at', { ascending: true }),
    adminSupabase
      .from('purchase_schedules')
      .select('id')
      .eq('user_id', userId)
      .eq('is_suspended', false)
      .order('created_at', { ascending: true }),
  ])

  const retailers = (retailersRes.data ?? []) as { id: string }[]
  const schedules  = (schedulesRes.data ?? []) as { id: string }[]

  const rCap = tierCap.retailers === Infinity ? retailers.length : tierCap.retailers
  const sCap = tierCap.schedules === Infinity ? schedules.length : tierCap.schedules

  const excessRetailerIds = retailers.slice(rCap).map(r => r.id)
  const excessScheduleIds = schedules.slice(sCap).map(s => s.id)

  if (excessRetailerIds.length > 0) {
    await adminSupabase.from('retailers').update({ is_suspended: true }).in('id', excessRetailerIds)
    await adminSupabase.from('products').update({ is_suspended: true }).eq('user_id', userId).in('retailer_id', excessRetailerIds)
  }
  if (excessScheduleIds.length > 0) {
    await adminSupabase.from('purchase_schedules').update({ is_suspended: true }).in('id', excessScheduleIds)
  }
}

async function restoreAllData(userId: string) {
  await Promise.all([
    adminSupabase.from('retailers').update({ is_suspended: false }).eq('user_id', userId).eq('is_suspended', true),
    adminSupabase.from('purchase_schedules').update({ is_suspended: false }).eq('user_id', userId).eq('is_suspended', true),
    adminSupabase.from('products').update({ is_suspended: false }).eq('user_id', userId).eq('is_suspended', true),
  ])
}

async function handlePaymentFailed(customerId: string, tierLabel: string) {
  const user = await getUserByCustomerId(customerId)
  if (!user) return

  const currentTier = user.plan_tier

  await adminSupabase
    .from('users')
    .update({
      payment_failed_at: new Date().toISOString(),
      previous_plan_tier: currentTier,
      plan_tier: 'free',
    })
    .eq('id', user.id)

  await suspendExcessData(user.id, TIER_CAPS.free)

  const html = emailTemplate(
    'Action required — your Restox payment didn\'t go through',
    `Your ${tierLabel} subscription payment failed. Your account has been temporarily moved to the Free plan. Your data is safe and will be fully restored when payment clears. Update your payment method to restore access immediately.`,
    'Update Payment Method',
    `${BASE_URL}/dashboard/settings/billing`,
  )
  await sendEmail(user.email, 'Action required — your Restox payment didn\'t go through', html)
}

async function handlePaymentRecovered(customerId: string) {
  const user = await getUserByCustomerId(customerId)
  if (!user) return

  const restoredTier = user.previous_plan_tier ?? user.plan_tier

  await adminSupabase
    .from('users')
    .update({
      payment_failed_at: null,
      plan_tier: restoredTier,
      previous_plan_tier: null,
    })
    .eq('id', user.id)

  await restoreAllData(user.id)

  const tierLabel = restoredTier.charAt(0).toUpperCase() + restoredTier.slice(1)
  const html = emailTemplate(
    `You\'re back — Restox ${tierLabel} restored`,
    `Your payment was processed successfully. Your ${tierLabel} plan and all your data have been fully restored.`,
    'Go to Dashboard',
    `${BASE_URL}/dashboard`,
  )
  await sendEmail(user.email, `You\'re back — Restox ${tierLabel} restored`, html)
}

async function handleSubscriptionDeleted(customerId: string) {
  const user = await getUserByCustomerId(customerId)
  if (!user) return

  await adminSupabase
    .from('users')
    .update({ plan_tier: 'free', payment_failed_at: null, previous_plan_tier: null })
    .eq('id', user.id)

  await suspendExcessData(user.id, TIER_CAPS.free)

  const html = emailTemplate(
    'Your Restox subscription has been cancelled',
    'Your subscription has been cancelled and your account has been moved to the Free plan. Your data is saved and you can upgrade again at any time.',
    'Manage my plan',
    `${BASE_URL}/dashboard/settings/billing`,
  )
  await sendEmail(user.email, 'Your Restox subscription has been cancelled', html)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.supabase_user_id
  const tier   = session.metadata?.tier
  if (!userId || !tier) return

  await adminSupabase
    .from('users')
    .update({ plan_tier: tier, stripe_customer_id: session.customer as string })
    .eq('id', userId)
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripeClient().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (!customerId) break
        const user = await getUserByCustomerId(customerId)
        const tier = user?.plan_tier ?? 'paid'
        const label = tier.charAt(0).toUpperCase() + tier.slice(1)
        await handlePaymentFailed(customerId, label)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi         = event.data.object as Stripe.PaymentIntent
        const customerId = typeof pi.customer === 'string' ? pi.customer : pi.customer?.id
        if (!customerId) break
        const user = await getUserByCustomerId(customerId)
        const tier = user?.plan_tier ?? 'paid'
        const label = tier.charAt(0).toUpperCase() + tier.slice(1)
        await handlePaymentFailed(customerId, label)
        break
      }

      case 'invoice.paid': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as Stripe.Customer | null)?.id
        if (!customerId) break

        const user = await getUserByCustomerId(customerId)

        if (!user) {
          // Orphaned subscription — no matching user in public.users
          // Cancel immediately and refund the latest charge
          try {
            const stripeClient = getStripeClient()
            const subs = await stripeClient.subscriptions.list({ customer: customerId, status: 'active', limit: 5 })
            await Promise.all(subs.data.map(sub => stripeClient.subscriptions.cancel(sub.id)))

            // Find the default payment intent for this invoice and refund it
            const payments = await stripeClient.invoicePayments.list({ invoice: invoice.id })
            const defaultPayment = payments.data.find(p => p.is_default && p.payment?.type === 'payment_intent')
            const piId = defaultPayment?.payment?.payment_intent
            const paymentIntentId = typeof piId === 'string' ? piId : typeof piId === 'object' && piId ? piId.id : null
            if (paymentIntentId) {
              await stripeClient.refunds.create({ payment_intent: paymentIntentId })
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error('Orphaned sub cleanup failed:', msg)
          }

          await logError({
            userId: null,
            eventType: 'orphaned_stripe_subscription',
            errorMessage: 'invoice.paid received for a Stripe customer with no matching user in public.users',
            metadata: { stripe_customer_id: customerId, invoice_id: invoice.id },
          })
          await sendSlackAlert(
            `:rotating_light: *Orphaned Stripe subscription detected*\n` +
            `• Stripe customer: \`${customerId}\`\n` +
            `• Invoice: \`${invoice.id}\`\n` +
            `Subscription cancelled and charge refunded automatically. Verify in Stripe dashboard.`,
          )
          break
        }

        // Normal recovery path
        if (user.previous_plan_tier) {
          await handlePaymentRecovered(customerId)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const pi         = event.data.object as Stripe.PaymentIntent
        const customerId = typeof pi.customer === 'string' ? pi.customer : (pi.customer as Stripe.Customer | null)?.id
        if (!customerId) break
        const user = await getUserByCustomerId(customerId)
        if (user?.previous_plan_tier) {
          await handlePaymentRecovered(customerId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
        if (!customerId) break
        await handleSubscriptionDeleted(customerId)
        break
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
