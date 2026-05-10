import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { TIER_CAPS } from '@/lib/tier-caps'
import type { PlanTier } from '@/lib/tier-caps'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetTier = (searchParams.get('tier') ?? 'free') as PlanTier

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const caps = TIER_CAPS[targetTier] ?? TIER_CAPS.free

  const [retailersRes, schedulesRes] = await Promise.all([
    supabase
      .from('retailers')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .eq('is_suspended', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('purchase_schedules')
      .select('id, product_name, retailer, created_at')
      .eq('user_id', user.id)
      .eq('is_suspended', false)
      .order('created_at', { ascending: true }),
  ])

  const retailers  = (retailersRes.data  ?? []) as { id: string; name: string; created_at: string }[]
  const schedules  = (schedulesRes.data  ?? []) as { id: string; product_name: string; retailer: string; created_at: string }[]

  const retailerCap  = caps.retailers  === Infinity ? retailers.length  : caps.retailers
  const scheduleCap  = caps.schedules  === Infinity ? schedules.length  : caps.schedules

  const excessRetailers = retailers.slice(retailerCap)
  const excessSchedules = schedules.slice(scheduleCap)

  const suspendedScheduleIds = new Set(excessSchedules.map(s => s.id))

  const productCount = suspendedScheduleIds.size > 0
    ? (await supabase
        .from('purchase_schedules')
        .select('product_name')
        .in('id', Array.from(suspendedScheduleIds))
      ).data?.length ?? 0
    : 0

  return NextResponse.json({
    targetTier,
    excessRetailers,
    excessSchedules,
    productCount,
    totalRetailers: retailers.length,
    totalSchedules: schedules.length,
  })
}
