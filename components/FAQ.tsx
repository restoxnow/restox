'use client'
import { useState, useRef, useEffect } from 'react'

const faqs = [
  {
    question: 'Is Restox free?',
    answer:
      "Yes — Restox has a free tier that lets you manage up to 5 purchase schedules at no cost. The free tier is ad-supported. For unlimited schedules, full automation, and an ad-free experience, our Consumer plan starts at $9.99/month.",
  },
  {
    question: 'Which retailers does Restox support?',
    answer:
      "Restox currently supports Amazon, Walmart, Target, Costco, Kroger, Sephora, Staples, and Home Depot, with more retailers being added regularly. Our browser extension works with hundreds of additional retailers for manual schedule creation.",
  },
  {
    question: 'How does AI Reorder Timing work?',
    answer:
      "Restox analyzes your purchase history, household or business size, and seasonal patterns to predict exactly when you'll run out of each product. Instead of guessing how often to reorder, Restox learns your actual consumption rate and adjusts your schedule automatically over time.",
  },
  {
    question: 'Is my purchase data safe and private?',
    answer:
      "Absolutely. Restox uses bank-level encryption for all data. We never sell your personal information or purchase history to third parties. Our Spend Intelligence feature requires explicit opt-in and uses read-only access to your accounts. You can delete your data at any time.",
  },
  {
    question: 'When will Restox launch?',
    answer:
      "We're currently in development and building toward our beta launch. Waitlist members will receive early access before the public launch, along with founding member pricing that locks in your rate permanently.",
  },
]

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`border-b border-brand-border/60 last:border-0 transition-colors ${open ? 'bg-orange-50/40' : ''} rounded-2xl`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="flex items-center gap-4">
          <span
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-bold transition-all duration-200 ${
              open
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
                : 'bg-orange-100 text-orange-500'
            }`}
          >
            {index + 1}
          </span>
          <span
            className={`font-heading font-bold text-base transition-colors duration-200 ${
              open ? 'text-orange-600' : 'text-brand-dark group-hover:text-orange-600'
            }`}
          >
            {question}
          </span>
        </span>
        <svg
          className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
            open ? 'rotate-180 text-orange-500' : 'text-brand-light group-hover:text-orange-400'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: open ? (contentRef.current?.scrollHeight ?? 1000) + 'px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <p className="px-6 pb-5 pl-[4.25rem] text-brand-mid font-body text-base leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  )
}

export default function FAQ() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const items = el.querySelectorAll('.faq-reveal')
    const observers: IntersectionObserver[] = []
    items.forEach((item, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => item.classList.add('revealed'), i * 80)
            obs.disconnect()
          }
        },
        { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
      )
      obs.observe(item)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <section id="faq" ref={ref} className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="faq-reveal reveal text-orange-500 font-heading font-bold text-sm uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="faq-reveal reveal reveal-d1 section-heading mb-4">
            Questions? We&apos;ve got answers.
          </h2>
        </div>

        <div className="faq-reveal reveal reveal-d2 bg-white rounded-3xl border border-brand-border/60 shadow-card divide-y divide-brand-border/60 overflow-hidden">
          {faqs.map((faq, i) => (
            <FAQItem key={i} {...faq} index={i} />
          ))}
        </div>

        <div className="faq-reveal reveal reveal-d3 text-center mt-10">
          <p className="text-brand-mid font-body text-base mb-4">Still have questions?</p>
          <a
            href="mailto:hello@restox.net"
            className="inline-flex items-center gap-2 text-orange-600 font-heading font-bold hover:text-orange-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            hello@restox.net
          </a>
        </div>
      </div>
    </section>
  )
}
