'use client'
import { useEffect, useRef } from 'react'

const features: {
  id: string
  title: string
  tier?: string
  description: string
  gradient: string
  iconBg: string
  iconColor: string
  size: string
  icon: React.ReactNode
}[] = [
  {
    id: 'dashboard',
    title: 'One Dashboard. Every Retailer.',
    description:
      'Stop logging into Amazon, then Walmart, then your grocery app. Restox brings every repeat purchase into a single smart dashboard — so you can see, manage, and automate everything in one place.',
    gradient: 'from-orange-500 to-amber-400',
    iconBg: 'bg-gradient-to-br from-orange-100 to-amber-50',
    iconColor: 'text-orange-500',
    size: 'large',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'ai-timing',
    title: 'AI That Knows When You\'ll Run Out',
    tier: 'Consumer+',
    description:
      'Restox learns your consumption patterns and predicts exactly when to reorder — before you run out. No more last-minute panic purchases or forgotten subscriptions.',
    gradient: 'from-rose-500 to-pink-400',
    iconBg: 'bg-gradient-to-br from-rose-100 to-pink-50',
    iconColor: 'text-rose-500',
    size: 'normal',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'spend-intel',
    title: 'Discover What You\'re Already Buying',
    tier: 'Professional+',
    description:
      'Our AI scans your purchase history to surface products you buy repeatedly but haven\'t automated yet. Turn months of manual reordering into a single setup session.',
    gradient: 'from-amber-500 to-yellow-400',
    iconBg: 'bg-gradient-to-br from-amber-100 to-yellow-50',
    iconColor: 'text-amber-600',
    size: 'normal',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'extension',
    title: 'Add Anything in One Click',
    description:
      'Shopping on Amazon or Target? Our browser extension detects your purchases and offers to add them to Restox instantly — right at the moment you\'re buying.',
    gradient: 'from-teal-500 to-emerald-400',
    iconBg: 'bg-gradient-to-br from-teal-100 to-emerald-50',
    iconColor: 'text-teal-600',
    size: 'normal',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
]

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cards = container.querySelectorAll('.feature-card')
    const observers: IntersectionObserver[] = []

    cards.forEach((card, i) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('revealed'), i * 100)
            observer.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      )
      observer.observe(card)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const lead = features[0]
  const rest = features.slice(1)

  return (
    <section id="features" className="py-24 gradient-section-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-orange-500 font-heading font-bold text-sm uppercase tracking-widest mb-3">Features</p>
          <h2 className="section-heading mb-4">Everything you need.<br />Nothing you don&apos;t.</h2>
          <p className="section-subheading max-w-xl mx-auto">
            Restox is built around the way real people shop — across multiple retailers, with different habits and needs.
          </p>
        </div>

        <div ref={containerRef} className="space-y-6">
          {/* Lead feature — full width */}
          <div className="feature-card reveal">
            <div className="bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-brand-border/40">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Content side */}
                <div className="p-10 lg:p-14 flex flex-col justify-center">
                  <div className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-6 ${lead.iconBg} ${lead.iconColor}`}>
                    {lead.icon}
                  </div>
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-heading font-bold uppercase tracking-wide">
                      Core Feature
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-3xl text-brand-dark mb-4 leading-tight">
                    {lead.title}
                  </h3>
                  <p className="text-brand-mid font-body text-lg leading-relaxed">{lead.description}</p>
                </div>
                {/* Visual side */}
                <div className={`bg-gradient-to-br ${lead.gradient} p-10 lg:p-14 flex items-center justify-center min-h-[280px] md:min-h-0`}>
                  <div className="w-full max-w-xs">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 space-y-3">
                      {['Amazon Essentials', 'Walmart Groceries', 'Target Beauty', 'Costco Bulk'].map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/25 rounded-xl px-4 py-3">
                          <span className="text-white font-body font-medium text-sm">{item}</span>
                          <span className="text-white/80 text-xs font-body">
                            {['Every 30d', 'Every week', 'Every 45d', 'Every 60d'][i]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-white/70 text-center text-xs mt-4 font-body">All your retailers, one view</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 cards grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {rest.map((feature, i) => (
              <div
                key={feature.id}
                className={`feature-card reveal reveal-d${i + 1} bg-white rounded-3xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-brand-border/40`}
              >
                <div className={`inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-5 ${feature.iconBg} ${feature.iconColor}`}>
                  {feature.icon}
                </div>
                {feature.tier && (
                  <span className="inline-block mb-3 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-heading font-bold uppercase tracking-wide">
                    {feature.tier}
                  </span>
                )}
                <h3 className="font-heading font-extrabold text-xl text-brand-dark mb-3 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-brand-mid font-body text-base leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
