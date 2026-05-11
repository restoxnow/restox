'use client'
import { useEffect, useState } from 'react'

interface HeroProps {
  waitlistCount: number
}

export default function Hero({ waitlistCount }: HeroProps) {
  const [count, setCount] = useState(waitlistCount)

  // Animate count on mount for a nice reveal
  useEffect(() => {
    if (waitlistCount > 0) {
      let start = 0
      const increment = Math.ceil(waitlistCount / 60)
      const timer = setInterval(() => {
        start += increment
        if (start >= waitlistCount) {
          setCount(waitlistCount)
          clearInterval(timer)
        } else {
          setCount(start)
        }
      }, 20)
      return () => clearInterval(timer)
    }
  }, [waitlistCount])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-hero-bg" />

      {/* Mesh overlay */}
      <div className="absolute inset-0 mesh-overlay" />

      {/* Floating blob shapes */}
      <div
        className="absolute top-20 right-16 w-72 h-72 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, #FBBF24 0%, transparent 70%)',
          animation: 'float 7s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-24 left-12 w-64 h-64 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #F43F5E 0%, transparent 70%)',
          animation: 'floatReverse 9s ease-in-out 1s infinite',
        }}
      />
      <div
        className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
          animation: 'float 11s ease-in-out 3s infinite',
        }}
      />

      {/* Decorative rings */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full border border-white/15 pointer-events-none" style={{ transform: 'translate(16px, 16px)' }} />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          <span className="text-white text-sm font-body font-medium">Coming Soon — Join the Waitlist</span>
        </div>

        {/* Headline */}
        <h1 className="font-heading font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[1.05] tracking-tight mb-6">
          Automate the Everyday.
          <br />
          <span className="text-amber-300">Focus on What</span>
          <br />
          <span className="text-white">Matters.</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/85 font-body leading-relaxed mb-10">
          Restox connects all your retailers in one smart dashboard — Amazon, Walmart, groceries,
          beauty, office supplies and more.{' '}
          <span className="font-semibold text-white">Set it once. Never run out again.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a href="/auth/signup" className="btn-primary text-base shadow-warm-lg">
            Get started free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a href="/pricing" className="btn-glass text-base">
            See pricing
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>

        {/* Waitlist counter */}
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {['🧑', '👩', '👨', '🧑‍💼'].map((emoji, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-sm border-2 border-white/30"
                style={{
                  background: ['#F97316', '#F59E0B', '#F43F5E', '#FB923C'][i],
                }}
              >
                <span>{emoji}</span>
              </div>
            ))}
          </div>
          <div className="text-white text-sm font-body">
            <span className="font-bold text-amber-300">{count > 0 ? count.toLocaleString() : '—'}</span>
            {count === 1 ? ' person' : ' people'} already on the waitlist
          </div>
          <svg className="w-4 h-4 text-amber-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <a href="#social-proof" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors group">
            <span className="text-xs font-body">Scroll</span>
            <svg
              className="w-5 h-5 group-hover:translate-y-1 transition-transform"
              style={{ animation: 'float 2s ease-in-out infinite' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
