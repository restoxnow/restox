import { createClient } from '@supabase/supabase-js'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import SocialProof from '@/components/SocialProof'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Pricing from '@/components/Pricing'
import Waitlist from '@/components/Waitlist'
import About from '@/components/About'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'

async function getWaitlistCount(): Promise<number> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function HomePage() {
  const waitlistCount = await getWaitlistCount()

  return (
    <main>
      <Nav />
      <Hero waitlistCount={waitlistCount} />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Pricing />
      <Waitlist />
      <About />
      <FAQ />
      <Footer />
    </main>
  )
}
