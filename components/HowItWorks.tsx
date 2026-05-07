'use client'
import { useEffect, useRef } from 'react'

const steps = [
  {
    number: '01',
    title: 'Connect Your Retailers',
    description:
      'Link your Amazon, Walmart, grocery, and other accounts. Restox syncs your purchase history automatically.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: 'orange',
  },
  {
    number: '02',
    title: 'Set Your Schedules',
    description:
      'Tell Restox what you buy and how often. Our AI suggests the perfect reorder timing based on your patterns.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'amber',
  },
  {
    number: '03',
    title: 'Sit Back and Restock',
    description:
      'Restox handles the reordering automatically. You get notified when orders are placed — nothing else to do.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
      </svg>
    ),
    color: 'rose',
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string; num: string }> = {
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    border: 'border-orange-200',
    num: 'text-orange-500',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    border: 'border-amber-200',
    num: 'text-amber-500',
  },
  rose: {
    bg: 'bg-rose-100',
    text: 'text-rose-600',
    border: 'border-rose-200',
    num: 'text-rose-500',
  },
}

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cards = container.querySelectorAll('.step-card')
    const observers: IntersectionObserver[] = []

    cards.forEach((card, i) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => card.classList.add('revealed'), i * 150)
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

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-orange-500 font-heading font-bold text-sm uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="section-heading mb-4">Up and running in minutes</h2>
          <p className="section-subheading max-w-xl mx-auto">
            No complicated setup. No steep learning curve. Just connect, configure, and let Restox do the work.
          </p>
        </div>

        {/* Steps */}
        <div ref={containerRef} className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px bg-gradient-to-r from-orange-200 via-amber-200 to-rose-200 z-0" />

          {steps.map((step, i) => {
            const c = colorMap[step.color]
            return (
              <div
                key={step.number}
                className="step-card reveal relative z-10 flex flex-col items-center text-center"
              >
                {/* Icon circle */}
                <div
                  className={`w-16 h-16 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center mb-6 border-2 ${c.border} shadow-warm-sm`}
                >
                  {step.icon}
                </div>

                {/* Step number */}
                <span className={`font-heading font-extrabold text-5xl ${c.num} opacity-20 mb-2 leading-none`}>
                  {step.number}
                </span>

                <h3 className="font-heading font-extrabold text-xl text-brand-dark mb-3">{step.title}</h3>
                <p className="text-brand-mid font-body text-base leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <a href="#waitlist" className="btn-primary">
            Get Early Access
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
