import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Sidebar from '@/components/dashboard/Sidebar'
import NotificationsBell from '@/components/dashboard/NotificationsBell'
import InactivityTimer from '@/components/dashboard/InactivityTimer'
import { UserProvider } from '@/contexts/UserContext'
import { Search } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userName = user.user_metadata?.full_name as string | undefined
  const userEmail = user.email
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin, plan_tier')
    .eq('id', user.id)
    .single()

  // is_admin: prefer public.users row, then app_metadata (set via Supabase dashboard), then user_metadata
  const isAdmin: boolean =
    profile?.is_admin ??
    (user.app_metadata?.is_admin as boolean | undefined) ??
    (user.user_metadata?.is_admin as boolean | undefined) ??
    false

  const planTier: string =
    (profile?.plan_tier as string | undefined) ??
    (user.user_metadata?.plan_tier as string | undefined) ??
    'free'

  return (
    <UserProvider isAdmin={isAdmin} planTier={planTier}>
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <InactivityTimer />
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        planTier={planTier}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, retailers…"
              className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                w-60 font-body placeholder:text-gray-400"
            />
          </div>
          <NotificationsBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
    </UserProvider>
  )
}
