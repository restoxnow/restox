'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-[0_2px_24px_rgba(28,17,8,0.08)] border-b border-brand-border/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <a href="#" className="flex-shrink-0 flex items-center">
            <Image
              src="/restox-logo-full.png"
              alt="Restox"
              width={140}
              height={47}
              priority
              className="h-8 w-auto object-contain"
            />
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`font-body font-medium text-sm transition-colors duration-200 ${
                  scrolled
                    ? 'text-brand-mid hover:text-brand-orange'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#waitlist"
              className={`px-5 py-2.5 rounded-full font-heading font-bold text-sm transition-all duration-200 hover:scale-[1.03] ${
                scrolled
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-warm-sm hover:shadow-warm-md'
                  : 'bg-white text-orange-600 hover:bg-orange-50 shadow-sm'
              }`}
            >
              Join Waitlist
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden p-2 rounded-xl transition-colors ${
              scrolled ? 'text-brand-dark hover:bg-brand-cream' : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl border-t border-brand-border/60 px-4 py-4 space-y-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl font-body font-medium text-brand-mid hover:text-brand-orange hover:bg-orange-50 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <a
              href="#waitlist"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-5 py-3 rounded-full font-heading font-bold text-sm bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-warm-sm"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
