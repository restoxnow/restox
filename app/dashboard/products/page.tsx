import { Plus, Search, Package, ExternalLink } from 'lucide-react'

export default function ProductsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy">Products</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">Your reorder catalog</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body">
          <Plus size={16} /> Add product
        </button>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-rx-orange-light flex items-center justify-center mb-4">
          <Package size={26} className="text-rx-orange" />
        </div>
        <h2 className="font-heading font-semibold text-rx-navy text-base mb-1">No products yet</h2>
        <p className="text-sm text-gray-400 font-body max-w-xs mb-6">
          Add the products you buy repeatedly and Restox will automate the reordering for you.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg px-4">
          {[
            { icon: Search,      title: 'Search',       desc: 'Find by name or category' },
            { icon: ExternalLink,title: 'Paste URL',    desc: 'Drop in any retailer link' },
            { icon: Package,     title: 'From history', desc: 'Import detected repeats' },
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
