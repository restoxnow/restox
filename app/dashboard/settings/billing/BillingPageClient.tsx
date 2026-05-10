'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard, CheckCircle, AlertCircle, ArrowRight,
  Loader2, ChevronDown, ExternalLink,
} from 'lucide-react'
import { TIER_CAPS, TIER_LABELS } from '@/lib/tier-caps'
import type { PlanTier } from '@/lib/tier-caps'
import DowngradeWarningModal from '@/components/dashboard/DowngradeWarningModal'

type BillingPeriod = 'monthly' | 'annual'

const TIERS: PlanTier[] = ['free', 'consumer', 'professional', 'business']

const TIER_FEATURES: Record<PlanTier, string[]> = {
  free:         ['3 retailers', '3 schedules', 'Basic automation', 'Price Compare'],
  consumer:     ['5 retailers', '10 schedules', 'Full automation', 'AI Reorder Timing', 'Ad-free'],
  professional: ['10 retailers', '30 schedules', 'Spend Intelligence', 'Order History AI', 'Priority insights'],
  business:     ['Unlimited retailers & schedules', 'Seasonal Forecasting', 'Advanced Analytics', 'Multi-user / Team', 'Priority Support'],
}

const MONTHLY_PRICES: Record<PlanTier, string> = {
  free:         '$0',
  consumer:     '$9.99',
  professional: '$29',
  business:     '$79',
}

const ANNUAL_PRICES: Record<PlanTier, { yearly: string; perMonth: string }> = {
  free:         { yearly: '$0',    perMonth: '$0' },
  consumer:     { yearly: '$99',   perMonth: '$8.25' },
  professional: { yearly: '$290',  perMonth: '$24.17' },
  business:     { yearly: '$790',  perMonth: '$65.83' },
}

interface Props {
  planTier: string
  paymentFailedAt: string | null
  previousPlanTier: string | null
  hasStripeCustomer: boolean
  isAdmin: boolean
  retailerCount: number
  scheduleCount: number
}

function UsageMeter({ label, used, cap }: { label: string; used: number; cap: number }) {
  const pct = cap === Infinity ? 0 : Math.min(100, (used / cap) * 100)
  const isWarning = cap !== Infinity && pct >= 80
  const isFull    = cap !== Infinity && used >= cap

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-body">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`font-semibold ${isFull ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-rx-navy dark:text-white'}`}>
          {used} of {cap === Infinity ? '∞' : cap}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        {cap !== Infinity && (
          <div
            className={`h-full rounded-full transition-all ${
              isFull ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-rx-orange'
            }`}
            style={{ width: `${pct}%` }}
          />
        )}
        {cap === Infinity && (
          <div className="h-full w-full bg-gradient-to-r from-rx-orange/40 to-rx-orange/10 rounded-full" />
        )}
      </div>
    </div>
  )
}

export default function BillingPageClient({
  planTier,
  paymentFailedAt,
  previousPlanTier,
  hasStripeCustomer,
  isAdmin,
  retailerCount,
  scheduleCount,
}: Props) {
  const router = useRouter()
  const tier   = planTier as PlanTier
  const caps   = TIER_CAPS[tier] ?? TIER_CAPS.free

  const [billingPeriod, setBillingPeriod]       = useState<BillingPeriod>('monthly')
  const [checkoutLoading, setCheckoutLoading]   = useState<string | null>(null)
  const [portalLoading, setPortalLoading]       = useState(false)
  const [downgradeTarget, setDowngradeTarget]   = useState<PlanTier | null>(null)
  const [downgradeSuccess, setDowngradeSuccess] = useState(false)
  const [showDowngradeMenu, setShowDowngradeMenu] = useState(false)

  const tierIndex = TIERS.indexOf(tier)
  const isAnnual  = billingPeriod === 'annual'

  const handleUpgrade = async (targetTier: PlanTier) => {
    setCheckoutLoading(targetTier)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier, billingPeriod }),
      })
      const { url, error } = await res.json()
      if (url) window.location.href = url
      else console.error('Checkout error:', error)
    } catch { /* non-fatal */ }
    setCheckoutLoading(null)
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/billing-portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch { /* non-fatal */ }
    setPortalLoading(false)
  }

  const handleDowngradeConfirmed = () => {
    setDowngradeTarget(null)
    setDowngradeSuccess(true)
    router.refresh()
  }

  const downgradeOptions = TIERS.filter((_, i) => i < tierIndex)

  const failedDate = paymentFailedAt
    ? new Date(paymentFailedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  function priceDisplay(t: PlanTier) {
    if (t === 'free') return { main: '$0', sub: 'Free forever' }
    if (isAnnual) {
      const a = ANNUAL_PRICES[t]
      return { main: a.perMonth, sub: `${a.yearly}/yr · billed annually` }
    }
    return { main: MONTHLY_PRICES[t], sub: 'per month · billed monthly' }
  }

  function upgradeCTALabel(t: PlanTier) {
    if (isAnnual) {
      return `Upgrade to ${TIER_LABELS[t]} — ${ANNUAL_PRICES[t].yearly}/yr`
    }
    return `Upgrade to ${TIER_LABELS[t]} — ${MONTHLY_PRICES[t]}/mo`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Billing & Plan</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">
          Manage your subscription and payment method.
        </p>
      </div>

      {/* Payment failure banner */}
      {paymentFailedAt && !isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
          <AlertCircle size={20} className="text-red-500 dark:text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 font-body">
              Your payment failed on {failedDate}.
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 font-body mt-0.5">
              Your {TIER_LABELS[previousPlanTier ?? ''] ?? 'plan'} features are on hold.
              Update your payment method to restore access.
            </p>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading || !hasStripeCustomer}
            className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors font-body disabled:opacity-60 flex items-center gap-2"
          >
            {portalLoading ? <Loader2 size={13} className="animate-spin" /> : null}
            Update Payment Method
          </button>
        </div>
      )}

      {/* Temporary downgrade notice */}
      {paymentFailedAt && previousPlanTier && (
        <div className="px-5 py-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-body">
            You are temporarily on the{' '}
            <span className="font-semibold">Free plan</span>.
            Your <span className="font-semibold">{TIER_LABELS[previousPlanTier]}</span> data is saved and will be restored when payment clears.
          </p>
        </div>
      )}

      {/* Downgrade success notice */}
      {downgradeSuccess && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
          <CheckCircle size={16} className="text-green-500 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300 font-body">
            Your plan has been updated. Excess data has been suspended and your billing will adjust at the next cycle.
          </p>
        </div>
      )}

      {/* Current plan card */}
      <section className="bg-white dark:bg-[#16213E] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-body uppercase tracking-widest">Current plan</p>
            <h2 className="text-xl font-heading font-bold text-rx-navy dark:text-white mt-1">
              {TIER_LABELS[tier] ?? tier}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-body mt-0.5">
              {tier === 'free'
                ? 'Free forever'
                : `${MONTHLY_PRICES[tier]}/mo`
              }
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-rx-orange/10 text-rx-orange text-xs font-bold font-body">
            {TIER_LABELS[tier]}
          </span>
        </div>

        {/* Usage meters */}
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide font-body">Usage</p>
          <UsageMeter label="Retailers" used={retailerCount} cap={caps.retailers} />
          <UsageMeter label="Schedules" used={scheduleCount} cap={caps.schedules} />
        </div>
      </section>

      {/* Plan cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-semibold text-rx-navy dark:text-white">All plans</h2>

          {/* Monthly / Annual toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-xl">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors font-body ${
                !isAnnual
                  ? 'bg-white dark:bg-[#16213E] text-rx-navy dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors font-body ${
                isAnnual
                  ? 'bg-white dark:bg-[#16213E] text-rx-navy dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold leading-none">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {isAnnual && (
          <p className="text-xs text-green-700 dark:text-green-400 font-body font-semibold -mt-1">
            2 months free when you pay annually
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIERS.map((t, i) => {
            const isCurrent   = t === tier
            const isUpgrade   = i > tierIndex
            const isDowngrade = i < tierIndex
            const caps_t      = TIER_CAPS[t]
            const price       = priceDisplay(t)

            return (
              <div
                key={t}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
                  isCurrent
                    ? 'border-rx-orange/50 bg-rx-orange/5 dark:bg-rx-orange/10 shadow-sm'
                    : 'border-gray-100 dark:border-white/10 bg-white dark:bg-[#16213E]'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rx-orange text-white font-body">
                    Current
                  </span>
                )}

                <div>
                  <p className="font-heading font-bold text-rx-navy dark:text-white text-base">
                    {TIER_LABELS[t]}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-heading font-bold text-rx-navy dark:text-white">
                      {price.main}
                    </span>
                    {t !== 'free' && (
                      <span className="text-sm font-body text-gray-400 font-normal">/mo</span>
                    )}
                    {isAnnual && t !== 'free' && (
                      <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-body">
                        2 months free
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">
                    {price.sub}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">
                    {caps_t.retailers === Infinity
                      ? 'Unlimited retailers & schedules'
                      : `${caps_t.retailers} retailers · ${caps_t.schedules} schedules`
                    }
                  </p>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {TIER_FEATURES[t].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-body">
                      <CheckCircle size={11} className="text-rx-orange shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isUpgrade && (
                  <button
                    onClick={() => handleUpgrade(t)}
                    disabled={checkoutLoading === t}
                    className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange/90 text-white font-semibold rounded-xl text-sm transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {checkoutLoading === t
                      ? <><Loader2 size={13} className="animate-spin" /> Processing…</>
                      : <>{upgradeCTALabel(t)} <ArrowRight size={13} /></>
                    }
                  </button>
                )}

                {isCurrent && t !== 'free' && (
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 font-body">
                    Your current plan
                  </p>
                )}

                {isCurrent && t === 'free' && (
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 font-body">
                    Free plan — no credit card required
                  </p>
                )}

                {isDowngrade && !isCurrent && (
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 font-body">Lower tier</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Manage payment */}
      {(hasStripeCustomer || tier !== 'free') && !isAdmin && (
        <section className="bg-white dark:bg-[#16213E] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-3">
          <h2 className="text-sm font-heading font-semibold text-rx-navy dark:text-white">Payment & Invoices</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePortal}
              disabled={portalLoading || !hasStripeCustomer}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rx-navy dark:bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-rx-navy/80 dark:hover:bg-white/20 transition-colors font-body disabled:opacity-50"
            >
              {portalLoading ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={14} />}
              Update payment method
            </button>
            <button
              onClick={handlePortal}
              disabled={portalLoading || !hasStripeCustomer}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body disabled:opacity-50"
            >
              <ExternalLink size={13} />
              View invoices
            </button>
          </div>
          {!hasStripeCustomer && (
            <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
              No billing account set up yet — billing portal is available after your first subscription.
            </p>
          )}
        </section>
      )}

      {/* Downgrade */}
      {tier !== 'free' && !isAdmin && !paymentFailedAt && downgradeOptions.length > 0 && (
        <section className="bg-white dark:bg-[#16213E] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6">
          <h2 className="text-sm font-heading font-semibold text-rx-navy dark:text-white mb-3">Downgrade plan</h2>
          <div className="relative">
            <button
              onClick={() => setShowDowngradeMenu(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body"
            >
              Downgrade to…
              <ChevronDown size={14} className={`transition-transform ${showDowngradeMenu ? 'rotate-180' : ''}`} />
            </button>
            {showDowngradeMenu && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-[#1a2744] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[200px]">
                {downgradeOptions.map(t => (
                  <button
                    key={t}
                    onClick={() => { setShowDowngradeMenu(false); setDowngradeTarget(t) }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-body text-rx-navy dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                  >
                    <span>{TIER_LABELS[t]}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">{MONTHLY_PRICES[t]}/mo</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-3">
            Excess data will be suspended (not deleted) and restored if you upgrade again.
          </p>
        </section>
      )}

      {/* Downgrade modal */}
      {downgradeTarget && (
        <DowngradeWarningModal
          targetTier={downgradeTarget}
          onClose={() => setDowngradeTarget(null)}
          onConfirmed={handleDowngradeConfirmed}
        />
      )}
    </div>
  )
}
