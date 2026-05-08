'use client'

import { useState } from 'react'
import { AlertCircle, ChevronRight, Store, CheckCircle, Plus } from 'lucide-react'
import RetailerConnectModal from '@/components/dashboard/RetailerConnectModal'
import RequestRetailerModal from '@/components/dashboard/RequestRetailerModal'

const ALL_RETAILERS = [
  { id: 1, name: 'Amazon',     emoji: '🛒' },
  { id: 2, name: 'Walmart',    emoji: '🏪' },
  { id: 3, name: 'Costco',     emoji: '🏬' },
  { id: 4, name: 'Target',     emoji: '🎯' },
  { id: 5, name: 'Kroger',     emoji: '🛍️' },
  { id: 6, name: 'Sephora',    emoji: '💄' },
  { id: 7, name: 'Staples',    emoji: '📎' },
  { id: 8, name: 'Home Depot', emoji: '🔨' },
]

type Retailer = typeof ALL_RETAILERS[0]

export default function RetailersPage() {
  const [connected, setConnected] = useState<Retailer[]>([])
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const available = ALL_RETAILERS.filter(r => !connected.find(c => c.id === r.id))

  const handleConnected = (name: string) => {
    const retailer = ALL_RETAILERS.find(r => r.name === name)
    if (retailer) setConnected(prev => [...prev, retailer])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy">Retailers</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">Manage your connected store accounts</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-rx-navy text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors font-body"
        >
          <Plus size={15} /> Request a Retailer
        </button>
      </div>

      {/* Connected */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-rx-navy">Connected ({connected.length})</h2>
        </div>
        {connected.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Store size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-rx-navy font-body mb-1">No retailers connected yet</p>
            <p className="text-xs text-gray-400 font-body max-w-xs">
              Connect your first store below to start tracking and automating purchases.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {connected.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-3xl">{r.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-rx-navy font-body text-sm">{r.name}</span>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-body">
                      <CheckCircle size={11} /> Connected
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-body mt-0.5">0 products tracked</p>
                </div>
                <button
                  onClick={() => setConnected(prev => prev.filter(c => c.id !== r.id))}
                  className="text-xs text-gray-400 hover:text-red-500 font-body transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available to connect */}
      {available.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-heading font-semibold text-rx-navy">Add a Retailer</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {available.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRetailer(r)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
              >
                <span className="text-3xl">{r.emoji}</span>
                <span className="flex-1 font-medium text-rx-navy font-body text-sm">{r.name}</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-rx-orange transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info callout */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700 font-body">
          <p className="font-semibold mb-0.5">How retailer connections work</p>
          <p>We try OAuth first (most secure), then the browser extension, then credential input as a fallback.</p>
        </div>
      </div>

      {/* Modals */}
      {selectedRetailer && (
        <RetailerConnectModal
          retailer={selectedRetailer}
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
