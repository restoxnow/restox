'use client'
import { useEffect, useRef, useState } from 'react'

type Plan = {
  name: string
  badge?: string
  price: string
  annualPrice?: string
  annualPeriod?: string
  period: string
  retailers: string
  schedules: string
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
    retailers: '3 retailers',
    schedules: '3 schedules',
    features: [
      'Manual ordering only',
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
    annualPrice: '$89',
    annualPeriod: '/year',
    retailers: '5 retailers',
    schedules: '10 schedules',
    features: [
      'Price Compare',
      'AI Reorder Timing',
      'Full automation',
      'Ad-free experience',
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
    annualPrice: '$269',
    annualPeriod: '/year',
    retailers: '10 retailers',
    schedules: '30 schedules',
    features: [
      'Everything in Consumer',
      'Spend Intelligence',
      'Order History AI',
      'Priority support',
    ],
    cta: 'Join Waitlist',
    ctaHref: '#waitlist',
  },
  {
    name: 'Business',
    price: '$79',
    period: '/month',
    annualPrice: '$749',
    annualPeriod: '/year',
    retailers: 'Unlimited retailers',
    schedules: 'Unlimited schedules',
    features: [
      'Everything in Professional',
      'Seasonal Forecasting',
      'Advanced Analytics',
      'Multi-user seats',
      'Approval workflows',
      'Priority support',
    ],
    cta: 'Contact Us',
    ctaHref: 'mailto:hello@restox.net',
  },
]

// Feature comparison table rows
const FEATURE_TABLE = [
  { label: 'Retailers',                  free: '3',   consumer: '5',   professional: '10',  business: 'Unlimited' },
  { label: 'Schedules',                  free: '3',   consumer: '10',  professional: '30',  business: 'Unlimited' },
  { label: 'Price Compare',             free: false, consumer: true,  professional: true,  business: true },
  { label: 'AI Reorder Timing',         free: false, consumer: true,  professional: true,  business: true },
  { label: 'Spend Intelligence',        free: false, consumer: false, professional: true,  business: true },
  { label: 'Order History AI',          free: false, consumer: false, professional: true,  business: true },
  { label: 'Seasonal Forecasting',      free: false, consumer: false, professional: false, business: true },
  { label: 'Advanced Analytics',        free: false, consumer: false, professional: false, business: true },
  { label: 'Multi-user / Team',         free: false, consumer: false, professional: false, business: true },
  { label: 'Priority Support',          free: false, consumer: false, professional: false, business: true },
  { label: 'Ad-free',                   free: false, consumer: true,  professional: true,  business: true },
]

function Check() {
  return (
    <svg className="w-4 h-4 text-orange-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function Dash() {
  return <span className="text-gray-300 block text-center">—</span>
}

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [showTable, setShowTable] = useState(false)
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

        {/* Focus group code link */}
        <p className="text-center text-sm text-brand-mid font-body mt-2 mb-6">
          Focus group member?{' '}
          <a href="/dashboard/settings?tab=billing" className="text-orange-500 hover:text-orange-600 font-semibold underline underline-offset-2 transition-colors">
            Redeem your code
          </a>
        </p>

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

                {/* Caps */}
                <p className={`text-xs font-body mb-3 ${plan.highlight ? 'text-white/70' : 'text-brand-light'}`}>
                  {plan.retailers} · {plan.schedules}
                </p>

                {/* Price */}
                <div className="mt-2 mb-6">
                  <div className="flex items-end gap-1">
                    <span
                      className={`font-heading font-extrabold text-4xl leading-none ${
                        plan.highlight ? 'text-white' : 'text-brand-dark'
                      }`}
                    >
                      {billing === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price}
                    </span>
                    <span
                      className={`font-body text-sm mb-1 ${
                        plan.highlight ? 'text-white/70' : 'text-brand-light'
                      }`}
                    >
                      {billing === 'annual' && plan.annualPeriod ? plan.annualPeriod : plan.period}
                    </span>
                  </div>
                  {billing === 'annual' && plan.annualPrice && (
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

        {/* Feature comparison table toggle */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowTable(t => !t)}
            className="text-sm font-semibold text-brand-mid hover:text-orange-500 transition-colors font-body"
          >
            {showTable ? 'Hide' : 'Compare all features'} ↕
          </button>
        </div>

        {showTable && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-5 py-4 font-heading font-bold text-brand-dark w-48">Feature</th>
                  {['Free', 'Consumer', 'Professional', 'Business'].map(n => (
                    <th key={n} className="px-4 py-4 font-heading font-bold text-brand-dark text-center">{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_TABLE.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                    <td className="px-5 py-3 text-brand-mid font-body">{row.label}</td>
                    {(['free', 'consumer', 'professional', 'business'] as const).map(tier => (
                      <td key={tier} className="px-4 py-3 text-center font-body text-brand-mid">
                        {typeof row[tier] === 'boolean'
                          ? row[tier] ? <Check /> : <Dash />
                          : <span className="text-xs font-semibold">{row[tier]}</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
