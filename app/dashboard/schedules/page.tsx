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
interface Schedule {
  id: string
  frequency: string
  status: string
  ai_managed: boolean
  notification_timing: string
  notification_channel: string
  created_at: string
  products: {
    name: string
    retailers: { name: string } | null
  } | null
}

type FilterTab = 'all' | 'active' | 'paused'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FREQ_OPTIONS = [
  { value: 'weekly',     label: 'Weekly' },
  { value: 'bi-weekly',  label: 'Every 2 weeks' },
  { value: 'monthly',    label: 'Monthly' },
  { value: 'quarterly',  label: 'Quarterly' },
]

const TIMING_OPTIONS = [
  { value: '6hr',  label: '6 hr before' },
  { value: '12hr', label: '12 hr before' },
  { value: '24hr', label: '24 hr before' },
  { value: '48hr', label: '48 hr before' },
]

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly', 'bi-weekly': 'Every 2 weeks',
  monthly: 'Monthly', quarterly: 'Quarterly', occasional: 'Occasional',
}

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
  const [saving, setSaving] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const productName  = schedule.products?.name ?? 'Unknown product'
  const retailerName = schedule.products?.retailers?.name ?? '—'

  const patch = useCallback(async (field: string, value: string) => {
    setSaving(field)
    const { error } = await supabase
      .from('purchase_schedules')
      .update({ [field]: value })
      .eq('id', schedule.id)
    if (!error) onUpdate(schedule.id, { [field]: value } as any)
    setSaving(null)
  }, [supabase, schedule.id, onUpdate])

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
          value={schedule.frequency}
          options={FREQ_OPTIONS}
          onChange={v => patch('frequency', v)}
          disabled={saving === 'frequency'}
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
      .select(`
        id, frequency, status, ai_managed,
        notification_timing, notification_channel, created_at,
        products!product_id ( name, retailers!retailer_id ( name ) )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setSchedules((data as unknown as Schedule[]) ?? [])
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
