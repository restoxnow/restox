'use client'

import { createContext, useContext } from 'react'
import { TIER_CAPS, type PlanTier } from '@/lib/tier-caps'

interface UserContextValue {
  isAdmin: boolean
  planTier: string
  /** True if user should see all features — either admin or Professional+ */
  hasProAccess: boolean
}

const UserContext = createContext<UserContextValue>({
  isAdmin: false,
  planTier: 'free',
  hasProAccess: false,
})

export function UserProvider({
  children,
  isAdmin,
  planTier,
}: {
  children: React.ReactNode
  isAdmin: boolean
  planTier: string
}) {
  const hasProAccess = isAdmin || planTier === 'professional' || planTier === 'business'
  return (
    <UserContext.Provider value={{ isAdmin, planTier, hasProAccess }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)

/** Tier-aware hook with gating helpers. Admin bypasses all gates. */
export function useUserTier() {
  const { planTier, isAdmin } = useUser()
  const tier = planTier as PlanTier
  const bypassGates = isAdmin

  const isConsumerOrAbove    = bypassGates || ['consumer', 'professional', 'business'].includes(tier)
  const isProfessionalOrAbove = bypassGates || ['professional', 'business'].includes(tier)
  const isBusinessOnly        = bypassGates || tier === 'business'

  const caps = TIER_CAPS[tier] ?? TIER_CAPS.free

  return {
    planTier: tier,
    isAdmin,
    bypassGates,
    isConsumerOrAbove,
    isProfessionalOrAbove,
    isBusinessOnly,
    caps,
  }
}
