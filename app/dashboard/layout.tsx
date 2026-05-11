import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { UserProvider } from '@/contexts/UserContext'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userName = user.user_metadata?.full_name as string | undefined
  const userEmail = user.email
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin, plan_tier, focus_group_access_expires_at')
    .eq('id', user.id)
    .single()

  const isAdmin: boolean =
    profile?.is_admin ??
    (user.app_metadata?.is_admin as boolean | undefined) ??
    (user.user_metadata?.is_admin as boolean | undefined) ??
    false

  const planTier: string =
    (profile?.plan_tier as string | undefined) ??
    (user.user_metadata?.plan_tier as string | undefined) ??
    'free'

  const focusGroupExpiresAt: string | null =
    (profile?.focus_group_access_expires_at as string | null) ?? null

  return (
    <UserProvider isAdmin={isAdmin} planTier={planTier}>
      <DashboardShell
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        planTier={planTier}
        focusGroupExpiresAt={focusGroupExpiresAt}
      >
        {children}
      </DashboardShell>
    </UserProvider>
  )
}
