export type PlanTier = 'free' | 'consumer' | 'professional' | 'business'

export const TIER_CAPS: Record<PlanTier, { retailers: number; schedules: number }> = {
  free:         { retailers: 3,        schedules: 3 },
  consumer:     { retailers: 5,        schedules: 10 },
  professional: { retailers: 10,       schedules: 30 },
  business:     { retailers: Infinity, schedules: Infinity },
}

export const TIER_PRICES: Record<string, string> = {
  free:         '$0',
  consumer:     '$9.99',
  professional: '$29',
  business:     '$79',
}

export const TIER_LABELS: Record<string, string> = {
  free:         'Free',
  consumer:     'Consumer',
  professional: 'Professional',
  business:     'Business',
}

/** Next tier above the given one, or null if already at top */
export const NEXT_TIER: Record<string, PlanTier | null> = {
  free:         'consumer',
  consumer:     'professional',
  professional: 'business',
  business:     null,
}
