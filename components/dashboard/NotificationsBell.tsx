'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Bell, X, CheckCircle2, SkipForward, CalendarClock, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface ScheduleRow {
  id: string
  frequency: string
  status: string
  products: {
    name: string
    retailers: { name: string } | null
  } | null
}

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly', 'bi-weekly': 'Every 2 weeks',
  monthly: 'Monthly', quarterly: 'Quarterly', occasional: 'Occasional',
}

// Fade-out wrapper — animates removal from the list
function FadingRow({ children, exiting }: { children: React.ReactNode; exiting: boolean }) {
  return (
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
      exiting ? 'opacity-0 max-h-0' : 'opacity-100 max-h-40'
    }`}>
      {children}
    </div>
  )
}

export default function NotificationsBell() {
  const supabase = createSupabaseBrowserClient()
  const [open, setOpen] = useState(false)
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [exiting, setExiting] = useState<Set<string>>(new Set())
  const [acting, setActing] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const userIdRef = useRef<string | null>(null)

  // ── initial fetch ────────────────────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    userIdRef.current = user.id

    const { data } = await supabase
      .from('purchase_schedules')
      .select('id, frequency, status, products!product_id ( name, retailers!retailer_id ( name ) )')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)

    setSchedules((data as unknown as ScheduleRow[]) ?? [])
  }, [supabase])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  // ── real-time subscription ───────────────────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('bell-schedules')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'purchase_schedules',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Re-fetch on any change — keeps badge + list in sync
            fetchSchedules()
          }
        )
        .subscribe()
    }

    subscribe()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [supabase, fetchSchedules])

  // ── close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── action handler ───────────────────────────────────────────────────────
  const handleAction = useCallback(async (
    id: string,
    newStatus: 'confirmed' | 'skipped',
  ) => {
    setActing(id)

    const { error } = await supabase
      .from('purchase_schedules')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      // Trigger fade-out, then remove from list
      setExiting(prev => new Set(Array.from(prev).concat(id)))
      setTimeout(() => {
        setSchedules(prev => prev.filter(s => s.id !== id))
        setExiting(prev => { const next = new Set(Array.from(prev)); next.delete(id); return next })
      }, 300)
    }

    setActing(null)
  }, [supabase])

  const count = schedules.length

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label={`Notifications${count > 0 ? ` — ${count} upcoming orders` : ''}`}
      >
        <Bell size={20} className="text-gray-500 dark:text-gray-400" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rx-orange text-white text-[10px] font-bold font-body flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white dark:bg-[#16213E] rounded-xl shadow-xl dark:shadow-black/40 border border-gray-100 dark:border-white/10 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-sm text-rx-navy dark:text-white">
                Upcoming Orders
              </span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rx-orange/10 text-rx-orange text-[10px] font-bold font-body">
                  {count}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          {count === 0 ? (
            <div className="py-10 flex flex-col items-center text-center px-4">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-2">
                <CheckCircle2 size={20} className="text-green-500 dark:text-green-400" />
              </div>
              <p className="text-sm font-semibold text-rx-navy dark:text-white font-body">All caught up!</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-1">
                No upcoming orders to review.
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
              {schedules.map(s => {
                const productName  = s.products?.name ?? 'Unknown product'
                const retailerName = s.products?.retailers?.name ?? null
                const isActing     = acting === s.id

                return (
                  <FadingRow key={s.id} exiting={exiting.has(s.id)}>
                    <div className="px-4 py-3">
                      {/* Product + retailer */}
                      <div className="flex items-start gap-2 mb-2">
                        <CalendarClock size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-rx-navy dark:text-white font-body truncate">
                            {productName}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body mt-0.5">
                            {[retailerName, FREQ_LABEL[s.frequency] ?? s.frequency]
                              .filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(s.id, 'confirmed')}
                          disabled={isActing}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg
                            bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400
                            hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors font-body disabled:opacity-50"
                        >
                          {isActing
                            ? <Loader2 size={11} className="animate-spin" />
                            : <CheckCircle2 size={11} />
                          }
                          Confirm
                        </button>
                        <button
                          onClick={() => handleAction(s.id, 'skipped')}
                          disabled={isActing}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg
                            bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400
                            hover:bg-gray-200 dark:hover:bg-white/20 transition-colors font-body disabled:opacity-50"
                        >
                          {isActing
                            ? <Loader2 size={11} className="animate-spin" />
                            : <SkipForward size={11} />
                          }
                          Skip
                        </button>
                      </div>
                    </div>
                  </FadingRow>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/10">
            <Link
              href="/dashboard/schedules"
              onClick={() => setOpen(false)}
              className="text-xs text-rx-orange hover:text-rx-orange-dark font-semibold font-body transition-colors"
            >
              View all schedules →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
