export interface DetectionResult {
  isLikelySubscription: boolean
  detectedIntervalDays: number | null
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Given a sorted (descending) list of order dates for a specific product+retailer,
 * detect whether the ordering pattern looks like an existing subscription.
 *
 * Rules:
 *  - Need ≥ 3 matching orders
 *  - Intervals between consecutive orders must all be within ±5 days of each other
 *  - High: 4+ consistent orders | Medium: 3 consistent | Low: fallthrough
 */
export function detectSubscription(orderDates: string[]): DetectionResult {
  const none: DetectionResult = {
    isLikelySubscription: false,
    detectedIntervalDays: null,
    confidence: 'low',
  }

  if (orderDates.length < 3) return none

  // Sort ascending so we can compute chronological intervals
  const sorted = [...orderDates]
    .map(d => new Date(d).getTime())
    .sort((a, b) => a - b)

  const intervals: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(Math.round((sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24)))
  }

  const avg = Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length)
  const consistent = intervals.every(iv => Math.abs(iv - avg) <= 5)

  if (!consistent) return none

  const confidence: DetectionResult['confidence'] =
    orderDates.length >= 4 ? 'high' : 'medium'

  return {
    isLikelySubscription: true,
    detectedIntervalDays: avg,
    confidence,
  }
}

/**
 * Returns true if any item in the order's items array fuzzy-matches productName.
 * Uses the first significant word of productName for robustness.
 */
export function orderMatchesProduct(
  items: { product_name?: string }[],
  productName: string,
): boolean {
  const needle = productName.toLowerCase().split(/\s+/).filter(w => w.length > 3)[0] ?? productName.toLowerCase()
  return items.some(item =>
    (item.product_name ?? '').toLowerCase().includes(needle)
  )
}
