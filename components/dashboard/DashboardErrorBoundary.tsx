'use client'

import { useState } from 'react'
import { ErrorBoundary } from '@sentry/nextjs'
import ReportIssueModal from '@/components/ReportIssueModal'

function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <span className="text-red-500 text-xl">!</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-white font-heading">
          Something went wrong.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-body">
          We've been notified automatically.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={resetError}
          className="px-4 py-2 text-xs font-medium bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-body"
        >
          Try again
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-xs font-medium bg-rx-orange hover:bg-rx-orange/90 text-white rounded-lg transition-colors font-body"
        >
          Submit a report
        </button>
      </div>
      {showModal && <ReportIssueModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={(props) => <ErrorFallback error={props.error as Error} resetError={props.resetError} />}>
      {children}
    </ErrorBoundary>
  )
}
