'use client'

import { createContext, useContext } from 'react'

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
