import Link from 'next/link'
import { Clock, Store, Package, DollarSign, Plus, CalendarClock } from 'lucide-react'

const STATS = [
  { label: 'Active Schedules',    value: '0',  icon: Clock,      bg: 'bg-blue-50',         color: 'text-blue-600',   href: '/dashboard/schedules' },
  { label: 'Connected Retailers', value: '0',  icon: Store,      bg: 'bg-rx-orange-light', color: 'text-rx-orange',  href: '/dashboard/retailers' },
  { label: 'Products Tracked',    value: '0',  icon: Package,    bg: 'bg-purple-50',       color: 'text-purple-600', href: '/dashboard/products' },
  { label: 'Saved This Month',    value: '$0', icon: DollarSign, bg: 'bg-green-50',        color: 'text-green-600',  href: null },
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
        {STATS.map(({ label, value, icon: Icon, bg, color, href }) => {
          const card = (
            <div className={`bg-white rounded-xl p-4 border border-gray-100 shadow-sm h-full
              ${href ? 'hover:border-gray-300 hover:shadow-md transition-all' : ''}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-heading font-bold text-rx-navy">{value}</p>
              <p className="text-xs text-gray-500 font-body mt-0.5">{label}</p>
            </div>
          )
          return href ? (
            <Link key={label} href={href} className="block">
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          )
        })}
      </div>

      {/* Upcoming orders — empty state */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-rx-navy">Upcoming Orders</h2>
        </div>
        <div className="py-12 flex flex-col items-center text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <CalendarClock size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-rx-navy font-body mb-1">No upcoming orders</p>
          <p className="text-xs text-gray-400 font-body max-w-xs">
            Once you add products and set reorder schedules, your upcoming orders will appear here.
          </p>
        </div>
      </div>

      {/* Quick action prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-rx-orange-light border border-rx-orange/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rx-orange flex items-center justify-center shrink-0">
            <Store size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-rx-navy text-sm">Connect a retailer</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">Amazon, Walmart, Target & more</p>
          </div>
          <a
            href="/dashboard/retailers"
            className="shrink-0 px-3 py-1.5 bg-rx-orange text-white text-xs font-semibold rounded-lg hover:bg-rx-orange-dark transition-colors font-body"
          >
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
          <a
            href="/dashboard/products"
            className="shrink-0 px-3 py-1.5 bg-rx-blue text-white text-xs font-semibold rounded-lg hover:bg-rx-blue-light transition-colors font-body"
          >
            Add
          </a>
        </div>
      </div>
    </div>
  )
}
