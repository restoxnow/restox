import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

// Named export for convenience — same lazy singleton
export const stripe = {
  get customers()    { return getStripe().customers },
  get subscriptions(){ return getStripe().subscriptions },
  get billingPortal(){ return getStripe().billingPortal },
  get checkout()     { return getStripe().checkout },
  get webhooks()     { return getStripe().webhooks },
}

export const STRIPE_PRICES: Record<string, string | undefined> = {
  consumer_monthly:     process.env.STRIPE_PRICE_CONSUMER_MONTHLY,
  consumer_annual:      process.env.STRIPE_PRICE_CONSUMER_ANNUAL,
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
  professional_annual:  process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
  business_monthly:     process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
  business_annual:      process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
}

export function getPriceId(tier: string, period: 'monthly' | 'annual'): string | undefined {
  return STRIPE_PRICES[`${tier}_${period}`]
}
