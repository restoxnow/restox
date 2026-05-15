import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { TIER_CAPS, type PlanTier } from '@/lib/tier-caps'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const ALLOWED_FIELDS = new Set([
  'product_id', 'product_name', 'retailer', 'product_url', 'upc', 'asin',
  'frequency_days', 'status', 'ai_managed', 'notification_timing',
  'confirmation_required', 'notification_channel',
])

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()

  // Read plan_tier (use two-query pattern — avoid FK joins)
  const { data: profile } = await admin
    .from('users')
    .select('plan_tier, is_admin')
    .eq('id', user.id)
    .single()

  const planTier = ((profile?.plan_tier as string | null) ?? 'free') as PlanTier
  const isAdmin  = profile?.is_admin ?? false

  // Admin bypasses all caps
  if (!isAdmin) {
    const cap = TIER_CAPS[planTier]?.schedules ?? TIER_CAPS.free.schedules

    if (cap !== Infinity) {
      const { count } = await admin
        .from('purchase_schedules')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((count ?? 0) >= cap) {
        return NextResponse.json(
          { error: 'cap_reached', cap, planTier },
          { status: 403 }
        )
      }
    }
  }

  const body = await req.json().catch(() => ({}))

  // Whitelist payload fields
  const payload: Record<string, unknown> = { user_id: user.id }
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(k)) payload[k] = v
  }

  const { data, error } = await admin
    .from('purchase_schedules')
    .insert(payload)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: data.id })
}
