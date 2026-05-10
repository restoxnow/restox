'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { TIER_LABELS } from '@/lib/tier-caps'
import type { PlanTier } from '@/lib/tier-caps'

interface AffectedRetailer { id: string; name: string }
interface AffectedSchedule { id: string; product_name: string; retailer: string }

interface PreviewData {
  targetTier: string
  excessRetailers: AffectedRetailer[]
  excessSchedules: AffectedSchedule[]
  productCount: number
  totalRetailers: number
  totalSchedules: number
}

interface Props {
  targetTier: PlanTier
  onClose: () => void
  onConfirmed: () => void
}

export default function DowngradeWarningModal({ targetTier, onClose, onConfirmed }: Props) {
  const [preview, setPreview]     = useState<PreviewData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/billing/downgrade-preview?tier=${targetTier}`)
      .then(r => r.json())
      .then(d => { setPreview(d); setLoading(false) })
      .catch(() => { setError('Failed to load preview'); setLoading(false) })
  }, [targetTier])

  const handleConfirm = async () => {
    setConfirming(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier }),
      })
      if (!res.ok) throw new Error('Downgrade failed')
      onConfirmed()
    } catch {
      setError('Downgrade failed — please try again')
    } finally {
      setConfirming(false)
    }
  }

  const tierLabel = TIER_LABELS[targetTier] ?? targetTier

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#16213E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="font-heading font-bold text-rx-navy dark:text-white text-base">
              Before you downgrade
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-rx-orange" />
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {/* Impact summary */}
              {(preview.excessRetailers.length > 0 || preview.excessSchedules.length > 0) ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-body">
                    You have{' '}
                    {preview.excessRetailers.length > 0 && (
                      <span className="font-semibold text-rx-navy dark:text-white">
                        {preview.excessRetailers.length} retailer{preview.excessRetailers.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {preview.excessRetailers.length > 0 && preview.excessSchedules.length > 0 && ', '}
                    {preview.excessSchedules.length > 0 && (
                      <span className="font-semibold text-rx-navy dark:text-white">
                        {preview.excessSchedules.length} schedule{preview.excessSchedules.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {preview.productCount > 0 && (
                      <>, and <span className="font-semibold text-rx-navy dark:text-white">{preview.productCount} product{preview.productCount !== 1 ? 's' : ''}</span></>
                    )}
                    {' '}that exceed the {tierLabel} plan limits.
                  </p>

                  {/* Affected retailers */}
                  {preview.excessRetailers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-body mb-2">
                        Retailers that will be suspended
                      </p>
                      <ul className="space-y-1">
                        {preview.excessRetailers.map(r => (
                          <li key={r.id} className="flex items-center gap-2 text-sm text-rx-navy dark:text-white font-body">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            {r.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Affected schedules */}
                  {preview.excessSchedules.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-body mb-2">
                        Schedules that will be suspended
                      </p>
                      <ul className="space-y-1 max-h-40 overflow-y-auto">
                        {preview.excessSchedules.map(s => (
                          <li key={s.id} className="flex items-center gap-2 text-sm font-body">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-rx-navy dark:text-white truncate">{s.product_name}</span>
                            <span className="text-gray-400 dark:text-gray-500 text-xs shrink-0">· {s.retailer}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-body leading-relaxed">
                      Automated orders will pause for all suspended items. Your data will be saved and can be restored by upgrading again.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-body">
                  Downgrading to {tierLabel} won&apos;t affect any of your current data — you&apos;re within the limits.
                </p>
              )}

              {error && (
                <p className="text-xs text-red-500 font-body">{error}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-500 font-body">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body"
          >
            Keep my current plan
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || confirming}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {confirming ? <><Loader2 size={13} className="animate-spin" /> Processing…</> : 'Confirm downgrade'}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
