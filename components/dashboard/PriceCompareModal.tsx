'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, RefreshCw, CheckCircle, TrendingDown, Loader2, BarChart2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface PriceRow {
  id: string
  retailer_id: string | null
  retailer_name: string
  price: number
  checked_at: string
}

interface Props {
  product: {
    id: string
    name: string
    retailers: { id: string; name: string } | null
  }
  onClose: () => void
  onRetailerSwitched?: (retailerId: string, retailerName: string) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function PriceCompareModal({ product, onClose, onRetailerSwitched }: Props) {
  const supabase = createSupabaseBrowserClient()
  const [comparisons, setComparisons] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [currentRetailerId, setCurrentRetailerId] = useState(product.retailers?.id ?? null)
  const [currentRetailerName, setCurrentRetailerName] = useState(product.retailers?.name ?? null)

  const fetchComparisons = useCallback(async () => {
    const { data } = await supabase
      .from('price_comparisons')
      .select('id, retailer_id, retailer_name, price, checked_at')
      .eq('product_id', product.id)
      .order('price', { ascending: true })
    setComparisons((data as PriceRow[]) ?? [])
    setLoading(false)
  }, [supabase, product.id])

  useEffect(() => { fetchComparisons() }, [fetchComparisons])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/price-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })
      await fetchComparisons()
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
              disabled={refreshing}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg
                bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-body disabled:opacity-50"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh prices'}
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
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : comparisons.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
                <TrendingDown size={22} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-rx-navy dark:text-white font-body mb-1">
                No price data yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body max-w-xs mb-4">
                No price data available yet — check back after your next scheduled order, or refresh now.
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-xs font-semibold rounded-lg hover:bg-rx-orange-dark transition-colors font-body disabled:opacity-60"
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Fetching prices…' : 'Fetch prices now'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {currentRetailerName && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body mb-3">
                  Currently buying from <span className="font-semibold text-rx-navy dark:text-white">{currentRetailerName}</span>
                </p>
              )}
              {comparisons.map(row => {
                const isLowest   = row.price === lowestPrice
                const isCurrent  = row.retailer_id === currentRetailerId
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
                    {/* Retailer name */}
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
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body mt-0.5">
                        Checked {formatDate(row.checked_at)}
                      </p>
                    </div>

                    {/* Price */}
                    <span className={`text-base font-bold font-heading shrink-0
                      ${isLowest ? 'text-green-600 dark:text-green-400' : 'text-rx-navy dark:text-white'}`}>
                      ${row.price.toFixed(2)}
                    </span>

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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
