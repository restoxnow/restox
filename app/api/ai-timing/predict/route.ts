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
  const holidays: string[] = []
  const windowEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const inWindow = (hMonth: number, hDay: number) => {
    const h = new Date(now.getFullYear(), hMonth, hDay)
    if (h < now) {
      const hn = new Date(now.getFullYear() + 1, hMonth, hDay)
      return hn >= now && hn <= windowEnd
    }
    return h <= windowEnd
  }

  if (inWindow(0, 1))   holidays.push("New Year's Day")
  if (inWindow(1, 14))  holidays.push("Valentine's Day")
  if (inWindow(2, 17))  holidays.push("St. Patrick's Day")
  if (inWindow(4, 11))  holidays.push("Mother's Day")
  if (inWindow(6, 4))   holidays.push("Independence Day")
  if (inWindow(8, 1))   holidays.push("Labor Day")
  if (inWindow(9, 31))  holidays.push("Halloween")
  if (inWindow(10, 27)) holidays.push("Thanksgiving")
  if (inWindow(11, 25)) holidays.push("Christmas")
  if (inWindow(11, 31)) holidays.push("New Year's Eve")

  return holidays
}

interface ForecastMonth {
  month: string
  relative_demand: number
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function normalizeForecast(raw: any): ForecastMonth[] | null {
  if (!Array.isArray(raw) || raw.length !== 12) return null
  return raw.map((item: any, i: number) => ({
    month: MONTH_NAMES[i],
    relative_demand: Math.min(1, Math.max(0, Number(item.relative_demand ?? 0.5))),
  }))
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { product_id, schedule_id } = body
  if (!product_id) return NextResponse.json({ error: 'Missing product_id' }, { status: 400 })

  // Fetch product + schedule + user profile + order history in parallel
  const [productRes, scheduleRes, userRes, historyRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, reorder_quantity, retailers!retailer_id ( name )')
      .eq('id', product_id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('purchase_schedules')
      .select('frequency_days, status')
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
    supabase
      .from('order_history')
      .select('retailer_name, order_date, items')
      .eq('user_id', user.id)
      .order('order_date', { ascending: false })
      .limit(50),
  ])

  const product = productRes.data as any
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const schedule = scheduleRes.data as any
  const userProfile = userRes.data as any
  const orderHistory = (historyRes.data ?? []) as any[]

  const now = new Date()
  const month = now.getMonth()
  const season = getSeason(month)
  const holidays = getUpcomingHolidays(now)
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const householdSize = userProfile?.household_size ?? 2
  const planTier = userProfile?.plan_tier ?? 'free'
  const freqDays = schedule?.frequency_days ?? 30
  const frequency = freqDays <= 7 ? 'weekly' : freqDays <= 14 ? 'bi-weekly' : freqDays <= 31 ? 'monthly' : 'quarterly'
  const isBusiness = planTier === 'business'

  // Summarize order history for context
  let orderHistorySummary = 'No order history available.'
  if (orderHistory.length > 0) {
    const productNameLower = product.name.toLowerCase()
    const relevantOrders = orderHistory.filter((o: any) =>
      (o.items ?? []).some((item: any) =>
        String(item.product_name ?? '').toLowerCase().includes(productNameLower.split(' ')[0])
      )
    )
    if (relevantOrders.length > 0) {
      const dates = relevantOrders.map((o: any) => o.order_date.slice(0, 10)).join(', ')
      orderHistorySummary = `This product was ordered on: ${dates} (${relevantOrders.length} matching order${relevantOrders.length !== 1 ? 's' : ''} found).`
    } else {
      const retailers = Array.from(new Set(orderHistory.map((o: any) => o.retailer_name))).join(', ')
      orderHistorySummary = `No matching orders found for this product. Order history available from: ${retailers}.`
    }
  }

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
Order history context: ${orderHistorySummary}
${isBusiness ? 'User type: Business SMB — also consider fiscal quarter patterns and B2B bulk usage' : ''}

Instructions:
1. Estimate how many days until this household would run out at normal consumption rate, given the product category, reorder quantity, and household size.
2. Consider seasonal demand: cleaning supplies spike in spring, sunscreen in summer, cold/flu medicine and vitamins spike in winter/fall, grilling supplies in summer, baking goods around Thanksgiving/Christmas.
3. Consider upcoming holidays: holidays often increase consumption of certain product categories.
4. If order history is available, use purchase dates to refine the runout estimate.
5. If seasonal or holiday adjustments apply, describe them concisely.
6. Recommend whether the current frequency should be adjusted.
7. For monthly_forecast: estimate the relative demand for each calendar month (0.0 = lowest demand, 1.0 = peak demand) based on typical seasonal patterns for this product category. The array must have exactly 12 elements in order Jan–Dec.

Return ONLY this JSON object with no other text:
{
  "predicted_runout_days": <integer, days until estimated runout>,
  "confidence": "<low|medium|high>",
  "seasonal_factor": <true|false>,
  "seasonal_reasoning": "<1-2 sentence explanation of any seasonal or holiday adjustment, or empty string>",
  "recommended_frequency": "<weekly|bi-weekly|monthly|quarterly — your recommendation>",
  "adjustment_reason": "<1-2 sentence explanation of why you recommend this frequency>",
  "monthly_forecast": [
    {"month": "Jan", "relative_demand": 0.0},
    {"month": "Feb", "relative_demand": 0.0},
    {"month": "Mar", "relative_demand": 0.0},
    {"month": "Apr", "relative_demand": 0.0},
    {"month": "May", "relative_demand": 0.0},
    {"month": "Jun", "relative_demand": 0.0},
    {"month": "Jul", "relative_demand": 0.0},
    {"month": "Aug", "relative_demand": 0.0},
    {"month": "Sep", "relative_demand": 0.0},
    {"month": "Oct", "relative_demand": 0.0},
    {"month": "Nov", "relative_demand": 0.0},
    {"month": "Dec", "relative_demand": 0.0}
  ]
}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as any).text?.trim() ?? ''
    const jsonText = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const prediction = JSON.parse(jsonText)

    const monthly_forecast = normalizeForecast(prediction.monthly_forecast)

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

    const [upsertResult] = await Promise.all([
      supabase
        .from('ai_timing')
        .upsert(result, { onConflict: 'product_id,user_id' }),
      // Store monthly_forecast on the schedule if schedule_id provided
      schedule_id && monthly_forecast
        ? supabase
            .from('purchase_schedules')
            .update({ monthly_forecast })
            .eq('id', schedule_id)
            .eq('user_id', user.id)
        : Promise.resolve({ error: null }),
    ])

    if (upsertResult.error) throw upsertResult.error

    return NextResponse.json({ prediction: { ...result, monthly_forecast } })
  } catch (err: any) {
    console.error('AI timing error:', err)
    return NextResponse.json({ error: err.message ?? 'Prediction failed' }, { status: 500 })
  }
}
