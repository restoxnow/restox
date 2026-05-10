'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, RefreshCw, CheckCircle, TrendingDown, Loader2, BarChart2, Zap, Link2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { addAffiliateTag, isAmazonUrl } from '@/lib/amazon-affiliate'

interface PriceRow {
  id: string
  retailer_id: string | null
  retailer_name: string
  price: number
  checked_at: string
  is_estimated: boolean
  fetched_at: string | null
}

interface Props {
  product: {
    id: string
    name: string
    product_url?: string | null
    schedule_id?: string | null
    retailers: { id: string; name: string } | null
  }
  onClose: () => void
  onRetailerSwitched?: (retailerId: string, retailerName: string) => void
}

const MAJOR_RETAILERS = ['Amazon', 'Walmart', 'Target', 'Costco']
const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 10

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hour${hours !== 1 ? 's' : ''} ago`
}

export default function PriceCompareModal({ product, onClose, onRetailerSwitched }: Props) {
  const supabase = createSupabaseBrowserClient()
  const [comparisons, setComparisons] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [connectedRetailers, setConnectedRetailers] = useState<string[]>([])
  const [currentRetailerId, setCurrentRetailerId] = useState(product.retailers?.id ?? null)
  const [currentRetailerName, setCurrentRetailerName] = useState(product.retailers?.name ?? null)

  const pollCount  = useRef(0)
  const pollTimer  = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null }
  }, [])

  const fetchComparisons = useCallback(async (): Promise<PriceRow[]> => {
    const key   = product.schedule_id ? 'schedule_id' : 'product_id'
    const value = product.schedule_id ?? product.id

    const { data } = await supabase
      .from('price_comparisons')
      .select('id, retailer_id, retailer_name, price, checked_at, is_estimated, fetched_at')
      .eq(key, value)
      .order('price', { ascending: true })

    return (data as PriceRow[]) ?? []
  }, [supabase, product.id, product.schedule_id])

  const loadComparisons = useCallback(async () => {
    const rows = await fetchComparisons()
    setComparisons(rows)
    setLoading(false)
    return rows
  }, [fetchComparisons])

  // On mount: load data, then start polling if empty
  useEffect(() => {
    let cancelled = false

    loadComparisons().then(rows => {
      if (cancelled) return
      if (rows.length === 0 && product.schedule_id) {
        // A fetch was likely triggered on product add — poll for results
        pollCount.current = 0
        pollTimer.current = setInterval(async () => {
          if (cancelled) { stopPolling(); return }
          pollCount.current += 1
          const fresh = await fetchComparisons()
          if (cancelled) return
          if (fresh.length > 0) {
            setComparisons(fresh)
            setFetchFailed(false)
            stopPolling()
          } else if (pollCount.current >= MAX_POLL_ATTEMPTS) {
            setFetchFailed(true)
            stopPolling()
          }
        }, POLL_INTERVAL_MS)
      }
    })

    // Fetch which retailers the user has connected (for unconnected CTAs)
    supabase
      .from('retailers')
      .select('name')
      .eq('connection_status', 'connected')
      .then(({ data }) => {
        if (!cancelled) setConnectedRetailers((data ?? []).map((r: any) => r.name as string))
      })

    return () => {
      cancelled = true
      stopPolling()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerFetch = useCallback(async () => {
    if (!product.schedule_id) return
    await fetch('/api/price-compare/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule_id: product.schedule_id }),
    })
  }, [product.schedule_id])

  const handleRefresh = async () => {
    setRefreshing(true)
    setFetchFailed(false)
    try {
      if (product.schedule_id) {
        await triggerFetch()
      } else {
        await fetch('/api/price-compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        })
      }
      const rows = await fetchComparisons()
      setComparisons(rows)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSwitch = async (row: PriceRow) => {
    if (!row.retailer_id) return
    setSwitchingId(row.retailer_id)
    const { error } = await supabase
      .from('products')
      .update({ retailer_id: row.retailer_id })
      .eq('id', product.id)
    if (!error) {
      setCurrentRetailerId(row.retailer_id)
      setCurrentRetailerName(row.retailer_name)
      onRetailerSwitched?.(row.retailer_id, row.retailer_name)
    }
    setSwitchingId(null)
  }

  const lowestPrice = comparisons.length > 0 ? Math.min(...comparisons.map(c => c.price)) : null
  const lastFetched = comparisons.find(r => r.fetched_at)?.fetched_at
    ?? comparisons.find(r => r.checked_at)?.checked_at
    ?? null

  // Retailers to show "Connect for live pricing" CTAs
  const connectedLower = new Set(connectedRetailers.map(n => n.toLowerCase()))
  const unconnectedCtaRetailers = MAJOR_RETAILERS
    .filter(r =>
      !connectedLower.has(r.toLowerCase()) &&
      // Don't show CTA if we already have a price row for this retailer
      !comparisons.some(c => c.retailer_name.toLowerCase() === r.toLowerCase())
    )
    .slice(0, 3)

  const isPolling = pollTimer.current !== null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16213E] rounded-2xl w-full max-w-md shadow-2xl dark:shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <BarChart2 size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="font-heading font-semibold text-rx-navy dark:text-white text-sm block">
                Price Compare
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-body truncate max-w-[220px] block">
                {product.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || isPolling}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg
                bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-body disabled:opacity-50"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/10 animate-pulse" />
              ))}
            </div>
          )}

          {/* Polling — fetching prices */}
          {!loading && comparisons.length === 0 && !fetchFailed && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                <Loader2 size={22} className="animate-spin text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-rx-navy dark:text-white font-body mb-1">
                Fetching prices…
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body max-w-xs">
                Checking retailer prices now. This takes a few seconds.
              </p>
            </div>
          )}

          {/* Fetch failed empty state */}
          {!loading && comparisons.length === 0 && fetchFailed && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
                <TrendingDown size={22} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-rx-navy dark:text-white font-body mb-1">
                Couldn&apos;t fetch prices automatically
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body max-w-xs mb-4">
                Try refreshing. This can happen if the retailer&apos;s site is temporarily unavailable.
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-xs font-semibold rounded-lg hover:bg-rx-orange-dark transition-colors font-body disabled:opacity-60"
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Fetching…' : 'Try again'}
              </button>
            </div>
          )}

          {/* Price results */}
          {!loading && comparisons.length > 0 && (
            <div className="space-y-2">
              {/* Meta row */}
              <div className="flex items-center justify-between mb-3">
                {currentRetailerName && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body">
                    Currently buying from <span className="font-semibold text-rx-navy dark:text-white">{currentRetailerName}</span>
                  </p>
                )}
                {lastFetched && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body ml-auto">
                    Updated {timeAgo(lastFetched)}
                  </p>
                )}
              </div>

              {/* Amazon disclosure */}
              {comparisons.some(r => r.retailer_name.toLowerCase().includes('amazon')) && (
                <p className="text-[10px] italic text-gray-300 dark:text-gray-600 font-body mb-2">
                  As an Amazon Associate, Restox earns from qualifying purchases.
                </p>
              )}

              {/* Price rows */}
              {comparisons.map(row => {
                const isLowest    = row.price === lowestPrice
                const isCurrent   = row.retailer_id === currentRetailerId
                const isSwitching = switchingId === row.retailer_id

                return (
                  <div
                    key={row.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                      ${isCurrent
                        ? 'border-rx-orange/30 bg-rx-orange-light dark:bg-rx-orange/10'
                        : 'border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-rx-navy dark:text-white font-body">
                          {row.retailer_name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rx-orange/10 text-rx-orange border border-rx-orange/20 font-body">
                            Current
                          </span>
                        )}
                        {isLowest && !isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/30 font-body flex items-center gap-0.5">
                            <CheckCircle size={8} /> Lowest
                          </span>
                        )}
                        {isLowest && isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/30 font-body flex items-center gap-0.5">
                            <CheckCircle size={8} /> Best price
                          </span>
                        )}
                        {row.is_estimated && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 font-body">
                            est.
                          </span>
                        )}
                        {!row.is_estimated && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 font-body flex items-center gap-0.5">
                            <Zap size={7} /> Live
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price + Amazon link */}
                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      <span className={`text-base font-bold font-heading
                        ${row.is_estimated ? 'text-gray-500 dark:text-gray-400' : ''}
                        ${isLowest && !row.is_estimated ? 'text-green-600 dark:text-green-400' : ''}
                        ${isLowest && row.is_estimated ? 'text-gray-500 dark:text-gray-400' : ''}
                        ${!isLowest && !row.is_estimated ? 'text-rx-navy dark:text-white' : ''}
                      `}>
                        {row.is_estimated ? '~' : ''}${row.price.toFixed(2)}
                      </span>
                      {row.retailer_name.toLowerCase().includes('amazon') && product.product_url && isAmazonUrl(product.product_url) && (
                        <a
                          href={addAffiliateTag(product.product_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-rx-orange hover:text-rx-orange/80 font-body transition-colors"
                        >
                          View on Amazon →
                        </a>
                      )}
                    </div>

                    {/* Switch button */}
                    {!isCurrent && row.retailer_id && (
                      <button
                        onClick={() => handleSwitch(row)}
                        disabled={isSwitching || !!switchingId}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg
                          bg-rx-blue/10 dark:bg-rx-blue/20 text-rx-blue dark:text-blue-400
                          hover:bg-rx-blue/20 dark:hover:bg-rx-blue/30 transition-colors font-body disabled:opacity-50"
                      >
                        {isSwitching ? <Loader2 size={10} className="animate-spin" /> : null}
                        Switch
                      </button>
                    )}
                  </div>
                )
              })}

              {/* Unconnected retailer CTAs */}
              {unconnectedCtaRetailers.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 font-body uppercase tracking-wide mb-1">
                    More retailers
                  </p>
                  {unconnectedCtaRetailers.map(name => (
                    <div
                      key={name}
                      className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/3 opacity-70"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 font-body">{name}</span>
                      </div>
                      <a
                        href="/dashboard/retailers"
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg
                          bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400
                          hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400
                          transition-colors font-body"
                      >
                        <Link2 size={10} /> Connect
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Estimated price note */}
              {comparisons.some(r => r.is_estimated) && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-body mt-2">
                  Prices marked <span className="font-semibold">est.</span> are scraped estimates and may not reflect the exact current price.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
