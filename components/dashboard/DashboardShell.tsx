'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationsBell from './NotificationsBell'
import InactivityTimer from './InactivityTimer'
import FeedbackButton from './FeedbackButton'
import ReportIssueLink from './ReportIssueLink'
import DashboardErrorBoundary from './DashboardErrorBoundary'
import FocusGroupBanner from './FocusGroupBanner'
import NudgeBanner from './NudgeBanner'
import PaymentFailureBanner from './PaymentFailureBanner'

interface Props {
  userName?: string
  userEmail?: string
  avatarUrl?: string
  planTier: string
  focusGroupExpiresAt: string | null
  children: React.ReactNode
}

export default function DashboardShell({
  userName,
  userEmail,
  avatarUrl,
  planTier,
  focusGroupExpiresAt,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Body scroll lock while mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const close = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-rx-navy">
      <InactivityTimer />
      <FeedbackButton />

      {/* ── Mobile backdrop ─────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`
          fixed inset-0 bg-black/50 z-40 md:hidden
          transition-opacity duration-300
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* ── Sidebar wrapper ─────────────────────────────────────── */}
      {/* Mobile: fixed drawer that slides in from left (z-50)      */}
      {/* Desktop: normal flow element, no translate                 */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          md:relative md:inset-auto md:z-auto md:translate-x-0 md:flex
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          planTier={planTier}
          onNavItemClick={close}
        />
      </div>

      {/* ── Main content column ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-white dark:bg-[#16213E] border-b border-gray-100 dark:border-white/10 flex items-center gap-2 px-4 shrink-0">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            className="
              md:hidden shrink-0
              flex items-center justify-center
              w-9 h-9 rounded-lg
              text-rx-navy dark:text-white
              hover:bg-gray-100 dark:hover:bg-white/10
              transition-colors
            "
          >
            {sidebarOpen ? (
              /* X icon */
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Search */}
          <div className="relative flex-1 md:flex-none">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search products, retailers…"
              className="
                pl-9 pr-4 py-1.5 text-sm
                bg-gray-50 dark:bg-white/5
                border border-gray-200 dark:border-white/10 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                w-full md:w-60
                font-body placeholder:text-gray-400 dark:placeholder:text-gray-600 dark:text-white
              "
            />
          </div>

          {/* Bell — pushed to far right */}
          <div className="ml-auto shrink-0">
            <NotificationsBell />
          </div>
        </header>

        {/* Banners */}
        <PaymentFailureBanner />
        {focusGroupExpiresAt && <FocusGroupBanner expiresAt={focusGroupExpiresAt} />}
        <NudgeBanner />

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
  )
}
