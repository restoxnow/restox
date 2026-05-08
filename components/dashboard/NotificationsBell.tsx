'use client'

import { useState } from 'react'
import { Bell, X, CalendarClock } from 'lucide-react'

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-500 dark:text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-72 bg-white dark:bg-[#16213E] rounded-xl shadow-xl dark:shadow-black/40 border border-gray-100 dark:border-white/10 z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
              <span className="font-heading font-semibold text-sm text-rx-navy dark:text-white">Upcoming Orders</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={14} />
              </button>
            </div>

            <div className="py-10 flex flex-col items-center text-center px-4">
              <CalendarClock size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-rx-navy dark:text-white font-body">No upcoming orders</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-1">
                Orders will appear here once you set up schedules.
              </p>
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/10">
              <a
                href="/dashboard/schedules"
                className="text-xs text-rx-orange hover:text-rx-orange-dark font-medium font-body transition-colors"
              >
                Set up schedules →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
