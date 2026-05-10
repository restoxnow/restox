import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  // Two-query pattern: profile for tier, then schedules
  const [profileRes, schedulesRes] = await Promise.all([
    admin
      .from('users')
      .select('plan_tier, is_admin')
      .eq('id', user.id)
      .single(),
    admin
      .from('purchase_schedules')
      .select('id, product_name, retailer, subscription_interval_days, subscription_confidence, ai_managed')
      .eq('user_id', user.id)
      .eq('subscription_detected', true)
      .eq('status', 'active')
      .order('product_name', { ascending: true }),
  ])

  const planTier = (profileRes.data?.plan_tier as string) ?? 'free'
  const isAdmin = (profileRes.data?.is_admin as boolean) ?? false
  const isPro = isAdmin || ['professional', 'business'].includes(planTier)

  const schedules = schedulesRes.data ?? []

  if (isPro) {
    // Full list for Professional+ and admins
    return NextResponse.json({ count: schedules.length, products: schedules })
  }

  // Free/Consumer: return count only — do not leak product names
  return NextResponse.json({ count: schedules.length, products: null })
}
