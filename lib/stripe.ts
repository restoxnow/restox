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
  consumer:     process.env.STRIPE_PRICE_CONSUMER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  business:     process.env.STRIPE_PRICE_BUSINESS,
}
