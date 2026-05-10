'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useUserTier } from '@/contexts/UserContext'
import { TIER_LABELS } from '@/lib/tier-caps'

export default function PaymentFailureBanner() {
  const { bypassGates } = useUserTier()
  const [data, setData] = useState<{ paymentFailedAt: string | null; previousPlanTier: string | null } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (bypassGates) return
    fetch('/api/billing/status')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
  }, [bypassGates])

  if (bypassGates || dismissed || !data?.paymentFailedAt) return null

  const tierLabel = TIER_LABELS[data.previousPlanTier ?? ''] ?? 'paid'

  return (
    <div className="mx-6 mt-3 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
      <AlertCircle size={16} className="text-red-500 dark:text-red-400 shrink-0" />
      <p className="flex-1 text-sm text-red-700 dark:text-red-300 font-body">
        <span className="font-semibold">Your payment is overdue.</span>{' '}
        Update your payment method to restore your {tierLabel} features.{' '}
        <a
          href="/dashboard/settings/billing"
          className="font-semibold underline hover:no-underline transition-all"
        >
          Manage billing →
        </a>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
