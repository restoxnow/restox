'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Clock, Store, Package, Bell, Plus, CalendarClock,
  CheckCircle, SkipForward, PauseCircle, ChevronRight,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import AdSlot from '@/components/dashboard/AdSlot'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Stats {
  retailers: number
  schedules: number
  products: number
  ordersThisMonth: number
}

interface ScheduleRow {
  id: string
  frequency: string
  status: string
  created_at: string
  products: {
    id: string
    name: string
    retailers: { id: string; name: string } | null
  } | null
}

interface PriceComparison {
  product_id: string
  retailer_id: string | null
  price: number
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />
}

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#16213E] rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
      <Skeleton className="w-9 h-9 rounded-lg mb-3" />
      <Skeleton className="h-7 w-10 mb-2" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

function ScheduleRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-white/5 last:border-0">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-52" />
      </div>
      <div className="flex gap-2 shrink-0">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-14 rounded-lg" />
        <Skeleton className="h-7 w-14 rounded-lg" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FREQ_LABEL: Record<string, string> = {
  weekly:     'Weekly',
  'bi-weekly': 'Every 2 weeks',
  monthly:    'Monthly',
  quarterly:  'Quarterly',
  occasional: 'Occasional',
}

function safeCount(
  res: PromiseSettledResult<{ count: number | null; error: any }>
): number {
  if (res.status === 'rejected') return 0
  if (res.value.error) return 0
  return res.value.count ?? 0
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const supabase = createSupabaseBrowserClient()

  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [savingsMap, setSavingsMap] = useState<Record<string, number>>({})

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ---- fetch stats (parallel) --------------------------------------------
  const fetchStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingStats(false); return }

    const monthStart = new Date(
      new Date().getFullYear(), new Date().getMonth(), 1
    ).toISOString()

    const [retailersRes, schedulesRes, productsRes, ordersRes] =
      await Promise.allSettled([
        supabase
          .from('retailers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('connection_status', 'connected'),
        supabase
          .from('purchase_schedules')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('notification_log')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthStart),
      ])

    setStats({
      retailers:      safeCount(retailersRes as any),
      schedules:      safeCount(schedulesRes as any),
      products:       safeCount(productsRes as any),
      ordersThisMonth: safeCount(ordersRes as any),
    })
    setLoadingStats(false)
  }, [supabase])

  // ---- fetch schedules ---------------------------------------------------
  const fetchSchedules = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingSchedules(false); return }

    const { data } = await supabase
      .from('purchase_schedules')
      .select(`
        id, frequency, status, created_at,
        products ( id, name, retailers ( id, name ) )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)

    const rows = (data as unknown as ScheduleRow[]) ?? []
    setSchedules(rows)

    // Fetch price comparisons to compute savings badges
    const productIds = rows.map(s => s.products?.id).filter(Boolean) as string[]
    if (productIds.length > 0) {
      const { data: priceData } = await supabase
        .from('price_comparisons')
        .select('product_id, retailer_id, price')
        .in('product_id', productIds)
        .eq('user_id', user.id)

      if (priceData && priceData.length > 0) {
        const prices = priceData as PriceComparison[]
        const newSavings: Record<string, number> = {}
        for (const s of rows) {
          const productId = s.products?.id
          if (!productId) continue
          const productPrices = prices.filter(p => p.product_id === productId)
          if (productPrices.length < 2) continue
          const currentRetailerId = s.products?.retailers?.id
          const currentPrice = productPrices.find(p => p.retailer_id === currentRetailerId)?.price
          if (!currentPrice) continue
          const lowestPrice = Math.min(...productPrices.map(p => p.price))
          const savings = Math.round((currentPrice - lowestPrice) * 100) / 100
          if (savings > 0.01) newSavings[s.id] = savings
        }
        setSavingsMap(newSavings)
      }
    }

    setLoadingSchedules(false)
  }, [supabase])

  useEffect(() => {
    fetchStats()
    fetchSchedules()
  }, [fetchStats, fetchSchedules])

  // ---- action buttons ----------------------------------------------------
  const handleAction = useCallback(async (
    id: string,
    newStatus: 'confirmed' | 'skipped' | 'paused',
  ) => {
    setActionLoading(id + newStatus)
    const { error } = await supabase
      .from('purchase_schedules')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      setSchedules(prev => prev.filter(s => s.id !== id))
      setStats(prev =>
        prev ? { ...prev, schedules: Math.max(0, prev.schedules - 1) } : prev
      )
    }
    setActionLoading(null)
  }, [supabase])

  // ---- stat card definitions ---------------------------------------------
  const STAT_DEFS = [
    { key: 'retailers'      as const, label: 'Connected Retailers', icon: Store,   bg: 'bg-rx-orange-light dark:bg-rx-orange/10', color: 'text-rx-orange',                       href: '/dashboard/retailers' },
    { key: 'schedules'      as const, label: 'Active Schedules',    icon: Clock,   bg: 'bg-blue-50 dark:bg-blue-900/30',          color: 'text-blue-600 dark:text-blue-400',     href: '/dashboard/schedules' },
    { key: 'products'       as const, label: 'Products Tracked',    icon: Package, bg: 'bg-purple-50 dark:bg-purple-900/30',      color: 'text-purple-600 dark:text-purple-400', href: '/dashboard/products' },
    { key: 'ordersThisMonth' as const, label: 'Orders This Month',  icon: Bell,    bg: 'bg-green-50 dark:bg-green-900/30',        color: 'text-green-600 dark:text-green-400',   href: null },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">Your upcoming orders and quick actions</p>
      </div>

      {/* ---- Stats row ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : STAT_DEFS.map(({ key, label, icon: Icon, bg, color, href }) => {
              const card = (
                <div className={`bg-white dark:bg-[#16213E] rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none h-full
                  ${href ? 'hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md transition-all' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
                    <Icon size={18} className={color} />
                  </div>
                  <p className="text-2xl font-heading font-bold text-rx-navy dark:text-white">
                    {stats?.[key] ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-0.5">{label}</p>
                </div>
              )
              return href
                ? <Link key={key} href={href} className="block">{card}</Link>
                : <div key={key}>{card}</div>
            })
        }
      </div>

      {/* ---- Ad: banner between stats and upcoming orders ---- */}
      <AdSlot slot="dashboard-home-banner" format="banner" className="w-full" />

      {/* ---- Upcoming orders ---- */}
      <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Upcoming Orders</h2>
          {!loadingSchedules && schedules.length > 0 && (
            <Link
              href="/dashboard/schedules"
              className="text-xs font-semibold text-rx-orange hover:text-rx-orange-dark font-body transition-colors flex items-center gap-0.5"
            >
              View all <ChevronRight size={13} />
            </Link>
          )}
        </div>

        {loadingSchedules ? (
          <div>
            {Array.from({ length: 3 }).map((_, i) => <ScheduleRowSkeleton key={i} />)}
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
              <CalendarClock size={22} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-rx-navy dark:text-white font-body mb-1">
              No upcoming orders
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-body max-w-xs mb-4">
              Add a product to get started
            </p>
            <Link
              href="/dashboard/products"
              className="px-4 py-2 bg-rx-orange text-white text-xs font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
            >
              Add a Product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {schedules.map(s => {
              const productName  = s.products?.name ?? 'Unknown product'
              const retailerName = s.products?.retailers?.name ?? '—'

              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4 flex-wrap sm:flex-nowrap">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                    <Package size={18} className="text-gray-400 dark:text-gray-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-rx-navy dark:text-white font-body truncate">
                        {productName}
                      </p>
                      {savingsMap[s.id] && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800/30 font-body shrink-0">
                          💰 Save ${savingsMap[s.id].toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">
                      {retailerName} · {FREQ_LABEL[s.frequency] ?? s.frequency}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Confirm */}
                    <button
                      onClick={() => handleAction(s.id, 'confirmed')}
                      disabled={!!actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg
                        bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400
                        hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors font-body disabled:opacity-50"
                    >
                      <CheckCircle size={12} />
                      {actionLoading === s.id + 'confirmed' ? '…' : 'Confirm'}
                    </button>

                    {/* Skip */}
                    <button
                      onClick={() => handleAction(s.id, 'skipped')}
                      disabled={!!actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg
                        bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400
                        hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-body disabled:opacity-50"
                    >
                      <SkipForward size={12} />
                      {actionLoading === s.id + 'skipped' ? '…' : 'Skip'}
                    </button>

                    {/* Pause */}
                    <button
                      onClick={() => handleAction(s.id, 'paused')}
                      disabled={!!actionLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg
                        bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400
                        hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-body disabled:opacity-50"
                    >
                      <PauseCircle size={12} />
                      {actionLoading === s.id + 'paused' ? '…' : 'Pause'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ---- Persistent prompt cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-rx-orange-light dark:bg-rx-orange/10 border border-rx-orange/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rx-orange flex items-center justify-center shrink-0">
            <Store size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-rx-navy dark:text-white text-sm">Connect a retailer</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-0.5">Amazon, Walmart, Target &amp; more</p>
          </div>
          <Link
            href="/dashboard/retailers"
            className="shrink-0 px-3 py-1.5 bg-rx-orange text-white text-xs font-semibold rounded-lg hover:bg-rx-orange-dark transition-colors font-body"
          >
            Connect
          </Link>
        </div>

        <div className="bg-rx-blue/5 dark:bg-rx-blue/10 border border-rx-blue/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rx-blue flex items-center justify-center shrink-0">
            <Plus size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-rx-navy dark:text-white text-sm">Add a product</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-0.5">Search, paste a URL, or import history</p>
          </div>
          <Link
            href="/dashboard/products"
            className="shrink-0 px-3 py-1.5 bg-rx-blue text-white text-xs font-semibold rounded-lg hover:bg-rx-blue-light transition-colors font-body"
          >
            Add
          </Link>
        </div>
      </div>
    </div>
  )
}
