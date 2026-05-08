import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'fall'
  return 'winter'
}

function getUpcomingHolidays(now: Date): string[] {
  const month = now.getMonth() // 0-indexed
  const day = now.getDate()
  const holidays: string[] = []
  const windowEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const wMonth = windowEnd.getMonth()
  const wDay = windowEnd.getDate()

  const inWindow = (hMonth: number, hDay: number) => {
    const h = new Date(now.getFullYear(), hMonth, hDay)
    if (h < now) {
      // Try next year
      const hn = new Date(now.getFullYear() + 1, hMonth, hDay)
      return hn >= now && hn <= windowEnd
    }
    return h <= windowEnd
  }

  if (inWindow(0, 1))   holidays.push("New Year's Day")
  if (inWindow(1, 14))  holidays.push("Valentine's Day")
  if (inWindow(2, 17))  holidays.push("St. Patrick's Day")
  if (inWindow(4, 11))  holidays.push("Mother's Day") // approx
  if (inWindow(6, 4))   holidays.push("Independence Day")
  if (inWindow(8, 1))   holidays.push("Labor Day") // approx
  if (inWindow(9, 31))  holidays.push("Halloween")
  if (inWindow(10, 27)) holidays.push("Thanksgiving") // approx
  if (inWindow(11, 25)) holidays.push("Christmas")
  if (inWindow(11, 31)) holidays.push("New Year's Eve")

  return holidays
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { product_id } = body
  if (!product_id) return NextResponse.json({ error: 'Missing product_id' }, { status: 400 })

  // Fetch product + schedule + user profile in parallel
  const [productRes, scheduleRes, userRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, reorder_quantity, retailers ( name )')
      .eq('id', product_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('purchase_schedules')
      .select('frequency, status')
      .eq('product_id', product_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('users')
      .select('household_size, plan_tier')
      .eq('id', user.id)
      .single(),
  ])

  const product = productRes.data as any
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const schedule = scheduleRes.data as any
  const userProfile = userRes.data as any

  const now = new Date()
  const month = now.getMonth()
  const season = getSeason(month)
  const holidays = getUpcomingHolidays(now)
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const householdSize = userProfile?.household_size ?? 2
  const planTier = userProfile?.plan_tier ?? 'free'
  const frequency = schedule?.frequency ?? 'monthly'
  const isBusiness = planTier === 'business'

  const prompt = `You are a household supply expert AI. Analyze reorder timing for this product and return ONLY valid JSON.

Product: ${product.name}
Category: ${product.category ?? 'household supplies'}
Retailer: ${(product.retailers as any)?.name ?? 'unknown'}
Reorder quantity per order: ${product.reorder_quantity}
Current reorder frequency: ${frequency}
Household size: ${householdSize} ${householdSize === 1 ? 'person' : 'people'}
Current month: ${monthName}
Current season: ${season}
Upcoming holidays (next 60 days): ${holidays.length > 0 ? holidays.join(', ') : 'none'}
${isBusiness ? 'User type: Business SMB — also consider fiscal quarter patterns and B2B bulk usage' : ''}

Instructions:
1. Estimate how many days until this household would run out at normal consumption rate, given the product category, reorder quantity, and household size.
2. Consider seasonal demand: cleaning supplies spike in spring, sunscreen in summer, cold/flu medicine and vitamins spike in winter/fall, grilling supplies in summer, baking goods around Thanksgiving/Christmas.
3. Consider upcoming holidays: holidays often increase consumption of certain product categories.
4. If seasonal or holiday adjustments apply, describe them concisely.
5. Recommend whether the current frequency should be adjusted.

Return ONLY this JSON object with no other text:
{
  "predicted_runout_days": <integer, days until estimated runout>,
  "confidence": "<low|medium|high>",
  "seasonal_factor": <true|false>,
  "seasonal_reasoning": "<1-2 sentence explanation of any seasonal or holiday adjustment, or empty string>",
  "recommended_frequency": "<weekly|bi-weekly|monthly|quarterly — your recommendation>",
  "adjustment_reason": "<1-2 sentence explanation of why you recommend this frequency>"
}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as any).text?.trim() ?? ''
    // Strip markdown code fences if present
    const jsonText = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const prediction = JSON.parse(jsonText)

    // Validate required fields
    const result = {
      product_id,
      user_id: user.id,
      predicted_runout_days: Number(prediction.predicted_runout_days) || 30,
      confidence: ['low', 'medium', 'high'].includes(prediction.confidence) ? prediction.confidence : 'medium',
      seasonal_factor: Boolean(prediction.seasonal_factor),
      seasonal_reasoning: String(prediction.seasonal_reasoning ?? ''),
      recommended_frequency: String(prediction.recommended_frequency ?? frequency),
      adjustment_reason: String(prediction.adjustment_reason ?? ''),
      predicted_at: new Date().toISOString(),
    }

    // Upsert into ai_timing table
    const { error: upsertError } = await supabase
      .from('ai_timing')
      .upsert(result, { onConflict: 'product_id,user_id' })

    if (upsertError) throw upsertError

    return NextResponse.json({ prediction: result })
  } catch (err: any) {
    console.error('AI timing error:', err)
    return NextResponse.json({ error: err.message ?? 'Prediction failed' }, { status: 500 })
  }
}
