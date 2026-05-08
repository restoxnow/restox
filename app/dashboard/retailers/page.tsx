import { AlertCircle, ChevronRight, Store } from 'lucide-react'

const AVAILABLE = [
  { id: 1, name: 'Amazon',     emoji: '🛒' },
  { id: 2, name: 'Walmart',    emoji: '🏪' },
  { id: 3, name: 'Costco',     emoji: '🏬' },
  { id: 4, name: 'Target',     emoji: '🎯' },
  { id: 5, name: 'Kroger',     emoji: '🛍️' },
  { id: 6, name: 'Sephora',    emoji: '💄' },
  { id: 7, name: 'Staples',    emoji: '📎' },
  { id: 8, name: 'Home Depot', emoji: '🔨' },
]

export default function RetailersPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy">Retailers</h1>
        <p className="text-gray-500 text-sm mt-1 font-body">Manage your connected store accounts</p>
      </div>

      {/* Connected — empty state */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-rx-navy">Connected (0)</h2>
        </div>
        <div className="py-10 flex flex-col items-center text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <Store size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-rx-navy font-body mb-1">No retailers connected yet</p>
          <p className="text-xs text-gray-400 font-body max-w-xs">
            Connect your first store below to start tracking and automating purchases.
          </p>
        </div>
      </div>

      {/* Available to connect */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-rx-navy">Add a Retailer</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {AVAILABLE.map(r => (
            <button
              key={r.id}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
            >
              <span className="text-3xl">{r.emoji}</span>
              <span className="flex-1 font-medium text-rx-navy font-body text-sm">{r.name}</span>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-rx-orange transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Info callout */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700 font-body">
          <p className="font-semibold mb-0.5">How retailer connections work</p>
          <p>We try OAuth first (most secure), then the browser extension, then credential input as a fallback.</p>
        </div>
      </div>
    </div>
  )
}
