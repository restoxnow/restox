import { CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'

const CONNECTED = [
  { id: 1, name: 'Amazon',  emoji: '🛒', method: 'OAuth',  products: 8 },
  { id: 2, name: 'Walmart', emoji: '🏪', method: 'OAuth',  products: 3 },
]

const AVAILABLE = [
  { id: 3,  name: 'Costco',     emoji: '🏬' },
  { id: 4,  name: 'Target',     emoji: '🎯' },
  { id: 5,  name: 'Kroger',     emoji: '🛍️' },
  { id: 6,  name: 'Sephora',    emoji: '💄' },
  { id: 7,  name: 'Staples',    emoji: '📎' },
  { id: 8,  name: 'Home Depot', emoji: '🔨' },
]

export default function RetailersPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy">Retailers</h1>
        <p className="text-gray-500 text-sm mt-1 font-body">Manage your connected store accounts</p>
      </div>

      {/* Connected */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-rx-navy">Connected ({CONNECTED.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {CONNECTED.map(r => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-3xl">{r.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-rx-navy font-body text-sm">{r.name}</span>
                  <span className="flex items-center gap-1 text-xs text-green-600 font-body">
                    <CheckCircle size={11} /> Connected via {r.method}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-body mt-0.5">{r.products} products tracked</p>
              </div>
              <button className="text-xs text-gray-400 hover:text-red-500 font-body transition-colors">
                Disconnect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Available */}
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
