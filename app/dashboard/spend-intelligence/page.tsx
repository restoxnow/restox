'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Lock, CreditCard, Mail, Camera, PieChart, RefreshCw, Plus, Building2, ChevronDown, X, CheckCircle } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { usePlaidLink } from 'react-plaid-link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import SpendAddModal from '@/components/dashboard/SpendAddModal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface RecurringItem {
  merchant: string
  occurrences: number
  avgAmount: number
  frequency: string
  lastSeen: string
  category: string | null
}

// ---------------------------------------------------------------------------
// Paywall sample rows
// ---------------------------------------------------------------------------
const SAMPLE_ROWS = [
  { id: 1, product: 'Organic Coffee Beans', source: 'email',   spend: '$18.99/mo avg'  },
  { id: 2, product: 'Protein Powder',        source: 'plaid',  spend: '$44.99/6wks avg' },
  { id: 3, product: 'Laundry Detergent',     source: 'receipt',spend: '$21.99/mo avg'  },
]
const SOURCE_ICON: Record<string, React.ElementType> = { email: Mail, plaid: CreditCard, receipt: Camera }
const SOURCE_LABEL: Record<string, string> = { email: 'Email parsing', plaid: 'Plaid bank link', receipt: 'Receipt OCR' }

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  'bi-weekly': 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  occasional: 'Occasional',
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl shadow-lg font-body animate-fade-in">
      <CheckCircle size={16} />
      {message}
      <button onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Plaid Link button
// ---------------------------------------------------------------------------
function LinkBankButton({ onSuccess }: { onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const fetchToken = useCallback(async () => {
    setTokenLoading(true)
    setTokenError(null)
    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create link token')
      setLinkToken(data.link_token)
    } catch (err: any) {
      setTokenError(err.message)
    } finally {
      setTokenLoading(false)
    }
  }, [])

  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    try {
      await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: publicToken,
          institution_name: metadata?.institution?.name ?? null,
        }),
      })
      onSuccess()
    } catch { /* non-fatal */ }
  }, [onSuccess])

  const { open, ready } = usePlaidLink({ token: linkToken ?? '', onSuccess: handlePlaidSuccess })

  const handleClick = useCallback(async () => {
    if (linkToken && ready) open()
    else await fetchToken()
  }, [linkToken, ready, open, fetchToken])

  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={tokenLoading}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors font-body"
      >
        <Building2 size={16} />
        {tokenLoading ? 'Connecting…' : 'Link Bank Account'}
      </button>
      {tokenError && <p className="text-xs text-red-500 font-body">{tokenError}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Recurring purchase card
// ---------------------------------------------------------------------------
interface RecurringCardProps {
  item: RecurringItem
  isAdded: boolean
  onIgnore: (merchant: string) => void
  onAdd: (item: RecurringItem) => void
}

function RecurringCard({ item, isAdded, onIgnore, onAdd }: RecurringCardProps) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleIgnore = () => {
    setExiting(true)
    timerRef.current = setTimeout(() => onIgnore(item.merchant), 300)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        exiting ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-40'
      }`}
    >
      <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-rx-navy dark:text-white font-body truncate">{item.merchant}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">
            {FREQ_LABEL[item.frequency] ?? item.frequency} · avg ${item.avgAmount.toFixed(2)} · {item.occurrences}× in 24 mo
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => !isAdded && onAdd(item)}
            disabled={isAdded}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors font-body ${
              isAdded
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
                : 'bg-rx-orange-light dark:bg-rx-orange/10 text-rx-orange hover:bg-orange-100 dark:hover:bg-rx-orange/20'
            }`}
          >
            {isAdded
              ? <><CheckCircle size={12} />Added</>
              : <><Plus size={12} />Add to Restox</>
            }
          </button>
          {!isAdded && (
            <button
              onClick={handleIgnore}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-body"
            >
              <X size={12} />
              Ignore
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ignored merchant row
// ---------------------------------------------------------------------------
function IgnoredRow({ merchant, onRestore }: { merchant: string; onRestore: (m: string) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
          <CreditCard size={14} className="text-gray-400 dark:text-gray-500" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-body">{merchant}</span>
      </div>
      <button
        onClick={() => onRestore(merchant)}
        className="text-xs font-semibold text-rx-orange hover:text-rx-orange-dark transition-colors font-body"
      >
        Restore
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function SpendIntelligencePage() {
  const { hasProAccess } = useUser()
  const supabase = createSupabaseBrowserClient()

  const [recurring, setRecurring] = useState<RecurringItem[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ignored state
  const [ignored, setIgnored] = useState<string[]>([])
  const [ignoredOpen, setIgnoredOpen] = useState(false)

  // Added state — seeded from products table so "Added" persists across sessions
  const [addedMerchants, setAddedMerchants] = useState<Set<string>>(new Set())

  // Modal + toast
  const [addingItem, setAddingItem] = useState<RecurringItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Load ignored merchants
  useEffect(() => {
    if (!hasProAccess) return
    fetch('/api/user/ignored-merchants')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.ignored_merchants)) setIgnored(d.ignored_merchants) })
      .catch(() => {})
  }, [hasProAccess])

  // Load already-added merchants from products table
  useEffect(() => {
    if (!hasProAccess) return
    async function loadAdded() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('products')
        .select('name')
        .eq('user_id', user.id)
        .eq('category', 'spend-intelligence')
      if (data) setAddedMerchants(new Set(data.map(p => p.name)))
    }
    loadAdded()
  }, [hasProAccess, supabase])

  const persistIgnored = useCallback((merchants: string[]) => {
    fetch('/api/user/ignored-merchants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchants }),
    }).catch(() => {})
  }, [])

  const handleIgnore = useCallback((merchant: string) => {
    setIgnored(prev => {
      const next = prev.includes(merchant) ? prev : [...prev, merchant]
      persistIgnored(next)
      return next
    })
  }, [persistIgnored])

  const handleRestore = useCallback((merchant: string) => {
    setIgnored(prev => {
      const next = prev.filter(m => m !== merchant)
      persistIgnored(next)
      return next
    })
  }, [persistIgnored])

  const handleAdded = useCallback((merchant: string) => {
    setAddedMerchants(prev => new Set([...prev, merchant]))
    setToast('Added to Restox! Check your Schedules page.')
  }, [])

  const fetchRecurring = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/plaid/transactions')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load transactions')
      setRecurring(data.recurring ?? [])
      setConnected(data.connected ?? false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }, [])

  useEffect(() => {
    if (hasProAccess) fetchRecurring()
  }, [hasProAccess, fetchRecurring])

  const handlePlaidSuccess = useCallback(() => { fetchRecurring() }, [fetchRecurring])

  const visible = recurring.filter(r => !ignored.includes(r.merchant))
  const ignoredItems = recurring.filter(r => ignored.includes(r.merchant))
  const ghostIgnored = ignored.filter(m => !recurring.some(r => r.merchant === m))
  const allIgnoredMerchants = [...ignoredItems.map(i => i.merchant), ...ghostIgnored]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Spend Intelligence</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">AI-powered purchase insights and automation suggestions</p>
      </div>

      {!hasProAccess ? (
        <>
          {/* Blurred paywall preview */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="blur-sm pointer-events-none select-none bg-white dark:bg-[#16213E] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm divide-y divide-gray-50 dark:divide-white/5">
              {SAMPLE_ROWS.map(row => {
                const Icon = SOURCE_ICON[row.source]
                return (
                  <div key={row.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Icon size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-rx-navy dark:text-white font-body">{row.product}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">
                        Detected via {SOURCE_LABEL[row.source]} · {row.spend}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-rx-navy/80 backdrop-blur-[2px] rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center mb-4">
                <Lock size={24} className="text-rx-orange" />
              </div>
              <h3 className="font-heading font-bold text-rx-navy dark:text-white text-lg mb-1">Professional Feature</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-body text-center max-w-xs mb-5">
                Spend Intelligence scans your purchase history via Plaid, email, or receipt OCR to surface things you buy repeatedly but haven&apos;t automated yet.
              </p>
              <button className="px-6 py-2.5 bg-rx-orange text-white font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body text-sm">
                Upgrade to Professional — $29/mo
              </button>
              <a href="/dashboard/settings" className="mt-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 font-body transition-colors">
                View all plans
              </a>
            </div>
          </div>

          {/* Source teasers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: CreditCard, title: 'Plaid bank link',  desc: 'Scans bank & card transactions to find repeat purchases' },
              { icon: Mail,       title: 'Email parsing',    desc: 'Reads order confirmation emails from retailers' },
              { icon: Camera,     title: 'Receipt OCR',      desc: 'Snap a receipt and Restox extracts products automatically' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 p-4 opacity-50">
                <Icon size={20} className="text-blue-500 dark:text-blue-400 mb-2" />
                <p className="text-sm font-semibold text-rx-navy dark:text-white font-heading">{title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Loading */}
          {loading && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm py-16 flex flex-col items-center text-center">
              <RefreshCw size={28} className="text-blue-500 dark:text-blue-400 animate-spin mb-4" />
              <p className="text-sm text-gray-400 dark:text-gray-500 font-body">Analyzing your transactions…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 font-body">
              {error} —{' '}
              <button onClick={fetchRecurring} className="underline hover:no-underline">retry</button>
            </div>
          )}

          {/* No bank connected */}
          {!loading && fetched && !connected && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm py-16 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <PieChart size={26} className="text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="font-heading font-semibold text-rx-navy dark:text-white text-base mb-1">No insights yet</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-body max-w-xs mb-6">
                Connect a retailer or link your bank account to surface products you buy repeatedly.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/dashboard/retailers" className="px-5 py-2.5 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body">
                  Connect a Retailer
                </Link>
                <LinkBankButton onSuccess={handlePlaidSuccess} />
              </div>
            </div>
          )}

          {/* All ignored empty state */}
          {!loading && fetched && connected && visible.length === 0 && allIgnoredMerchants.length > 0 && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm py-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <PieChart size={26} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="font-heading font-semibold text-rx-navy dark:text-white text-base mb-1">All suggestions ignored</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-body max-w-xs mb-4">
                Restore suggestions below or link another bank account to find more.
              </p>
              <LinkBankButton onSuccess={handlePlaidSuccess} />
            </div>
          )}

          {/* Nothing found (no ignored either) */}
          {!loading && fetched && connected && visible.length === 0 && allIgnoredMerchants.length === 0 && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm py-16 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <PieChart size={26} className="text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="font-heading font-semibold text-rx-navy dark:text-white text-base mb-1">No recurring purchases found</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-body max-w-xs mb-4">
                Your bank is connected. We didn&apos;t find any clear repeat purchases in the last 24 months.
              </p>
              <LinkBankButton onSuccess={handlePlaidSuccess} />
            </div>
          )}

          {/* Recurring list */}
          {!loading && visible.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-body">
                  {visible.length} recurring purchase{visible.length !== 1 ? 's' : ''} detected
                </p>
                <div className="flex items-center gap-3">
                  <LinkBankButton onSuccess={handlePlaidSuccess} />
                  <button
                    onClick={fetchRecurring}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 font-body transition-colors"
                  >
                    <RefreshCw size={13} />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {visible.map(item => (
                  <RecurringCard
                    key={item.merchant}
                    item={item}
                    isAdded={addedMerchants.has(item.merchant)}
                    onIgnore={handleIgnore}
                    onAdd={setAddingItem}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ignored section */}
          {!loading && fetched && allIgnoredMerchants.length > 0 && (
            <div className="border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setIgnoredOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 font-body">
                  Ignored suggestions ({allIgnoredMerchants.length})
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${ignoredOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {ignoredOpen && (
                <div className="p-4 space-y-2 bg-white dark:bg-[#16213E]">
                  {allIgnoredMerchants.map(merchant => (
                    <IgnoredRow key={merchant} merchant={merchant} onRestore={handleRestore} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add to Restox modal */}
      {addingItem && (
        <SpendAddModal
          item={addingItem}
          onClose={() => setAddingItem(null)}
          onAdded={handleAdded}
        />
      )}

      {/* Success toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
