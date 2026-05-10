'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useUserTier } from '@/contexts/UserContext'
import NudgePreviewPanel from './NudgePreviewPanel'

interface NudgeStatus {
  count: number
  eligible: boolean
  shouldShow: boolean
  nudgeEmailUnsubscribed: boolean
}

export default function NudgeBanner() {
  const { planTier, bypassGates, isConsumerOrAbove, isProfessionalOrAbove } = useUserTier()
  const [status, setStatus] = useState<NudgeStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  // Only relevant for Free and Consumer (not admin, not Pro+)
  const isEligible = !bypassGates && !isProfessionalOrAbove

  useEffect(() => {
    if (!isEligible) return
    fetch('/api/nudge/status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {})
  }, [isEligible])

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
    fetch('/api/nudge/dismiss', { method: 'POST' }).catch(() => {})
  }

  if (!isEligible || dismissed || !status?.shouldShow) return null

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowPanel(true)}
        onKeyDown={e => e.key === 'Enter' && setShowPanel(true)}
        className="mx-6 mt-3 flex items-center gap-3 px-4 py-3 bg-rx-navy text-white rounded-xl cursor-pointer
          hover:bg-rx-navy/90 transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-rx-orange/20 flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-rx-orange" />
        </div>
        <p className="flex-1 text-sm font-body">
          <span className="font-semibold">Restox detected {status.count} product{status.count !== 1 ? 's' : ''}</span>
          {' '}in your connected retailers that you reorder regularly.{' '}
          <span className="text-rx-orange font-semibold group-hover:underline">
            Upgrade to Professional to view them →
          </span>
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-white/40 hover:text-white/80 transition-colors shrink-0 ml-2"
        >
          <X size={15} />
        </button>
      </div>

      {showPanel && (
        <NudgePreviewPanel
          count={status.count}
          onClose={() => setShowPanel(false)}
        />
      )}
    </>
  )
}
