'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BrainCircuit, Lock, TrendingDown, Sliders, Package,
  RefreshCw, Snowflake, Sun, Calendar, Loader2, X, CheckCircle, AlertTriangle,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useUser, useUserTier } from '@/contexts/UserContext'
import UpgradePromptModal from '@/components/dashboard/UpgradePromptModal'
import AdSlot from '@/components/dashboard/AdSlot'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProductRow {
  id: string
  name: string
  category: string | null
  reorder_quantity: number
  retailers: { name: string } | null
}

interface ScheduleRow {
  product_id: string
  frequency: string
}

interface AiTiming {
  product_id: string
  predicted_runout_days: number | null
  confidence: 'low' | 'medium' | 'high' | null
  seasonal_factor: boolean
  seasonal_reasoning: string | null
  recommended_frequency: string | null
  adjustment_reason: string | null
  predicted_at: string | null
}

interface ProductWithTiming extends ProductRow {
  frequency: string | null
  timing: AiTiming | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly', 'bi-weekly': 'Every 2 weeks',
  monthly: 'Monthly', quarterly: 'Quarterly',
}

function predictedDateLabel(days: number | null): string {
  if (days == null) return '—'
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatPredictedAt(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ConfidenceBadge({ level }: { level: 'low' | 'medium' | 'high' | null }) {
  if (!level) return null
  const cfg = {
    low:    { cls: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30',    label: 'Low confidence' },
    medium: { cls: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30', label: 'Medium confidence' },
    high:   { cls: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30',  label: 'High confidence' },
  }
  const { cls, label } = cfg[level]
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-body ${cls}`}>{label}</span>
}

function SeasonalBadge({ seasonal_factor, seasonal_reasoning }: { seasonal_factor: boolean; seasonal_reasoning: string | null }) {
  if (!seasonal_factor) return null
  const isWinter = new Date().getMonth() >= 11 || new Date().getMonth() <= 1
  return (
    <span
      title={seasonal_reasoning ?? 'Seasonal adjustments active'}
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 font-body cursor-help"
    >
      {isWinter ? <Snowflake size={9} /> : <Sun size={9} />}
      Seasonal adjustments active
    </span>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  )
}

// Override modal — lets user set next order date manually
function OverrideModal({ product, onClose, onSaved }: {
  product: ProductWithTiming
  onClose: () => void
  onSaved: (productId: string, days: number) => void
}) {
  const supabase = createSupabaseBrowserClient()
  const [days, setDays] = useState(product.timing?.predicted_runout_days ?? 30)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase.from('ai_timing').upsert({
      product_id: product.id,
      user_id: user.id,
      predicted_runout_days: days,
      confidence: 'high',
      seasonal_factor: false,
      seasonal_reasoning: null,
      recommended_frequency: product.frequency,
      adjustment_reason: 'Manually overridden by user',
      predicted_at: new Date().toISOString(),
    }, { onConflict: 'product_id,user_id' })

    onSaved(product.id, days)
    setSaving(false)
    onClose()
  }

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + days)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16213E] rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-black/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Sliders size={15} className="text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-heading font-semibold text-rx-navy dark:text-white text-sm">Override Timing</span>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-body">Product</p>
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-body mt-0.5 truncate">{product.name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-2">
              Days until next order
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2.5 border rounded-xl text-sm font-body
                focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-1">
              Target date: <span className="font-semibold text-rx-navy dark:text-white">
                {targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold rounded-xl text-sm transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><CheckCircle size={14} />Save Override</>}
          </button>
          <button onClick={onClose} className="w-full text-center text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 font-body transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Product timing card
// ---------------------------------------------------------------------------
function ProductTimingCard({ item, onRecalculate, onOverrideSaved }: {
  item: ProductWithTiming
  onRecalculate: (productId: string) => Promise<void>
  onOverrideSaved: (productId: string, days: number) => void
}) {
  const [recalculating, setRecalculating] = useState(false)
  const [showOverride, setShowOverride] = useState(false)
  const [error, setError] = useState('')

  const handleRecalculate = async () => {
    setRecalculating(true)
    setError('')
    try {
      await onRecalculate(item.id)
    } catch (e: any) {
      setError(e.message ?? 'Failed to recalculate')
    } finally {
      setRecalculating(false)
    }
  }

  const t = item.timing
  const daysLeft = t?.predicted_runout_days ?? null
  const runoutDate = predictedDateLabel(daysLeft)
  const isUrgent = daysLeft != null && daysLeft <= 7

  return (
    <>
      <div className={`bg-white dark:bg-[#16213E] rounded-xl border shadow-sm dark:shadow-none p-5 space-y-4 transition-colors
        ${isUrgent
          ? 'border-red-200 dark:border-red-800/40'
          : 'border-gray-100 dark:border-white/10'
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <BrainCircuit size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-body truncate">{item.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {item.retailers?.name && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-body">{item.retailers.name}</span>
              )}
              {item.category && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-body">
                  {item.category}
                </span>
              )}
            </div>
          </div>
          {t && <ConfidenceBadge level={t.confidence} />}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-body uppercase tracking-wide">Frequency</p>
            <p className="text-sm font-bold font-heading text-rx-navy dark:text-white mt-0.5">
              {FREQ_LABEL[item.frequency ?? ''] ?? item.frequency ?? '—'}
            </p>
          </div>
          <div className={`px-3 py-2.5 rounded-xl text-center
            ${isUrgent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-white/5'}`}
          >
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-body uppercase tracking-wide">Run-out</p>
            <p className={`text-sm font-bold font-heading mt-0.5
              ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-rx-navy dark:text-white'}`}>
              {daysLeft != null ? `${daysLeft}d` : '—'}
            </p>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-body uppercase tracking-wide">Target date</p>
            <p className="text-sm font-bold font-heading text-rx-navy dark:text-white mt-0.5">{runoutDate}</p>
          </div>
        </div>

        {/* Seasonal + recommendation */}
        {t && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <SeasonalBadge
                seasonal_factor={t.seasonal_factor}
                seasonal_reasoning={t.seasonal_reasoning}
              />
              {t.recommended_frequency && t.recommended_frequency !== item.frequency && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800/30 font-body">
                  <AlertTriangle size={9} />
                  Suggest: {FREQ_LABEL[t.recommended_frequency] ?? t.recommended_frequency}
                </span>
              )}
            </div>
            {t.adjustment_reason && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body leading-relaxed">
                {t.adjustment_reason}
              </p>
            )}
            {t.predicted_at && (
              <p className="text-[10px] text-gray-300 dark:text-gray-600 font-body">
                Last predicted {formatPredictedAt(t.predicted_at)}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 font-body">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
              bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400
              hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors font-body disabled:opacity-50"
          >
            <RefreshCw size={11} className={recalculating ? 'animate-spin' : ''} />
            {recalculating ? 'Recalculating…' : 'Recalculate'}
          </button>
          <button
            onClick={() => setShowOverride(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
              bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300
              hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-body"
          >
            <Sliders size={11} />
            Override
          </button>
          {!t && !recalculating && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-body ml-auto">No prediction yet</span>
          )}
        </div>
      </div>

      {showOverride && (
        <OverrideModal
          product={item}
          onClose={() => setShowOverride(false)}
          onSaved={(id, days) => {
            onOverrideSaved(id, days)
          }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Sample rows shown in paywall preview
// ---------------------------------------------------------------------------
const SAMPLE_ROWS = [
  { id: 1, product: 'Tide Pods 96ct',  predictedDate: 'May 10', confidence: 'high' as const, daysLeft: 3 },
  { id: 2, product: 'Dawn Dish Soap',  predictedDate: 'May 22', confidence: 'medium' as const, daysLeft: 15 },
  { id: 3, product: 'Vitamin D3',      predictedDate: 'Jun 1',  confidence: 'low' as const, daysLeft: 25 },
]

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AITimingPage() {
  const { isConsumerOrAbove, isBusinessOnly, planTier } = useUserTier()
  const hasProAccess = isConsumerOrAbove  // AI Timing is Consumer+
  const supabase = createSupabaseBrowserClient()
  const [showSeasonalUpgrade, setShowSeasonalUpgrade] = useState(false)

  const [items, setItems] = useState<ProductWithTiming[]>([])
  const [loading, setLoading] = useState(true)
  const [recalcAll, setRecalcAll] = useState(false)
  const [overrideItem, setOverrideItem] = useState<ProductWithTiming | null>(null)
  const [toast, setToast] = useState('')

  // ── Fetch products + schedules + ai_timing ──────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [productsRes, schedulesRes, timingRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, category, reorder_quantity, retailers!retailer_id ( name )')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_schedules')
        .select('product_id, frequency')
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('ai_timing')
        .select('product_id, predicted_runout_days, confidence, seasonal_factor, seasonal_reasoning, recommended_frequency, adjustment_reason, predicted_at')
        .eq('user_id', user.id),
    ])

    const products  = (productsRes.data  ?? []) as unknown as ProductRow[]
    const schedules = (schedulesRes.data ?? []) as ScheduleRow[]
    const timings   = (timingRes.data    ?? []) as AiTiming[]

    const scheduleMap = Object.fromEntries(schedules.map(s => [s.product_id, s.frequency]))
    const timingMap   = Object.fromEntries(timings.map(t => [t.product_id, t]))

    setItems(products.map(p => ({
      ...p,
      frequency: scheduleMap[p.id] ?? null,
      timing: timingMap[p.id] ?? null,
    })))
    setLoading(false)
  }, [supabase])

  useEffect(() => { if (hasProAccess) fetchData() }, [hasProAccess, fetchData])

  // ── Single recalculate ──────────────────────────────────────────────────
  const recalculate = useCallback(async (productId: string) => {
    const res = await fetch('/api/ai-timing/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Prediction failed')
    }
    const { prediction } = await res.json()
    setItems(prev => prev.map(item =>
      item.id === productId ? { ...item, timing: prediction as AiTiming } : item
    ))
  }, [])

  // ── Recalculate all ─────────────────────────────────────────────────────
  const recalculateAll = async () => {
    setRecalcAll(true)
    const productIds = items.map(i => i.id)
    await Promise.allSettled(productIds.map(id => recalculate(id)))
    setRecalcAll(false)
    showToast('All predictions updated')
  }

  // ── Override saved ──────────────────────────────────────────────────────
  const handleOverrideSaved = (productId: string, days: number) => {
    setItems(prev => prev.map(item =>
      item.id === productId
        ? {
            ...item,
            timing: {
              ...item.timing,
              product_id: productId,
              predicted_runout_days: days,
              confidence: 'high',
              seasonal_factor: false,
              seasonal_reasoning: null,
              recommended_frequency: item.frequency,
              adjustment_reason: 'Manually overridden by user',
              predicted_at: new Date().toISOString(),
            }
          }
        : item
    ))
    showToast('Override saved')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Paywall ─────────────────────────────────────────────────────────────
  if (!hasProAccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">AI Reorder Timing</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">Predicted run-out dates powered by AI</p>
        </div>

        <div className="relative rounded-2xl overflow-hidden">
          <div className="blur-sm pointer-events-none select-none bg-white dark:bg-[#16213E] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm divide-y divide-gray-50 dark:divide-white/5">
            {SAMPLE_ROWS.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BrainCircuit size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-rx-navy dark:text-white font-body">{p.product}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">
                    Predicted run-out: {p.predictedDate} · {p.daysLeft} days left
                  </p>
                </div>
                <ConfidenceBadge level={p.confidence} />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-rx-navy/80 backdrop-blur-[2px] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center mb-4">
              <Lock size={24} className="text-rx-orange" />
            </div>
            <h3 className="font-heading font-bold text-rx-navy dark:text-white text-lg mb-1">Consumer Feature</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-body text-center max-w-xs mb-5">
              AI Reorder Timing predicts when you&apos;ll run out before you do — using consumption patterns, household size, and seasonal trends.
            </p>
            <AdSlot
              slot="ai-timing-video"
              format="video"
              className="mb-3"
              videoLabel="Watch a short ad to preview this feature"
            />
            <a
              href="/#pricing"
              className="px-6 py-2.5 bg-rx-orange text-white font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body text-sm"
            >
              Upgrade to Consumer — $9.99/mo
            </a>
            <a href="/#pricing" className="mt-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 font-body transition-colors">
              View all plans
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: BrainCircuit, title: 'Consumption patterns', desc: 'Learns how fast your household uses each product' },
            { icon: TrendingDown,  title: 'Seasonal adjustments', desc: 'Accounts for summer vs winter usage differences' },
            { icon: Sliders,       title: 'Manual overrides',     desc: 'Adjust predictions when life changes' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 p-4 opacity-50">
              <Icon size={20} className="text-purple-500 dark:text-purple-400 mb-2" />
              <p className="text-sm font-semibold text-rx-navy dark:text-white font-heading">{title}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Pro / admin unlocked ─────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-rx-navy dark:bg-white text-white dark:text-rx-navy px-4 py-3 rounded-xl shadow-xl text-sm font-body font-medium">
          <CheckCircle size={16} className="text-green-400 dark:text-green-600 shrink-0" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">AI Reorder Timing</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-body">
              Claude AI
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">Predicted run-out dates with seasonal intelligence</p>
        </div>

        {!loading && items.length > 0 && (
          <button
            onClick={recalculateAll}
            disabled={recalcAll}
            className="flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body disabled:opacity-60"
          >
            <RefreshCw size={15} className={recalcAll ? 'animate-spin' : ''} />
            {recalcAll ? 'Recalculating…' : 'Recalculate All'}
          </button>
        )}
      </div>

      {/* Legend */}
      {!loading && items.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-body">
            <Calendar size={12} /> Predictions update when you recalculate or after each order
          </div>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
            <Package size={26} className="text-purple-500 dark:text-purple-400" />
          </div>
          <h2 className="font-heading font-semibold text-rx-navy dark:text-white text-base mb-1">No products tracked yet</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-body max-w-xs mb-6">
            Add a product to a schedule and Restox will start predicting your reorder timing.
          </p>
          <Link
            href="/dashboard/products"
            className="px-5 py-2.5 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
          >
            Go to Products
          </Link>
        </div>
      )}

      {/* Product cards */}
      {!loading && items.length > 0 && (
        <div className="space-y-4">
          {items.map(item => (
            <ProductTimingCard
              key={item.id}
              item={item}
              onRecalculate={recalculate}
              onOverrideSaved={handleOverrideSaved}
            />
          ))}
        </div>
      )}

      {/* Seasonal Forecast — Business only */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className={`bg-white dark:bg-[#16213E] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6 ${isBusinessOnly ? '' : 'blur-sm pointer-events-none select-none'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Snowflake size={20} className="text-blue-500" />
            <h3 className="font-heading font-semibold text-rx-navy dark:text-white">Seasonal Forecast</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {['Winter', 'Spring', 'Summer', 'Fall'].map(s => (
              <div key={s} className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-body">{s}</p>
                <p className="text-lg font-bold font-heading text-rx-navy dark:text-white mt-1">–</p>
              </div>
            ))}
          </div>
        </div>
        {!isBusinessOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-rx-navy/80 backdrop-blur-[2px] rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
              <Lock size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-heading font-bold text-rx-navy dark:text-white mb-1">Business Feature</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-body text-center max-w-xs mb-4">
              Seasonal Forecasting adjusts reorder predictions based on seasonal demand patterns across your household.
            </p>
            <button
              onClick={() => setShowSeasonalUpgrade(true)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition-colors font-body"
            >
              Upgrade to Business — $79/mo
            </button>
          </div>
        )}
      </div>

      {showSeasonalUpgrade && (
        <UpgradePromptModal
          featureName="Seasonal Forecast"
          requiredTier="business"
          currentTier={planTier}
          description="Seasonal Forecasting adjusts predictions based on demand patterns across seasons."
          onClose={() => setShowSeasonalUpgrade(false)}
        />
      )}
    </div>
  )
}
