'use client'

import { createPortal } from 'react-dom'
import { X, Lock, ArrowRight } from 'lucide-react'
import { TIER_PRICES, TIER_LABELS } from '@/lib/tier-caps'

interface Props {
  featureName: string
  requiredTier: 'consumer' | 'professional' | 'business'
  currentTier: string
  description?: string
  onClose: () => void
}

const TIER_FEATURES: Record<string, string[]> = {
  consumer:     ['Price Compare', 'AI Reorder Timing', 'Up to 5 retailers', 'Up to 10 schedules', 'Full automation', 'Ad-free'],
  professional: ['Everything in Consumer', 'Spend Intelligence', 'Order History AI', 'Up to 10 retailers', 'Up to 30 schedules'],
  business:     ['Everything in Professional', 'Seasonal Forecasting', 'Advanced Analytics', 'Multi-user / Team', 'Priority Support', 'Unlimited retailers & schedules'],
}

export default function UpgradePromptModal({ featureName, requiredTier, currentTier, description, onClose }: Props) {
  const price = TIER_PRICES[requiredTier] ?? ''
  const label = TIER_LABELS[requiredTier] ?? requiredTier
  const features = TIER_FEATURES[requiredTier] ?? []

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#16213E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center mb-3">
              <Lock size={20} className="text-rx-orange" />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors -mt-1 -mr-1 p-1"
            >
              <X size={16} />
            </button>
          </div>
          <h2 className="font-heading font-bold text-rx-navy dark:text-white text-lg leading-tight">
            Unlock {featureName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-body mt-1">
            {description ?? `${featureName} is available on the ${label} plan and above.`}
          </p>
        </div>

        {/* Plan card */}
        <div className="mx-6 mb-4 rounded-xl border border-rx-orange/30 bg-rx-orange/5 dark:bg-rx-orange/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading font-bold text-rx-navy dark:text-white text-sm">{label} Plan</span>
            <span className="font-heading font-bold text-rx-orange text-lg">{price}<span className="text-xs font-body text-gray-400">/mo</span></span>
          </div>
          <ul className="space-y-1">
            {features.map(f => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-body">
                <span className="w-1 h-1 rounded-full bg-rx-orange shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Current plan note */}
        <p className="px-6 text-[11px] text-gray-400 dark:text-gray-500 font-body mb-4">
          You are on the <span className="font-semibold capitalize">{TIER_LABELS[currentTier] ?? currentTier}</span> plan.
        </p>

        {/* CTAs */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <a
            href="/dashboard/settings/billing"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-rx-orange hover:bg-rx-orange/90 text-white font-semibold rounded-xl text-sm transition-colors font-heading"
          >
            Upgrade to {label} — {price}/mo
            <ArrowRight size={14} />
          </a>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-body transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
