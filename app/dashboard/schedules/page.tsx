'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CalendarClock, Package, Zap, Mail, MessageSquare, Layers,
  Pause, Play, Trash2, ChevronDown, AlertTriangle,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ForecastMonth {
  month: string
  relative_demand: number
}

interface Schedule {
  id: string
  frequency_days: number
  status: string
  ai_managed: boolean
  notification_timing: string
  notification_channel: string
  created_at: string
  product_name: string
  retailer: string
  monthly_forecast: ForecastMonth[] | null
}

type FilterTab = 'all' | 'active' | 'paused'
type FreqUnit = 'days' | 'weeks' | 'months'

function freqToDays(num: number, unit: FreqUnit): number {
  if (unit === 'weeks')  return num * 7
  if (unit === 'months') return num * 30
  return num
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FREQ_DAYS_OPTIONS = [
  { value: 7,  label: 'Weekly' },
  { value: 14, label: 'Every 2 weeks' },
  { value: 30, label: 'Monthly' },
  { value: 42, label: 'Every 6 weeks' },
  { value: 60, label: 'Every 2 months' },
  { value: 90, label: 'Every 3 months' },
]

const FREQ_DAYS_LABEL: Record<number, string> = {
  7: 'Weekly', 14: 'Every 2 weeks', 30: 'Monthly',
  42: 'Every 6 weeks', 60: 'Every 2 months', 90: 'Every 3 months',
}

const TIMING_OPTIONS = [
  { value: '6hr',  label: '6 hr before' },
  { value: '12hr', label: '12 hr before' },
  { value: '24hr', label: '24 hr before' },
  { value: '48hr', label: '48 hr before' },
]

const TIMING_LABEL: Record<string, string> = {
  '6hr': '6 hr before', '12hr': '12 hr before',
  '24hr': '24 hr before', '48hr': '48 hr before',
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />
}

function ScheduleCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delete confirmation popover
// ---------------------------------------------------------------------------
function DeleteConfirm({ onConfirm, onCancel, loading }: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="absolute right-0 top-10 z-20 w-64 bg-white dark:bg-[#1a2744] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={15} className="text-red-500 shrink-0" />
        <p className="text-sm font-semibold text-rx-navy dark:text-white font-heading">Delete schedule?</p>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 font-body mb-3">
        This can&apos;t be undone. The product will remain in your catalog.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors font-body disabled:opacity-60"
        >
          {loading ? 'Deleting…' : 'Delete'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline select — styled dropdown wrapper
// ---------------------------------------------------------------------------
function InlineSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold font-body rounded-lg border
          border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5
          text-rx-navy dark:text-white
          focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
          disabled:opacity-50 cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2 pointer-events-none text-gray-400 dark:text-gray-500" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    paused:    'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    skipped:   'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400',
    confirmed: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold font-body capitalize ${map[status] ?? map.skipped}`}>
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Channel icon
// ---------------------------------------------------------------------------
function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'sms') return <MessageSquare size={12} className="text-gray-400 dark:text-gray-500" />
  if (channel === 'both') return <Layers size={12} className="text-gray-400 dark:text-gray-500" />
  return <Mail size={12} className="text-gray-400 dark:text-gray-500" />
}

// ---------------------------------------------------------------------------
// Seasonal demand bar chart
// ---------------------------------------------------------------------------
const CHART_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const BAR_W = 8
const BAR_GAP = 3
const CHART_H = 32
const CHART_W = 12 * (BAR_W + BAR_GAP) - BAR_GAP

function SeasonalChart({ forecast }: { forecast: ForecastMonth[] }) {
  const [tooltip, setTooltip] = useState<{ label: string; demand: number; x: number } | null>(null)
  const currentMonth = new Date().getMonth()

  return (
    <div className="relative pt-1">
      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-body mb-1.5 select-none">
        Seasonal demand
      </p>
      <svg width={CHART_W} height={CHART_H} className="overflow-visible block">
        {forecast.map((f, i) => {
          const barH = Math.max(2, Math.round(f.relative_demand * CHART_H))
          const x = i * (BAR_W + BAR_GAP)
          const isCurrent = i === currentMonth
          const opacity = isCurrent ? 1 : 0.3 + f.relative_demand * 0.55
          return (
            <rect
              key={i}
              x={x}
              y={CHART_H - barH}
              width={BAR_W}
              height={barH}
              rx={2}
              fill={`rgba(244,124,32,${opacity})`}
              style={isCurrent ? { filter: 'drop-shadow(0 0 3px rgba(244,124,32,0.6))' } : undefined}
              onMouseEnter={() => setTooltip({ label: CHART_MONTHS[i], demand: f.relative_demand, x })}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-default"
            />
          )
        })}
      </svg>
      {tooltip && (
        <div
          className="absolute bottom-full mb-1 pointer-events-none z-10"
          style={{ left: tooltip.x }}
        >
          <div className="bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap font-body shadow-lg">
            {tooltip.label} · {tooltip.demand < 0.35 ? 'Low' : tooltip.demand < 0.65 ? 'Normal' : 'High'}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single schedule card
// ---------------------------------------------------------------------------
function ScheduleCard({
  schedule,
  onUpdate,
  onDelete,
}: {
  schedule: Schedule
  onUpdate: (id: string, patch: Partial<Schedule>) => void
  onDelete: (id: string) => void
}) {
  const supabase = createSupabaseBrowserClient()
  const [saving, setSaving]       = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [customFreq, setCustomFreq] = useState<{ num: number; unit: FreqUnit } | null>(null)
  const [customFreqError, setCustomFreqError] = useState(false)

  const productName  = schedule.product_name || 'Unknown product'
  const retailerName = schedule.retailer || '—'

  const customDays = customFreq ? freqToDays(customFreq.num, customFreq.unit) : 0

  const patch = useCallback(async (field: string, value: string | number) => {
    setSaving(field)
    const { error } = await supabase
      .from('purchase_schedules')
      .update({ [field]: value })
      .eq('id', schedule.id)
    if (!error) onUpdate(schedule.id, { [field]: value })
    setSaving(null)
  }, [supabase, schedule.id, onUpdate])

  const handleFreqChange = (v: string) => {
    if (v === 'custom') {
      setCustomFreq({ num: 6, unit: 'weeks' })
      setCustomFreqError(false)
    } else {
      setCustomFreq(null)
      setCustomFreqError(false)
      patch('frequency_days', parseInt(v))
    }
  }

  const applyCustomFreq = () => {
    if (!customFreq || customFreq.num < 1) { setCustomFreqError(true); return }
    setCustomFreqError(false)
    patch('frequency_days', customDays)
    setCustomFreq(null)
  }

  const togglePause = () => {
    const next = schedule.status === 'active' ? 'paused' : 'active'
    patch('status', next)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase
      .from('purchase_schedules')
      .delete()
      .eq('id', schedule.id)
    if (!error) onDelete(schedule.id)
    setDeleting(false)
    setShowDelete(false)
  }

  return (
    <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
          <Package size={18} className="text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-rx-navy dark:text-white font-body truncate">{productName}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">{retailerName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {schedule.ai_managed && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-body">
              <Zap size={9} />AI
            </span>
          )}
          <StatusBadge status={schedule.status} />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Frequency */}
        <InlineSelect
          value={customFreq ? 'custom' : String(schedule.frequency_days)}
          options={[
            ...FREQ_DAYS_OPTIONS.map(o => ({ value: String(o.value), label: o.label })),
            { value: 'custom', label: 'Custom…' },
          ]}
          onChange={handleFreqChange}
          disabled={saving === 'frequency_days'}
        />

        {/* Notification timing */}
        <InlineSelect
          value={schedule.notification_timing}
          options={TIMING_OPTIONS}
          onChange={v => patch('notification_timing', v)}
          disabled={saving === 'notification_timing'}
        />

        {/* Channel indicator */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 dark:text-gray-500 font-body">
          <ChannelIcon channel={schedule.notification_channel} />
          {schedule.notification_channel}
        </span>

        {/* Pause / Resume */}
        <button
          onClick={togglePause}
          disabled={!!saving}
          className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors font-body disabled:opacity-50 ${
            schedule.status === 'active'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40'
              : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
          }`}
        >
          {schedule.status === 'active'
            ? <><Pause size={12} />{saving === 'status' ? '…' : 'Pause'}</>
            : <><Play size={12} />{saving === 'status' ? '…' : 'Resume'}</>
          }
        </button>

        {/* Delete */}
        <div className="relative">
          <button
            onClick={() => setShowDelete(v => !v)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          {showDelete && (
            <DeleteConfirm
              onConfirm={handleDelete}
              onCancel={() => setShowDelete(false)}
              loading={deleting}
            />
          )}
        </div>
      </div>

      {/* Custom frequency row — animated, suppresses space-y margin when hidden */}
      <div className={`overflow-hidden transition-all duration-200 ${
        customFreq ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 !mt-0'
      }`}>
        <div className="flex items-center gap-2 flex-wrap border-t border-gray-100 dark:border-white/10 pt-3">
          <input
            type="number"
            min={1}
            max={365}
            value={customFreq?.num || ''}
            onChange={e => {
              const n = parseInt(e.target.value) || 0
              setCustomFreq(prev => prev ? { ...prev, num: Math.min(365, Math.max(0, n)) } : null)
              setCustomFreqError(false)
            }}
            placeholder="e.g. 6"
            className="w-16 px-2 py-1 text-xs font-semibold font-body text-center border rounded-lg
              border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-rx-navy dark:text-white
              focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
          />
          <select
            value={customFreq?.unit ?? 'weeks'}
            onChange={e => setCustomFreq(prev => prev ? { ...prev, unit: e.target.value as FreqUnit } : null)}
            className="appearance-none pl-2.5 pr-6 py-1 text-xs font-semibold font-body rounded-lg border
              border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5
              text-rx-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
          {customFreq && customFreq.num >= 1 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-body">
              = {customDays} day{customDays !== 1 ? 's' : ''}
            </span>
          )}
          {customFreqError && (
            <span className="text-xs text-red-500 font-body">Please enter a valid frequency</span>
          )}
          <button
            onClick={applyCustomFreq}
            disabled={!!saving}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rx-orange hover:bg-rx-orange-dark text-white transition-colors font-body disabled:opacity-50"
          >
            {saving === 'frequency_days' ? '…' : 'Apply'}
          </button>
          <button
            onClick={() => { setCustomFreq(null); setCustomFreqError(false) }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Seasonal demand chart */}
      {schedule.monthly_forecast && schedule.monthly_forecast.length === 12 && (
        <div className="border-t border-gray-100 dark:border-white/10 pt-3">
          <SeasonalChart forecast={schedule.monthly_forecast} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function SchedulesPage() {
  const supabase = createSupabaseBrowserClient()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('all')

  const fetchSchedules = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('purchase_schedules')
      .select('id, product_name, retailer, frequency_days, status, ai_managed, notification_timing, notification_channel, created_at, monthly_forecast')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setSchedules((data as Schedule[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const handleUpdate = useCallback((id: string, patch: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id))
  }, [])

  const filtered = tab === 'all'
    ? schedules
    : schedules.filter(s => s.status === tab)

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all',    label: `All (${schedules.length})` },
    { id: 'active', label: `Active (${schedules.filter(s => s.status === 'active').length})` },
    { id: 'paused', label: `Paused (${schedules.filter(s => s.status === 'paused').length})` },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Schedules</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">
            {loading ? 'Loading…' : `${schedules.length} reorder schedule${schedules.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      {!loading && schedules.length > 0 && (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors font-body ${
                tab === t.id
                  ? 'bg-white dark:bg-[#16213E] text-rx-navy dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <ScheduleCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && schedules.length === 0 && (
        <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center mb-4">
            <CalendarClock size={26} className="text-rx-orange" />
          </div>
          <h2 className="font-heading font-semibold text-rx-navy dark:text-white text-base mb-1">No schedules yet</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-body max-w-xs mb-6">
            Add a product to create your first schedule
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/products"
              className="px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
            >
              Add a product
            </Link>
            <Link
              href="/dashboard/retailers"
              className="px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-rx-navy dark:text-white text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 transition-colors font-body"
            >
              Connect a retailer
            </Link>
          </div>
        </div>
      )}

      {/* Empty filtered state */}
      {!loading && schedules.length > 0 && filtered.length === 0 && (
        <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm py-10 flex flex-col items-center text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 font-body">
            No {tab} schedules
          </p>
        </div>
      )}

      {/* Schedule cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(s => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
