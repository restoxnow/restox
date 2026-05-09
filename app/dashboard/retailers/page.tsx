'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  Search, ChevronDown, ChevronRight, CheckCircle, X,
  Loader2, AlertTriangle, Link2, Calendar,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import RetailerConnectModal from '@/components/dashboard/RetailerConnectModal'
import RequestRetailerModal from '@/components/dashboard/RequestRetailerModal'
import AdSlot from '@/components/dashboard/AdSlot'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Retailer {
  id: number
  name: string
  domain: string
  credentialsOnly?: boolean
}

interface Category {
  id: string
  label: string
  retailers: Retailer[]
}

interface ConnectedRetailer {
  id: string
  name: string
  connection_type: string
  connection_status: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const CATEGORIES: Category[] = [
  {
    id: 'general',
    label: 'General Merchandise',
    retailers: [
      { id: 1,  name: 'Amazon',  domain: 'amazon.com' },
      { id: 2,  name: 'Walmart', domain: 'walmart.com' },
      { id: 3,  name: 'Target',  domain: 'target.com' },
    ],
  },
  {
    id: 'home',
    label: 'Home Improvement',
    retailers: [
      { id: 4,  name: 'Home Depot', domain: 'homedepot.com' },
      { id: 5,  name: "Lowe's",     domain: 'lowes.com', credentialsOnly: true },
    ],
  },
  {
    id: 'grocery',
    label: 'Grocery & Wholesale',
    retailers: [
      { id: 6,  name: 'Kroger',     domain: 'kroger.com' },
      { id: 7,  name: 'Costco',     domain: 'costco.com' },
      { id: 8,  name: "Sam's Club", domain: 'samsclub.com' },
    ],
  },
  {
    id: 'beauty',
    label: 'Beauty & Personal Care',
    retailers: [
      { id: 9,  name: 'Sephora', domain: 'sephora.com' },
    ],
  },
  {
    id: 'pet',
    label: 'Pet Supplies',
    retailers: [
      { id: 10, name: 'Chewy', domain: 'chewy.com', credentialsOnly: true },
    ],
  },
  {
    id: 'office',
    label: 'Office & Business',
    retailers: [
      { id: 11, name: 'Staples', domain: 'staples.com' },
    ],
  },
]

const ALL_RETAILERS = CATEGORIES.flatMap(c => c.retailers)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FALLBACK_COLORS = [
  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
]

function fallbackColor(name: string) {
  return FALLBACK_COLORS[name.charCodeAt(0) % FALLBACK_COLORS.length]
}

function RetailerLogo({ retailer }: { retailer: Retailer }) {
  const [failed, setFailed] = useState(false)
  const color = FALLBACK_COLORS[(retailer.id - 1) % FALLBACK_COLORS.length]
  if (failed) {
    return (
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-heading ${color}`}>
        {retailer.name[0]}
      </div>
    )
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 flex items-center justify-center p-1.5 overflow-hidden">
      <Image
        src={`https://logo.clearbit.com/${retailer.domain}`}
        alt={retailer.name}
        width={48}
        height={48}
        className="object-contain w-full h-full"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  )
}

function ConnectedRetailerLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  const known = ALL_RETAILERS.find(r => r.name.toLowerCase() === name.toLowerCase())
  if (!known || failed) {
    return (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold font-heading ${fallbackColor(name)}`}>
        {name[0].toUpperCase()}
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
      <Image
        src={`https://logo.clearbit.com/${known.domain}`}
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

const CONN_TYPE_BADGE: Record<string, string> = {
  oauth:       'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  credentials: 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400',
  extension:   'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
}
const CONN_TYPE_LABEL: Record<string, string> = {
  oauth: 'OAuth', credentials: 'Credentials', extension: 'Extension',
}

// ---------------------------------------------------------------------------
// ConnectedRetailerCard
// ---------------------------------------------------------------------------
function ConnectedRetailerCard({
  retailer,
  onDisconnect,
}: {
  retailer: ConnectedRetailer
  onDisconnect: (r: ConnectedRetailer) => Promise<void>
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const badgeCls = CONN_TYPE_BADGE[retailer.connection_type] ?? CONN_TYPE_BADGE.credentials
  const badgeLabel = CONN_TYPE_LABEL[retailer.connection_type] ?? retailer.connection_type

  const handleConfirm = async () => {
    setDisconnecting(true)
    await onDisconnect(retailer)
    setDisconnecting(false)
    setShowConfirm(false)
  }

  return (
    <div className="relative bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-4 flex items-center gap-3">
      <ConnectedRetailerLogo name={retailer.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-rx-navy dark:text-white font-body truncate">
            {retailer.name}
          </p>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-body ${badgeCls}`}>
            <Link2 size={9} />
            {badgeLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-body font-semibold">
            <CheckCircle size={11} />
            Connected
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-body">
            <Calendar size={10} />
            {new Date(retailer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <button
        onClick={() => setShowConfirm(v => !v)}
        className="shrink-0 px-3 py-1.5 text-xs font-semibold font-body rounded-lg border border-gray-200 dark:border-white/10
          text-gray-500 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700/40
          hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
      >
        Disconnect
      </button>

      {/* Confirmation popover */}
      {showConfirm && (
        <div className="absolute right-4 top-14 z-20 w-72 bg-white dark:bg-[#1a2744] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-heading">
              Disconnect {retailer.name}?
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body mb-3">
            This will pause all schedules using this retailer.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={disconnecting}
              className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-1"
            >
              {disconnecting ? <Loader2 size={11} className="animate-spin" /> : null}
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-1.5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function RetailersPage() {
  const supabase = createSupabaseBrowserClient()
  const connectedSectionRef = useRef<HTMLDivElement>(null)

  const [dbRetailers, setDbRetailers]         = useState<ConnectedRetailer[]>([])
  const [loadingRetailers, setLoadingRetailers] = useState(true)
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [searchQuery, setSearchQuery]           = useState('')
  const [collapsed, setCollapsed]               = useState<Record<string, boolean>>({})

  // ── Fetch connected retailers from DB ────────────────────────────────────
  const fetchRetailers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingRetailers(false); return }
    const { data } = await supabase
      .from('retailers')
      .select('id, name, connection_type, connection_status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDbRetailers((data as ConnectedRetailer[]) ?? [])
    setLoadingRetailers(false)
  }, [supabase])

  useEffect(() => { fetchRetailers() }, [fetchRetailers])

  // ── Disconnect handler ───────────────────────────────────────────────────
  const handleDisconnect = useCallback(async (retailer: ConnectedRetailer) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('purchase_schedules')
      .update({ status: 'paused' })
      .eq('user_id', user.id)
      .eq('retailer', retailer.name)
    await supabase.from('retailers').delete().eq('id', retailer.id)
    setDbRetailers(prev => prev.filter(r => r.id !== retailer.id))
  }, [supabase])

  // ── After connecting via modal, refresh DB list ──────────────────────────
  const handleConnected = useCallback((_name: string) => {
    fetchRetailers()
  }, [fetchRetailers])

  const isConnectedByName = (name: string) =>
    dbRetailers.some(r => r.name.toLowerCase() === name.toLowerCase())

  const query = searchQuery.toLowerCase().trim()

  const filteredCategories = CATEGORIES
    .map(cat => ({
      ...cat,
      retailers: cat.retailers.filter(r =>
        !query || r.name.toLowerCase().includes(query)
      ),
    }))
    .filter(cat => cat.retailers.length > 0)

  const hasNoResults = !!query && filteredCategories.length === 0

  const toggleCategory = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))

  const isCategoryCollapsed = (id: string) => !query && !!collapsed[id]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Retailers</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">
          {loadingRetailers
            ? 'Loading…'
            : dbRetailers.length > 0
              ? `${dbRetailers.length} retailer${dbRetailers.length === 1 ? '' : 's'} connected`
              : 'Connect your stores to start automating purchases'}
        </p>
      </div>

      {/* ── Connected Retailers section ─────────────────────────────────── */}
      <div ref={connectedSectionRef}>
        <h2 className="font-heading font-semibold text-sm text-rx-navy dark:text-white mb-3">
          Your Connected Retailers
        </h2>

        {loadingRetailers ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 font-body py-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : dbRetailers.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body py-2">
            No retailers connected yet — connect one below.
          </p>
        ) : (
          <div className="space-y-3">
            {dbRetailers.map(r => (
              <ConnectedRetailerCard
                key={r.id}
                retailer={r}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search retailers..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-[#16213E] border border-gray-200 dark:border-white/10
            rounded-xl text-sm font-body text-rx-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
            shadow-sm dark:shadow-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Request a Retailer banner */}
      {!hasNoResults && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-orange-50 dark:bg-rx-orange/10 border border-orange-200 dark:border-rx-orange/20">
          <div>
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-heading leading-tight">
              Don&apos;t see your retailer?
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 font-body mt-0.5">
              We add new retailers every week based on requests.
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="shrink-0 px-4 py-2 bg-rx-orange hover:bg-rx-orange-dark text-white text-sm font-semibold rounded-xl transition-colors font-body whitespace-nowrap"
          >
            Request a Retailer
          </button>
        </div>
      )}

      {/* No-results state */}
      {hasNoResults && (
        <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none py-14 flex flex-col items-center text-center">
          <p className="text-sm font-medium text-rx-navy dark:text-white font-body mb-1">No retailers found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
            Want us to add one?{' '}
            <button
              onClick={() => setShowRequestModal(true)}
              className="text-rx-orange hover:text-rx-orange-dark font-semibold underline transition-colors"
            >
              Request a retailer
            </button>
          </p>
        </div>
      )}

      {/* ── Category sections ───────────────────────────────────────────── */}
      {filteredCategories.map((cat, catIdx) => {
        const collapsed_ = isCategoryCollapsed(cat.id)
        return (
          <div key={cat.id}>
            {catIdx === 1 && (
              <AdSlot slot="retailers-rectangle" format="rectangle" className="mb-6" />
            )}
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <span className="font-heading font-bold text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 group-hover:text-rx-navy dark:group-hover:text-white transition-colors">
                {cat.label}
              </span>
              {collapsed_
                ? <ChevronRight size={15} className="text-gray-400 dark:text-gray-500 group-hover:text-rx-navy dark:group-hover:text-white transition-colors" />
                : <ChevronDown  size={15} className="text-gray-400 dark:text-gray-500 group-hover:text-rx-navy dark:group-hover:text-white transition-colors" />
              }
            </button>

            {!collapsed_ && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cat.retailers.map(r => {
                    const alreadyConnected = isConnectedByName(r.name)
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          if (alreadyConnected) {
                            connectedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          } else {
                            setSelectedRetailer(r)
                          }
                        }}
                        className={`relative bg-white dark:bg-[#16213E] rounded-xl border shadow-sm dark:shadow-none
                          transition-all p-4 flex flex-col items-center gap-2 text-center group
                          ${alreadyConnected
                            ? 'border-green-200 dark:border-green-800/40 hover:border-green-300 dark:hover:border-green-700/50'
                            : 'border-gray-100 dark:border-white/10 hover:border-rx-orange/40 dark:hover:border-rx-orange/30 hover:shadow-md dark:hover:shadow-black/20'
                          }`}
                      >
                        {alreadyConnected && (
                          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold
                            text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                            <CheckCircle size={8} className="shrink-0" /> Connected
                          </span>
                        )}
                        <RetailerLogo retailer={r} />
                        <span className="text-sm font-medium text-rx-navy dark:text-white font-body leading-tight">
                          {r.name}
                        </span>
                        <span className={`text-[10px] font-semibold font-body transition-opacity
                          ${alreadyConnected
                            ? 'text-green-500 dark:text-green-400 opacity-100'
                            : 'text-rx-orange opacity-0 group-hover:opacity-100'
                          }`}>
                          {alreadyConnected ? 'Manage ↑' : 'Connect →'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-300 dark:text-gray-600 font-body pl-0.5">
                  + More coming soon
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Modals */}
      {selectedRetailer && (
        <RetailerConnectModal
          retailer={selectedRetailer}
          defaultTab={selectedRetailer.credentialsOnly ? 'credentials' : 'oauth'}
          onClose={() => setSelectedRetailer(null)}
          onConnected={handleConnected}
        />
      )}
      {showRequestModal && (
        <RequestRetailerModal onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  )
}
