import { CheckCircle, SkipForward, Clock, Plus, Store, DollarSign, Package, LayoutDashboard } from 'lucide-react'

const UPCOMING_ORDERS = [
  { id: 1, product: 'Dawn Dish Soap 90oz',      retailer: 'Amazon',  date: 'Tomorrow', qty: 2, price: 12.99, savings: true },
  { id: 2, product: 'Tide Pods 96ct',            retailer: 'Costco',  date: 'May 10',   qty: 1, price: 22.49, savings: false },
  { id: 3, product: 'Bounty Paper Towels 12pk',  retailer: 'Walmart', date: 'May 12',   qty: 1, price: 18.97, savings: false },
  { id: 4, product: 'Cascade Dishwasher Pods',   retailer: 'Amazon',  date: 'May 15',   qty: 1, price: 16.49, savings: true },
]

const STATS = [
  { label: 'Active Schedules',    value: '4',      icon: Clock,       bg: 'bg-blue-50',   icon_color: 'text-blue-600' },
  { label: 'Connected Retailers', value: '3',      icon: Store,       bg: 'bg-rx-orange-light', icon_color: 'text-rx-orange' },
  { label: 'Products Tracked',    value: '12',     icon: Package,     bg: 'bg-purple-50', icon_color: 'text-purple-600' },
  { label: 'Saved This Month',    value: '$14.20', icon: DollarSign,  bg: 'bg-green-50',  icon_color: 'text-green-600' },
]

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1 font-body">Your upcoming orders and quick actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, bg, icon_color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
              <Icon size={18} className={icon_color} />
            </div>
            <p className="text-2xl font-heading font-bold text-rx-navy">{value}</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-rx-navy">Upcoming Orders</h2>
          <button className="flex items-center gap-1.5 text-sm text-rx-orange hover:text-rx-orange-dark font-body font-medium transition-colors">
            <Plus size={14} /> Add product
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {UPCOMING_ORDERS.map(order => (
            <div key={order.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Package size={18} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-rx-navy font-body truncate">{order.product}</p>
                  {order.savings && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full shrink-0">
                      💰 Save available
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {order.retailer} · Qty {order.qty} · ${order.price}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-rx-navy font-body">{order.date}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                    <CheckCircle size={12} /> Confirm
                  </button>
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium">
                    <SkipForward size={12} /> Skip
                  </button>
                  <button className="flex items-center gap-1 text-xs text-rx-blue hover:text-rx-blue-light font-medium">
                    <Clock size={12} /> Reschedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick action prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-rx-orange-light border border-rx-orange/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rx-orange flex items-center justify-center shrink-0">
            <Store size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-rx-navy text-sm">Add a retailer</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">Connect Amazon, Walmart, Target & more</p>
          </div>
          <a href="/dashboard/retailers" className="shrink-0 px-3 py-1.5 bg-rx-orange text-white text-xs font-semibold rounded-lg hover:bg-rx-orange-dark transition-colors font-body">
            Connect
          </a>
        </div>
        <div className="bg-rx-blue/5 border border-rx-blue/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rx-blue flex items-center justify-center shrink-0">
            <Plus size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-rx-navy text-sm">Add a product</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">Search, paste a URL, or import history</p>
          </div>
          <a href="/dashboard/products" className="shrink-0 px-3 py-1.5 bg-rx-blue text-white text-xs font-semibold rounded-lg hover:bg-rx-blue-light transition-colors font-body">
            Add
          </a>
        </div>
      </div>
    </div>
  )
}
