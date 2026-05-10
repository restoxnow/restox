'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Lock, Sparkles, CheckCircle, Loader2 } from 'lucide-react'
import { useUserTier } from '@/contexts/UserContext'

interface DetectedProduct {
  id: string
  product_name: string
  retailer: string
  subscription_interval_days: number | null
  subscription_confidence: string | null
  ai_managed: boolean
}

interface Props {
  count: number
  onClose: () => void
}

function intervalLabel(days: number | null): string {
  if (!days) return 'Recurring'
  if (days <= 10) return 'Weekly'
  if (days <= 18) return 'Every 2 weeks'
  if (days <= 35) return 'Monthly'
  if (days <= 55) return 'Every 6 weeks'
  if (days <= 70) return 'Every 2 months'
  return 'Quarterly'
}

export default function NudgePreviewPanel({ count, onClose }: Props) {
  const { isProfessionalOrAbove, bypassGates } = useUserTier()
  const isPro = isProfessionalOrAbove || bypassGates

  const [products, setProducts] = useState<DetectedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)

  useEffect(() => {
    fetch('/api/nudge/products')
      .then(r => r.json())
      .then(d => {
        if (d.products) setProducts(d.products)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(products.map(p => p.id)))
  const clearAll  = () => setSelected(new Set())

  const handleImport = async () => {
    if (selected.size === 0) return
    setImporting(true)
    try {
      await fetch('/api/nudge/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleIds: Array.from(selected) }),
      })
      setImportDone(true)
    } catch { /* non-fatal */ }
    setImporting(false)
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#16213E] rounded-2xl w-full max-w-lg shadow-2xl dark:shadow-black/60 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rx-orange/10 flex items-center justify-center">
              <Sparkles size={15} className="text-rx-orange" />
            </div>
            <div>
              <p className="font-heading font-semibold text-rx-navy dark:text-white text-sm">
                Detected Recurring Products
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
                {count} product{count !== 1 ? 's' : ''} in your connected retailers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-rx-orange" />
            </div>
          ) : isPro ? (
            /* ── Professional+ — full unblurred list ── */
            importDone ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle size={36} className="text-green-500 mb-3" />
                <p className="font-heading font-semibold text-rx-navy dark:text-white">
                  {selected.size} schedule{selected.size !== 1 ? 's' : ''} updated
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-body mt-1">
                  AI management is now enabled. Visit your Schedules page to review.
                </p>
              </div>
            ) : (
              <>
                {products.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-body text-center py-8">
                    No recurring products detected yet. Check back after more orders are synced.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
                        Select products to enable AI-managed reordering
                      </p>
                      <div className="flex gap-3">
                        <button onClick={selectAll} className="text-xs text-rx-orange hover:underline font-body">All</button>
                        <button onClick={clearAll}  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 font-body">None</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {products.map(p => (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/10
                            hover:border-rx-orange/30 hover:bg-rx-orange-light/30 dark:hover:bg-rx-orange/5
                            cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 accent-rx-orange rounded shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-rx-navy dark:text-white font-body truncate">
                              {p.product_name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">
                              {intervalLabel(p.subscription_interval_days)}
                              {p.ai_managed && (
                                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">· AI enabled</span>
                              )}
                            </p>
                          </div>
                          {p.subscription_confidence && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full font-body shrink-0 ${
                              p.subscription_confidence === 'high'   ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              p.subscription_confidence === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                                       'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            }`}>
                              {p.subscription_confidence}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </>
            )
          ) : (
            /* ── Free / Consumer — blurred locked view ── */
            <div className="relative">
              {/* Blurred placeholder rows */}
              <div className="space-y-2 blur-sm pointer-events-none select-none" aria-hidden>
                {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/10">
                    <div className="w-4 h-4 rounded bg-gray-200 dark:bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className={`h-3 rounded bg-gray-200 dark:bg-white/10 ${['w-40','w-32','w-44','w-36','w-28','w-40'][i % 6]}`} />
                      <div className="h-2.5 rounded bg-gray-100 dark:bg-white/5 w-20" />
                    </div>
                    <div className="h-4 w-12 rounded-full bg-gray-100 dark:bg-white/5 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#16213E]/80 backdrop-blur-[2px] rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-rx-orange/10 flex items-center justify-center mb-3">
                  <Lock size={20} className="text-rx-orange" />
                </div>
                <p className="font-heading font-semibold text-rx-navy dark:text-white text-center text-sm px-4">
                  Upgrade to Professional to unlock these products and import them in one click
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 shrink-0">
          {isPro && !importDone && products.length > 0 ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="flex-1 py-2.5 bg-rx-orange text-white font-semibold rounded-xl text-sm
                  hover:bg-rx-orange-dark transition-colors font-body disabled:opacity-60
                  flex items-center justify-center gap-2"
              >
                {importing ? (
                  <><Loader2 size={14} className="animate-spin" /> Importing…</>
                ) : (
                  <>Import Selected ({selected.size})</>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 font-body transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : isPro && importDone ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-rx-orange text-white font-semibold rounded-xl text-sm hover:bg-rx-orange-dark transition-colors font-body"
            >
              Done
            </button>
          ) : (
            <a
              href="/dashboard/settings/billing"
              className="block w-full text-center py-2.5 bg-rx-orange text-white font-semibold rounded-xl text-sm hover:bg-rx-orange-dark transition-colors font-body"
            >
              Upgrade to Professional — $29/mo
            </a>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  return createPortal(modal, document.body)
}
