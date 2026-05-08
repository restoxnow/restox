'use client'

import { useState } from 'react'
import { Bell, X, CheckCircle, SkipForward, Clock } from 'lucide-react'

type NotifStatus = 'pending' | 'confirmed' | 'skipped' | 'rescheduled'

interface Notification {
  id: number
  product: string
  retailer: string
  orderDate: string
  status: NotifStatus
}

const INITIAL: Notification[] = [
  { id: 1, product: 'Dawn Dish Soap 90oz',    retailer: 'Amazon',  orderDate: 'Tomorrow',  status: 'pending' },
  { id: 2, product: 'Tide Pods 96ct',          retailer: 'Costco',  orderDate: 'In 2 days', status: 'pending' },
  { id: 3, product: 'Bounty Paper Towels 12pk',retailer: 'Walmart', orderDate: 'In 3 days', status: 'pending' },
]

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL)

  const pendingCount = notifications.filter(n => n.status === 'pending').length

  const act = (id: number, status: NotifStatus) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status } : n))

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-500" />
        {pendingCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rx-orange rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">{pendingCount}</span>
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-heading font-semibold text-sm text-rx-navy">Upcoming Orders</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium text-rx-navy font-body">{n.product}</p>
                      <p className="text-xs text-gray-400 font-body">{n.retailer} · {n.orderDate}</p>
                    </div>
                    {n.status !== 'pending' && (
                      <span className="text-xs text-green-600 font-medium capitalize shrink-0">{n.status}</span>
                    )}
                  </div>
                  {n.status === 'pending' && (
                    <div className="flex gap-3">
                      <button onClick={() => act(n.id, 'confirmed')} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                        <CheckCircle size={12} /> Confirm
                      </button>
                      <button onClick={() => act(n.id, 'skipped')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium">
                        <SkipForward size={12} /> Skip
                      </button>
                      <button onClick={() => act(n.id, 'rescheduled')} className="flex items-center gap-1 text-xs text-rx-blue hover:text-rx-blue-light font-medium">
                        <Clock size={12} /> Reschedule
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100">
              <a href="/dashboard/schedules" className="text-xs text-rx-orange hover:text-rx-orange-dark font-medium font-body transition-colors">
                View all schedules →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
