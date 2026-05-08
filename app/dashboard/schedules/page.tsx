import { Plus, CalendarClock } from 'lucide-react'

export default function SchedulesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy">Schedules</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">Your active reorder schedules</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body">
          <Plus size={16} /> New schedule
        </button>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-rx-orange-light flex items-center justify-center mb-4">
          <CalendarClock size={26} className="text-rx-orange" />
        </div>
        <h2 className="font-heading font-semibold text-rx-navy text-base mb-1">No schedules yet</h2>
        <p className="text-sm text-gray-400 font-body max-w-xs mb-6">
          Add a product first, then set a reorder schedule and Restox will handle the rest automatically.
        </p>
        <div className="flex gap-3">
          <a
            href="/dashboard/products"
            className="px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
          >
            Add a product
          </a>
          <a
            href="/dashboard/retailers"
            className="px-4 py-2 bg-white border border-gray-200 text-rx-navy text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors font-body"
          >
            Connect a retailer
          </a>
        </div>
      </div>
    </div>
  )
}
