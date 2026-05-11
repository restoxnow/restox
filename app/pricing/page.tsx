import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Pricing — Restox™',
  description: 'Simple, transparent pricing. Start free, upgrade when ready. No credit card required.',
}

const FAQS = [
  {
    q: 'Can I change my plan anytime?',
    a: 'Yes — upgrade or downgrade anytime from your account settings. Changes take effect immediately.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Your retailers, schedules, and products are saved and suspended — not deleted. Upgrade again to restore everything instantly.',
  },
  {
    q: 'Is there a free trial?',
    a: 'The Free plan is free forever — no credit card required. You can use Restox™ for free as long as you like.',
  },
  {
    q: 'What retailers are supported?',
    a: 'Amazon is fully live. More retailers coming soon including Kroger, Walmart, Instacart, and others.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel anytime from your account settings with no cancellation fees. Your data stays safe.',
  },
]

export default async function PricingPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard/settings?tab=billing')

  return (
    <main className="min-h-screen" style={{ background: '#FFFBF7' }}>
      <Nav />

      {/* Hero */}
      <section className="pt-36 pb-4 text-center px-4">
        <p className="text-orange-500 font-heading font-bold text-sm uppercase tracking-widest mb-3">
          Pricing
        </p>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-brand-dark leading-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="max-w-xl mx-auto text-brand-mid font-body text-lg leading-relaxed mb-2">
          Start free — no credit card required. Upgrade when you need more.
        </p>
        <p className="text-sm text-brand-light font-body">
          Annual plans save 17% — that&apos;s two months free.
        </p>
      </section>

      {/* Pricing section */}
      <Pricing />

      {/* FAQ */}
      <section className="py-20 max-w-2xl mx-auto px-4">
        <h2 className="font-heading font-extrabold text-2xl text-brand-dark mb-10 text-center">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-brand-border">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-heading font-bold text-brand-dark text-sm">
                {q}
                <svg
                  className="w-4 h-4 text-brand-light shrink-0 ml-4 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-brand-mid font-body text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="py-16 text-center px-4 bg-white border-t border-brand-border/60">
        <h2 className="font-heading font-extrabold text-2xl text-brand-dark mb-3">
          Ready to stop running out of things?
        </h2>
        <p className="text-brand-mid font-body mb-8 max-w-md mx-auto">
          Join Restox™ free today — no credit card, no commitment.
        </p>
        <a
          href="/auth/signup"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-heading font-bold text-sm bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-warm-md hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200"
        >
          Get started free
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </section>

      <Footer />
    </main>
  )
}
