'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus, Package, Search, X, ExternalLink,
  CalendarClock, Trash2, AlertTriangle, ChevronDown, Loader2, BarChart2,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import AddProductModal from '@/components/dashboard/AddProductModal'
import PriceCompareModal from '@/components/dashboard/PriceCompareModal'
import AdSlot from '@/components/dashboard/AdSlot'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Product {
  id: string
  name: string
  category: string | null
  reorder_quantity: number
  product_url: string | null
  created_at: string
  retailers: { id: string; name: string } | null
  has_schedule: boolean
}

type FilterTab = 'all' | 'scheduled' | 'unscheduled'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FREQ_PRESETS = [
  { value: 7,  label: 'Weekly' },
  { value: 14, label: 'Every 2 weeks' },
  { value: 30, label: 'Monthly' },
  { value: 91, label: 'Quarterly' },
]

type FreqUnit = 'days' | 'weeks' | 'months'

function freqToDays(num: number, unit: FreqUnit): number {
  if (unit === 'weeks')  return num * 7
  if (unit === 'months') return num * 30
  return num
}

const TIMING_OPTIONS = [
  { value: '6hr',  label: '6 hr before' },
  { value: '12hr', label: '12 hr before' },
  { value: '24hr', label: '24 hr before' },
  { value: '48hr', label: '48 hr before' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Retailer logo (same pattern as retailers page)
// ---------------------------------------------------------------------------
const FALLBACK_COLORS = [
  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
]

// Simple domain map for known retailers
const RETAILER_DOMAIN: Record<string, string> = {
  amazon: 'amazon.com', walmart: 'walmart.com', target: 'target.com',
  'home depot': 'homedepot.com', "lowe's": 'lowes.com',
  kroger: 'kroger.com', costco: 'costco.com', "sam's club": 'samsclub.com',
  sephora: 'sephora.com', chewy: 'chewy.com', staples: 'staples.com',
}

function RetailerLogo({ retailer, idx }: { retailer: { name: string } | null; idx: number }) {
  const [failed, setFailed] = useState(false)
  const color = FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
  const name = retailer?.name ?? ''
  const domain = RETAILER_DOMAIN[name.toLowerCase()]

  if (!name) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
        <Package size={18} className="text-gray-400 dark:text-gray-500" />
      </div>
    )
  }

  if (failed || !domain) {
    return (
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-heading ${color}`}>
        {name[0]}
      </div>
    )
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 flex items-center justify-center p-1.5 overflow-hidden">
      <Image
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        width={40}
        height={40}
        className="object-contain w-full h-full"
        onError={() => setFailed(true)}
        unoptimized
      />
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
        <p className="text-sm font-semibold text-rx-navy dark:text-white font-heading">Delete product?</p>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 font-body mb-3">
        This also deletes any associated schedules and can&apos;t be undone.
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
// Add Schedule modal
// ---------------------------------------------------------------------------
function AddScheduleModal({ product, onClose, onCreated }: {
  product: Product
  onClose: () => void
  onCreated: (productId: string) => void
}) {
  const supabase = createSupabaseBrowserClient()
  const [freqDays, setFreqDays]     = useState(30)
  const [isCustom, setIsCustom]     = useState(false)
  const [customNum, setCustomNum]   = useState(6)
  const [customUnit, setCustomUnit] = useState<FreqUnit>('weeks')
  const [freqError, setFreqError]   = useState('')
  const [timing, setTiming]         = useState('24hr')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const computedCustomDays = freqToDays(customNum, customUnit)
  const finalFreqDays = isCustom ? computedCustomDays : freqDays

  const selectCls = `w-full px-4 py-2.5 border rounded-xl text-sm font-body appearance-none
    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
    border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-rx-navy dark:text-white`

  const handleFreqChange = (v: string) => {
    setFreqError('')
    if (v === 'custom') {
      setIsCustom(true)
    } else {
      setIsCustom(false)
      setFreqDays(parseInt(v))
    }
  }

  const handleCreate = async () => {
    if (isCustom && customNum < 1) {
      setFreqError('Please enter a valid frequency')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        product_id: product.id,
        user_id: user.id,
        product_name: product.name,
        retailer: product.retailers?.name ?? null,
        product_url: product.product_url ?? null,
        frequency_days: finalFreqDays,
        status: 'active',
        ai_managed: false,
        notification_timing: timing,
        confirmation_required: false,
        notification_channel: 'email',
      }
      console.log('[AddSchedule] inserting:', payload)
      const { error: err } = await supabase.from('purchase_schedules').insert(payload)
      if (err) { console.error('[AddSchedule] error:', err); throw err }

      // Seed initial price data in background (fire and forget)
      fetch('/api/price-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      }).catch(() => {})

      onCreated(product.id)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16213E] rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-black/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center">
              <CalendarClock size={15} className="text-rx-orange" />
            </div>
            <span className="font-heading font-semibold text-rx-navy dark:text-white text-sm">Add Schedule</span>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Product summary */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-body">Product</p>
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-body mt-0.5 truncate">{product.name}</p>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1.5">
              Reorder frequency
            </label>
            <div className="relative">
              <select
                value={isCustom ? 'custom' : String(freqDays)}
                onChange={e => handleFreqChange(e.target.value)}
                className={selectCls}
              >
                {FREQ_PRESETS.map(o => (
                  <option key={o.value} value={String(o.value)}>{o.label}</option>
                ))}
                <option value="custom">Custom…</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>

            {/* Custom row — animated */}
            <div className={`overflow-hidden transition-all duration-200 ${isCustom ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customNum || ''}
                  onChange={e => {
                    const n = parseInt(e.target.value) || 0
                    setCustomNum(Math.min(365, Math.max(0, n)))
                    if (freqError) setFreqError('')
                  }}
                  placeholder="e.g. 6"
                  className="w-24 px-3 py-2.5 border rounded-xl text-sm font-body appearance-none
                    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                    border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-rx-navy dark:text-white"
                />
                <div className="relative flex-1">
                  <select
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value as FreqUnit)}
                    className={selectCls}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>
              {isCustom && customNum >= 1 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-1.5">
                  = {computedCustomDays} day{computedCustomDays !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {freqError && <p className="text-red-500 text-xs font-body mt-1.5">{freqError}</p>}
          </div>

          {/* Notification timing */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1.5">
              Notify me before order
            </label>
            <div className="relative">
              <select value={timing} onChange={e => setTiming(e.target.value)} className={selectCls}>
                {TIMING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-body">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold rounded-xl text-sm transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" />Creating…</> : 'Create Schedule'}
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
// Product card
// ---------------------------------------------------------------------------
function ProductCard({ product, idx, onUpdate, onDelete, onScheduleCreated }: {
  product: Product
  idx: number
  onUpdate: (id: string, patch: Partial<Product>) => void
  onDelete: (id: string) => void
  onScheduleCreated: (productId: string) => void
}) {
  const supabase = createSupabaseBrowserClient()
  const [qty, setQty] = useState(product.reorder_quantity)
  const [savingQty, setSavingQty] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [showPriceCompare, setShowPriceCompare] = useState(false)

  const saveQty = async () => {
    if (qty === product.reorder_quantity) return
    setSavingQty(true)
    const { error } = await supabase
      .from('products')
      .update({ reorder_quantity: qty })
      .eq('id', product.id)
    if (!error) onUpdate(product.id, { reorder_quantity: qty })
    setSavingQty(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (!error) onDelete(product.id)
    setDeleting(false)
    setShowDelete(false)
  }

  const retailerName = product.retailers?.name ?? null

  return (
    <>
      <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <RetailerLogo retailer={product.retailers} idx={idx} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <p className="text-sm font-semibold text-rx-navy dark:text-white font-body truncate max-w-[200px]">
                {product.name}
              </p>
              {product.product_url && (
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 dark:text-gray-500 hover:text-rx-orange transition-colors mt-0.5"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {retailerName && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-body">{retailerName}</span>
              )}
              {product.category && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-body">
                  {product.category}
                </span>
              )}
            </div>
          </div>

          {/* Schedule badge */}
          <div className="shrink-0">
            {product.has_schedule ? (
              <Link
                href="/dashboard/schedules"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors font-body"
              >
                <CalendarClock size={10} /> Scheduled
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 font-body">
                No schedule
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Qty */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-body">Qty</span>
            <input
              type="number"
              min={1}
              max={99}
              value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              onBlur={saveQty}
              className={`w-14 px-2 py-1 text-xs font-semibold font-body text-center border rounded-lg
                border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-rx-navy dark:text-white
                focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                ${savingQty ? 'opacity-50' : ''}`}
            />
          </div>

          {/* Schedule action */}
          {product.has_schedule ? (
            <Link
              href="/dashboard/schedules"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-body"
            >
              <CalendarClock size={12} /> View Schedule
            </Link>
          ) : (
            <button
              onClick={() => setShowAddSchedule(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rx-orange-light dark:bg-rx-orange/10 text-rx-orange hover:bg-orange-100 dark:hover:bg-rx-orange/20 transition-colors font-body"
            >
              <Plus size={12} /> Add Schedule
            </button>
          )}

          {/* Compare Prices */}
          <button
            onClick={() => setShowPriceCompare(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-body"
          >
            <BarChart2 size={12} /> Compare Prices
          </button>

          {/* Delete */}
          <div className="relative ml-auto">
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

      {showAddSchedule && (
        <AddScheduleModal
          product={product}
          onClose={() => setShowAddSchedule(false)}
          onCreated={onScheduleCreated}
        />
      )}

      {showPriceCompare && (
        <PriceCompareModal
          product={product}
          onClose={() => setShowPriceCompare(false)}
          onRetailerSwitched={(retailerId, retailerName) => {
            onUpdate(product.id, { retailers: { id: retailerId, name: retailerName } })
          }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ProductsPage() {
  const supabase = createSupabaseBrowserClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<FilterTab>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchProducts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Fetch products joined with retailers
    const { data: productData } = await supabase
      .from('products')
      .select('id, name, category, reorder_quantity, product_url, created_at, retailers!retailer_id ( id, name )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!productData) { setLoading(false); return }

    // Fetch which product_ids have schedules
    const ids = productData.map(p => p.id)
    const { data: scheduleData } = ids.length
      ? await supabase
          .from('purchase_schedules')
          .select('product_id')
          .in('product_id', ids)
      : { data: [] }

    const scheduledIds = new Set((scheduleData ?? []).map((s: any) => s.product_id))

    setProducts(
      productData.map(p => ({
        ...(p as any),
        has_schedule: scheduledIds.has(p.id),
      })) as Product[]
    )
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleUpdate = useCallback((id: string, patch: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }, [])

  const handleScheduleCreated = useCallback((productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, has_schedule: true } : p))
  }, [])

  // Re-fetch after adding a product via AddProductModal
  const handleProductAdded = useCallback(() => {
    fetchProducts()
  }, [fetchProducts])

  // Filter logic
  const query = searchQuery.toLowerCase().trim()
  const filtered = products
    .filter(p => {
      if (tab === 'scheduled')   return p.has_schedule
      if (tab === 'unscheduled') return !p.has_schedule
      return true
    })
    .filter(p =>
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.retailers?.name ?? '').toLowerCase().includes(query)
    )

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all',          label: `All (${products.length})` },
    { id: 'scheduled',    label: `Has Schedule (${products.filter(p => p.has_schedule).length})` },
    { id: 'unscheduled',  label: `No Schedule (${products.filter(p => !p.has_schedule).length})` },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">
            {loading ? 'Loading…' : `${products.length} product${products.length !== 1 ? 's' : ''} in your reorder catalog`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
        >
          <Plus size={16} /> Add product
        </button>
      </div>

      {/* Search bar */}
      {!loading && products.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by product or retailer…"
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#16213E] border border-gray-200 dark:border-white/10
              rounded-xl text-sm font-body text-rx-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500
              focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange shadow-sm dark:shadow-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Filter tabs */}
      {!loading && products.length > 0 && (
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

      {/* Skeletons */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state — no products at all */}
      {!loading && products.length === 0 && (
        <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center mb-4">
            <Package size={26} className="text-rx-orange" />
          </div>
          <h2 className="font-heading font-semibold text-rx-navy dark:text-white text-base mb-1">No products yet</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-body max-w-xs mb-6">
            Add the products you buy repeatedly and Restox will automate the reordering for you.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
          >
            Add your first product
          </button>
        </div>
      )}

      {/* Empty filtered state */}
      {!loading && products.length > 0 && filtered.length === 0 && (
        <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm py-10 flex flex-col items-center text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 font-body">
            {searchQuery ? `No products matching "${searchQuery}"` : `No ${tab === 'scheduled' ? 'scheduled' : 'unscheduled'} products`}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-rx-orange hover:text-rx-orange-dark font-semibold font-body transition-colors">
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Product cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              idx={i}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onScheduleCreated={handleScheduleCreated}
            />
          ))}
        </div>
      )}

      {/* Ad: rectangle after product list */}
      {!loading && products.length > 0 && (
        <AdSlot slot="products-rectangle" format="rectangle" className="py-2" />
      )}

      {/* Add product modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleProductAdded}
        />
      )}
    </div>
  )
}
