'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Loader2, CheckCircle, Store } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface RecurringItem {
  merchant: string
  avgAmount: number
  frequency: string
}

interface ConnectedRetailer {
  id: string
  name: string
}

interface Props {
  item: RecurringItem
  onClose: () => void
  onAdded: (merchant: string) => void
}

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly', 'bi-weekly': 'Every 2 weeks',
  monthly: 'Monthly', quarterly: 'Quarterly', occasional: 'Occasional',
}

const FREQ_TEXT_TO_DAYS: Record<string, number> = {
  weekly: 7, 'bi-weekly': 14, monthly: 30,
  'six-weekly': 42, 'bi-monthly': 60, quarterly: 90, occasional: 30,
}

export default function SpendAddModal({ item, onClose, onAdded }: Props) {
  const [retailers, setRetailers] = useState<ConnectedRetailer[]>([])
  const [retailerId, setRetailerId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingRetailers, setLoadingRetailers] = useState(true)
  const [error, setError] = useState('')
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    async function fetchRetailers() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('retailers')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('connection_status', 'connected')
        .order('name')
      setRetailers(data ?? [])
      if (data && data.length > 0) setRetailerId(data[0].id)
      setLoadingRetailers(false)
    }
    fetchRetailers()
  }, [supabase])

  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userRow } = await supabase
        .from('users').select('default_frequency').eq('id', user.id).maybeSingle()
      const freqText = item.frequency in FREQ_TEXT_TO_DAYS
        ? item.frequency
        : (userRow?.default_frequency ?? 'monthly')
      const frequencyDays = FREQ_TEXT_TO_DAYS[freqText] ?? 30

      const retailerName = retailers.find(r => r.id === retailerId)?.name ?? ''

      // Insert purchase schedule — product info stored directly, no product_id FK
      const { error: scheduleError } = await supabase
        .from('purchase_schedules')
        .insert({
          user_id:               user.id,
          product_name:          item.merchant,
          retailer:              retailerName,
          quantity,
          frequency_days:        frequencyDays,
          status:                'active',
          ai_managed:            false,
          notification_timing:   '24hr',
          confirmation_required: false,
          notification_channel:  'email',
        })

      if (scheduleError) throw scheduleError

      onAdded(item.merchant)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full px-4 py-2.5 border rounded-xl text-sm font-body
    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
    border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-rx-navy dark:text-white`

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16213E] rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center">
              <CreditCard size={15} className="text-rx-orange" />
            </div>
            <span className="font-heading font-semibold text-rx-navy dark:text-white text-sm">Add to Restox</span>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Detected details (read-only) */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-body">Product</span>
              <span className="text-sm font-semibold text-rx-navy dark:text-white font-body text-right max-w-[200px]">{item.merchant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-body">Detected frequency</span>
              <span className="text-sm font-medium text-rx-navy dark:text-white font-body">{FREQ_LABEL[item.frequency] ?? item.frequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-body">Avg. amount</span>
              <span className="text-sm font-medium text-rx-navy dark:text-white font-body">${item.avgAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Retailer selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1.5">
              Order from
            </label>
            {loadingRetailers ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 font-body py-2">
                <Loader2 size={13} className="animate-spin" /> Loading retailers…
              </div>
            ) : retailers.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5">
                <Store size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="text-xs text-gray-400 dark:text-gray-500 font-body">
                  No retailers connected.{' '}
                  <a href="/dashboard/retailers" onClick={onClose} className="text-rx-orange hover:underline font-semibold">Connect one first →</a>
                </span>
              </div>
            ) : (
              <select
                value={retailerId}
                onChange={e => setRetailerId(e.target.value)}
                className={inputCls}
              >
                {retailers.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1.5">
              Estimated quantity
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className={inputCls}
            />
          </div>

          {error && <p className="text-red-500 text-xs font-body">{error}</p>}

          {/* Actions */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
              rounded-xl text-sm transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Adding…</>
              : <><CheckCircle size={15} /> Confirm &amp; Add to Restox</>
            }
          </button>
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 font-body transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
