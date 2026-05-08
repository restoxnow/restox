import { Plus, Search, Package, ExternalLink } from 'lucide-react'

const PRODUCTS = [
  { id: 1, name: 'Dawn Dish Soap 90oz',        retailer: 'Amazon',  category: 'Cleaning',    qty: 2, scheduled: true },
  { id: 2, name: 'Tide Pods 96ct',              retailer: 'Costco',  category: 'Cleaning',    qty: 1, scheduled: true },
  { id: 3, name: 'Bounty Paper Towels 12pk',    retailer: 'Walmart', category: 'Paper Goods', qty: 1, scheduled: true },
  { id: 4, name: 'Cascade Dishwasher Pods 60ct',retailer: 'Amazon',  category: 'Cleaning',    qty: 1, scheduled: true },
  { id: 5, name: 'Ziploc Gallon Bags 60ct',     retailer: 'Amazon',  category: 'Kitchen',     qty: 2, scheduled: false },
  { id: 6, name: 'Vitamin D3 5000IU',           retailer: 'Amazon',  category: 'Health',      qty: 1, scheduled: false },
]

const CATEGORIES = ['All', 'Cleaning', 'Paper Goods', 'Kitchen', 'Health']

export default function ProductsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy">Products</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">{PRODUCTS.length} products in your reorder catalog</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body">
          <Plus size={16} /> Add product
        </button>
      </div>

      {/* Search + category filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
              font-body placeholder:text-gray-400 w-56"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`text-xs px-3 py-1.5 rounded-lg font-body font-medium transition-colors
                ${cat === 'All'
                  ? 'bg-rx-navy text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-rx-navy hover:text-rx-navy'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRODUCTS.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Package size={22} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-rx-navy font-body truncate">{p.name}</p>
              <p className="text-xs text-gray-400 font-body">{p.retailer} · Qty {p.qty} · {p.category}</p>
              <div className="mt-1.5">
                {p.scheduled ? (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Scheduled</span>
                ) : (
                  <button className="text-[10px] font-bold text-rx-orange hover:text-rx-orange-dark bg-rx-orange-light px-1.5 py-0.5 rounded-full transition-colors">
                    + Add schedule
                  </button>
                )}
              </div>
            </div>
            <a href="#" className="text-gray-300 hover:text-rx-blue transition-colors shrink-0">
              <ExternalLink size={15} />
            </a>
          </div>
        ))}
      </div>

      {/* Add product options panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-heading font-semibold text-rx-navy text-sm mb-4">Add a product</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Search, title: 'Search', desc: 'Find by name or category' },
            { icon: ExternalLink, title: 'Paste URL', desc: 'Drop in any retailer link' },
            { icon: Package, title: 'From history', desc: 'One-click from purchase history' },
          ].map(({ icon: Icon, title, desc }) => (
            <button
              key={title}
              className="flex flex-col items-start gap-1.5 p-4 border-2 border-gray-100 hover:border-rx-orange rounded-xl transition-colors text-left"
            >
              <Icon size={18} className="text-rx-orange" />
              <span className="text-sm font-semibold text-rx-navy font-body">{title}</span>
              <span className="text-xs text-gray-400 font-body">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
