'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, ChevronDown, ChevronRight, CheckCircle, X } from 'lucide-react'
import RetailerConnectModal from '@/components/dashboard/RetailerConnectModal'
import RequestRetailerModal from '@/components/dashboard/RequestRetailerModal'

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
      { id: 5,  name: "Lowe's",    domain: 'lowes.com', credentialsOnly: true },
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

// Palette for fallback letter avatars — cycles by retailer id
const FALLBACK_COLORS = [
  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
]

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

export default function RetailersPage() {
  const [connected, setConnected]           = useState<Retailer[]>([])
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const [collapsed, setCollapsed]           = useState<Record<string, boolean>>({})

  const handleConnected = (name: string) => {
    const retailer = ALL_RETAILERS.find(r => r.name === name)
    if (retailer) setConnected(prev => [...prev, retailer])
  }

  const isConnected = (id: number) => connected.some(r => r.id === id)

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

  // Search overrides collapsed state — always expand when filtering
  const isCategoryCollapsed = (id: string) => !query && !!collapsed[id]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Retailers</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">
          {connected.length > 0
            ? `${connected.length} retailer${connected.length === 1 ? '' : 's'} connected`
            : 'Connect your stores to start automating purchases'}
        </p>
      </div>

      {/* Search bar */}
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

      {/* Category sections */}
      {filteredCategories.map(cat => {
        const collapsed_ = isCategoryCollapsed(cat.id)
        return (
          <div key={cat.id}>
            {/* Category header */}
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
                {/* Retailer card grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cat.retailers.map(r => {
                    const alreadyConnected = isConnected(r.id)
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRetailer(r)}
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
                          {alreadyConnected ? 'Manage' : 'Connect →'}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* More coming soon */}
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
