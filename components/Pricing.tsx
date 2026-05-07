'use client'
import { useEffect, useRef, useState } from 'react'

type Plan = {
  name: string
  badge?: string
  price: string
  period: string
  altPrice?: string
  altPeriod?: string
  features: string[]
  cta: string
  ctaHref: string
  highlight?: boolean
  gradient?: string
}

const plans: Plan[] = [
  {
    name: 'Free',
    badge: 'Start Here',
    price: '$0',
    period: '/month',
    features: [
      'Up to 5 purchase schedules',
      'Manual ordering',
      'Basic dashboard',
      'Contextual ads',
    ],
    cta: 'Join Waitlist',
    ctaHref: '#waitlist',
  },
  {
    name: 'Consumer',
    badge: 'Most Popular',
    price: '$9.99',
    period: '/month',
    altPrice: '$89',
    altPeriod: '/year',
    features: [
      'Up to 25 purchase schedules',
      'Full automation',
      'Ad-free experience',
      'All supported retailers',
      'Email notifications',
    ],
    cta: 'Join Waitlist',
    ctaHref: '#waitlist',
    highlight: true,
    gradient: 'from-orange-500 to-rose-500',
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    altPrice: '$269',
    altPeriod: '/year',
    features: [
      'Unlimited schedules',
      'AI Reorder Timing',
      'Spend Intelligence',
      'Ad-free experience',
      'Priority support',
    ],
    cta: 'Join Waitlist',
    ctaHref: '#waitlist',
  },
  {
    name: 'Business',
    price: '$79',
    period: '/month',
    altPrice: '$749',
    altPeriod: '/year',
    features: [
      'Everything in Professional',
      'Multi-user seats',
      'Approval workflows',
      'PO & invoice analysis',
      'White-label API access',
      'Dedicated support',
    ],
    cta: 'Contact Us',
    ctaHref: 'mailto:hello@restox.net',
  },
]

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cards = container.querySelectorAll('.price-card')
    const observers: IntersectionObserver[] = []

    cards.forEach((card, i) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => card.classList.add('revealed'), i * 100)
            observer.disconnect()
          }
        },
        { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
      )
      observer.observe(card)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <section id="pricing" className="py-24 gradient-section-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-orange-500 font-heading font-bold text-sm uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="section-heading mb-4">Start free. Upgrade when you&apos;re ready.</h2>
          <p className="section-subheading max-w-md mx-auto mb-8">No credit card required to join the waitlist.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-brand-border shadow-sm">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-heading font-bold transition-all duration-200 ${
                billing === 'monthly'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-warm-sm'
                  : 'text-brand-mid hover:text-brand-dark'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-heading font-bold transition-all duration-200 flex items-center gap-2 ${
                billing === 'annual'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-warm-sm'
                  : 'text-brand-mid hover:text-brand-dark'
              }`}
            >
              Annual
              <span className={`text-xs px-2 py-0.5 rounded-full font-body ${billing === 'annual' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div ref={containerRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`price-card reveal relative flex flex-col rounded-3xl transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? 'bg-gradient-to-br from-orange-500 to-rose-500 shadow-warm-xl text-white scale-[1.03]'
                  : 'bg-white shadow-card hover:shadow-card-hover border border-brand-border/60'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className={`inline-block px-4 py-1.5 rounded-full text-xs font-heading font-bold whitespace-nowrap ${
                      plan.highlight
                        ? 'bg-white text-orange-600'
                        : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-7 flex flex-col h-full">
                {/* Plan name */}
                <h3
                  className={`font-heading font-extrabold text-xl mb-1 ${
                    plan.highlight ? 'text-white' : 'text-brand-dark'
                  }`}
                >
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mt-4 mb-6">
                  <div className="flex items-end gap-1">
                    <span
                      className={`font-heading font-extrabold text-4xl leading-none ${
                        plan.highlight ? 'text-white' : 'text-brand-dark'
                      }`}
                    >
                      {billing === 'annual' && plan.altPrice ? plan.altPrice : plan.price}
                    </span>
                    <span
                      className={`font-body text-sm mb-1 ${
                        plan.highlight ? 'text-white/70' : 'text-brand-light'
                      }`}
                    >
                      {billing === 'annual' && plan.altPeriod ? plan.altPeriod : plan.period}
                    </span>
                  </div>
                  {billing === 'annual' && plan.altPrice && (
                    <p className={`text-xs mt-1 font-body ${plan.highlight ? 'text-white/60' : 'text-brand-light'}`}>
                      Billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <svg
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white' : 'text-orange-500'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span
                        className={`font-body text-sm leading-relaxed ${
                          plan.highlight ? 'text-white/90' : 'text-brand-mid'
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={plan.ctaHref}
                  className={`w-full text-center py-3.5 rounded-full font-heading font-bold text-sm transition-all duration-200 hover:scale-[1.02] ${
                    plan.highlight
                      ? 'bg-white text-orange-600 hover:bg-orange-50 shadow-lg'
                      : 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-warm-sm hover:shadow-warm-md'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
