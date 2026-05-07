'use client'
import { useRef, useEffect } from 'react'

export default function About() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const items = el.querySelectorAll('.about-reveal')
    const observers: IntersectionObserver[] = []
    items.forEach((item, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => item.classList.add('revealed'), i * 120)
            obs.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
      )
      obs.observe(item)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const stats = [
    { label: 'Retailers Supported', value: '8+', sub: 'and growing' },
    { label: 'Setup Time', value: '<5', sub: 'minutes' },
    { label: 'Time Saved', value: '∞', sub: 'no more running out' },
  ]

  return (
    <section id="about" ref={ref} className="py-24 gradient-section-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text side */}
          <div>
            <p className="about-reveal reveal text-orange-500 font-heading font-bold text-sm uppercase tracking-widest mb-3">
              About Restox
            </p>
            <h2 className="about-reveal reveal reveal-d1 section-heading mb-6">
              Built for the way<br />you actually shop
            </h2>
            <div className="space-y-4 text-brand-mid font-body text-base leading-relaxed">
              <p className="about-reveal reveal reveal-d2">
                Restox was built to solve a problem every household and business faces — the endless cycle of
                remembering, reordering, and running out. We believe automation shouldn&apos;t be complicated
                or locked inside a single retailer&apos;s ecosystem.
              </p>
              <p className="about-reveal reveal reveal-d3">
                Restox is a cross-retailer replenishment platform designed for real people with real purchasing
                patterns. Whether you&apos;re managing a household, a small team, or a growing business, Restox
                puts your recurring purchases on autopilot — so you can focus on what actually matters.
              </p>
              <p className="about-reveal reveal reveal-d4 font-semibold text-brand-dark">
                Based in Nevada. Built for everyone.
              </p>
            </div>
          </div>

          {/* Stats side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-5">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`about-reveal reveal reveal-d${i + 1} bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-brand-border/60`}
              >
                <div className="flex items-end gap-3">
                  <span className="font-heading font-extrabold text-5xl text-gradient leading-none">
                    {stat.value}
                  </span>
                  <div className="pb-1">
                    <p className="font-heading font-bold text-brand-dark text-sm">{stat.label}</p>
                    <p className="font-body text-brand-light text-xs">{stat.sub}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Social links */}
            <div className="about-reveal reveal reveal-d4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
              <p className="font-heading font-bold text-brand-dark text-sm mb-3">Follow our journey</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Instagram', href: 'https://instagram.com/restoxnow' },
                  { label: 'X / Twitter', href: 'https://twitter.com/restoxnow' },
                  { label: 'TikTok', href: 'https://tiktok.com/@restoxnow' },
                  { label: 'LinkedIn', href: 'https://linkedin.com/company/restoxnow' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-white border border-orange-200 text-orange-600 text-xs font-heading font-bold hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200"
                  >
                    @restoxnow
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
