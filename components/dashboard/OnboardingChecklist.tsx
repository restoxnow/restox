'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle, Circle, Store, Puzzle, Package, X, Loader2, PartyPopper } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useExtensionDetected } from '@/hooks/useExtensionDetected'

const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/restox'

interface Props {
  onDismiss: () => void
}

export default function OnboardingChecklist({ onDismiss }: Props) {
  const extensionDetected = useExtensionDetected()
  const [hasRetailer, setHasRetailer] = useState(false)
  const [hasProduct, setHasProduct]   = useState(false)
  const [loading, setLoading]         = useState(true)
  const [dismissing, setDismissing]   = useState(false)
  const [allDoneVisible, setAllDoneVisible] = useState(false)
  const autoDismissedRef = useRef(false)

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [rRes, pRes] = await Promise.all([
        supabase
          .from('retailers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('connection_status', 'connected'),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])
      setHasRetailer((rRes.count ?? 0) > 0)
      setHasProduct((pRes.count ?? 0) > 0)
      setLoading(false)
    }
    load()
  }, [])

  const extReady = extensionDetected === true
  const allDone  = !loading && extReady && hasRetailer && hasProduct

  // Auto-dismiss when all steps complete
  useEffect(() => {
    if (!allDone || autoDismissedRef.current) return
    autoDismissedRef.current = true

    // 2s: let user see the green checkmarks
    const t1 = setTimeout(() => setAllDoneVisible(true), 2000)
    // 2s + 3s: dismiss
    const t2 = setTimeout(async () => {
      try { await fetch('/api/user/dismiss-onboarding', { method: 'POST' }) } catch {}
      onDismiss()
    }, 5000)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [allDone, onDismiss])

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      await fetch('/api/user/dismiss-onboarding', { method: 'POST' })
    } catch {}
    onDismiss()
  }

  const completedCount = [extReady, hasRetailer, hasProduct].filter(Boolean).length

  const STEPS = [
    {
      label: 'Install the Restox extension',
      description: 'Add products from any supported retailer with one click.',
      done: extReady,
      href: CHROME_STORE_URL,
      cta: 'Install Chrome Extension →',
      external: true,
      Icon: Puzzle,
      activeColor: 'bg-purple-50 dark:bg-purple-900/20',
      activeIcon: 'text-purple-500 dark:text-purple-400',
    },
    {
      label: 'Connect a retailer',
      description: 'Link your first store to start automating orders.',
      done: hasRetailer,
      href: '/dashboard/retailers',
      cta: 'Connect a retailer →',
      external: false,
      Icon: Store,
      activeColor: 'bg-rx-orange-light dark:bg-rx-orange/10',
      activeIcon: 'text-rx-orange',
    },
    {
      label: 'Add your first product',
      description: 'Browse a retailer, then click "Add to Restox" to track it.',
      done: hasProduct,
      href: '/dashboard/products',
      cta: 'Go to Products →',
      external: false,
      Icon: Package,
      activeColor: 'bg-blue-50 dark:bg-blue-900/20',
      activeIcon: 'text-blue-500 dark:text-blue-400',
    },
  ]

  if (allDoneVisible) {
    return (
      <div className="bg-white dark:bg-[#16213E] rounded-xl border border-green-200 dark:border-green-800/40 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex flex-col items-center text-center px-6 py-8 gap-3">
          <PartyPopper size={28} className="text-rx-orange" />
          <p className="text-base font-heading font-semibold text-rx-navy dark:text-white">
            You&apos;re all set! Restox is ready to go.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
            Dismissing in a moment…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#16213E] rounded-xl border border-rx-orange/30 dark:border-rx-orange/20 shadow-sm dark:shadow-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 bg-rx-orange-light dark:bg-rx-orange/10">
        <div>
          <p className="text-sm font-heading font-semibold text-rx-navy dark:text-white">
            Get started with Restox
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-0.5">
            {loading
              ? 'Loading…'
              : `${completedCount} of 3 steps complete`}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {dismissing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
        </button>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-50 dark:divide-white/5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        ) : (
          STEPS.map((step) => (
            <div
              key={step.label}
              className={`flex items-start gap-4 px-5 py-4 transition-opacity ${step.done ? 'opacity-60' : ''}`}
            >
              {/* Step icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5
                ${step.done ? 'bg-green-50 dark:bg-green-900/20' : step.activeColor}`}
              >
                <step.Icon
                  size={16}
                  className={step.done ? 'text-green-500 dark:text-green-400' : step.activeIcon}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-rx-navy dark:text-white font-body">
                    {step.label}
                  </p>
                  {step.done && (
                    <CheckCircle size={13} className="text-green-500 dark:text-green-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">
                  {step.description}
                </p>
                {!step.done && (
                  <div className="mt-2">
                    {step.external ? (
                      <a
                        href={step.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-rx-orange hover:text-rx-orange-dark transition-colors font-body"
                      >
                        {step.cta}
                      </a>
                    ) : (
                      <Link
                        href={step.href}
                        className="text-xs font-semibold text-rx-orange hover:text-rx-orange-dark transition-colors font-body"
                      >
                        {step.cta}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Check circle */}
              <div className="shrink-0 mt-1">
                {step.done
                  ? <CheckCircle size={18} className="text-green-500 dark:text-green-400" />
                  : <Circle     size={18} className="text-gray-300 dark:text-white/20" />
                }
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer dismiss */}
      {!loading && (
        <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5 flex justify-end">
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-body transition-colors"
          >
            Got it, I&apos;ll explore on my own
          </button>
        </div>
      )}
    </div>
  )
}
