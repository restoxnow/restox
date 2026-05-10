import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Sidebar from '@/components/dashboard/Sidebar'
import NotificationsBell from '@/components/dashboard/NotificationsBell'
import InactivityTimer from '@/components/dashboard/InactivityTimer'
import FeedbackButton from '@/components/dashboard/FeedbackButton'
import ReportIssueLink from '@/components/dashboard/ReportIssueLink'
import DashboardErrorBoundary from '@/components/dashboard/DashboardErrorBoundary'
import FocusGroupBanner from '@/components/dashboard/FocusGroupBanner'
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
    .select('is_admin, plan_tier, focus_group_access_expires_at')
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

  const focusGroupExpiresAt: string | null =
    (profile?.focus_group_access_expires_at as string | null) ?? null

  return (
    <UserProvider isAdmin={isAdmin} planTier={planTier}>
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-rx-navy">
      <InactivityTimer />
      <FeedbackButton />
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        planTier={planTier}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white dark:bg-[#16213E] border-b border-gray-100 dark:border-white/10 flex items-center justify-between px-6 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search products, retailers…"
              className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
                rounded-lg focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                w-60 font-body placeholder:text-gray-400 dark:placeholder:text-gray-600 dark:text-white"
            />
          </div>
          <NotificationsBell />
        </header>

        {/* Focus group expiry banner — shown within 7 days of expiry */}
        {focusGroupExpiresAt && (
          <FocusGroupBanner expiresAt={focusGroupExpiresAt} />
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <DashboardErrorBoundary>
            {children}
          </DashboardErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="shrink-0 bg-white dark:bg-[#16213E] border-t border-gray-100 dark:border-white/10 px-6 py-2.5">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-3 flex-wrap text-[11px] text-gray-400 dark:text-gray-600 font-body">
              <span>© 2026 Restox LLC</span>
              <span className="text-gray-200 dark:text-white/10">·</span>
              <a href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Privacy Policy</a>
              <span className="text-gray-200 dark:text-white/10">·</span>
              <a href="/terms" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Terms of Service</a>
              <span className="text-gray-200 dark:text-white/10">·</span>
              <a href="mailto:support@restox.net" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">support@restox.net</a>
              <span className="text-gray-200 dark:text-white/10">·</span>
              <ReportIssueLink />
            </div>
            <p className="text-[10px] text-gray-300 dark:text-gray-700 font-body">
              As an Amazon Associate, Restox earns from qualifying purchases.
            </p>
          </div>
        </footer>
      </div>
    </div>
    </UserProvider>
  )
}
