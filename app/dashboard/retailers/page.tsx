'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  Search, ChevronDown, ChevronRight, CheckCircle, X,
  Loader2, AlertTriangle, Link2, Calendar, CheckCircle2, AlertCircle,
  CreditCard, Shield, PauseCircle, Store, Puzzle,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useExtensionDetected } from '@/hooks/useExtensionDetected'
import RetailerConnectModal from '@/components/dashboard/RetailerConnectModal'
import RequestRetailerModal from '@/components/dashboard/RequestRetailerModal'
import UpgradePromptModal from '@/components/dashboard/UpgradePromptModal'
import AdSlot from '@/components/dashboard/AdSlot'
import { useUser, useUserTier } from '@/contexts/UserContext'
import { TIER_CAPS, TIER_LABELS } from '@/lib/tier-caps'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Retailer {
  id: number
  name: string
  domain: string
  unsupported?: boolean
  subBrands?: string[]
}

interface Category {
  id: string
  label: string
  retailers: Retailer[]
}

interface ConnectedRetailer {
  id: string
  name: string
  connection_type: string
  connection_status: string
  created_at: string
  is_suspended: boolean
}

interface StoredPaymentMethod {
  id: string
  payment_method_id: string
  last4: string | null
  brand: string | null
  expiry_month: number | null
  expiry_year: number | null
  is_default: boolean
  selected_for_auto_order: boolean
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const CATEGORIES: Category[] = [
  {
    id: 'general',
    label: 'General Merchandise',
    retailers: [
      { id: 1,  name: 'Amazon',  domain: 'amazon.com' },
      { id: 2,  name: 'Walmart', domain: 'walmart.com' },
      { id: 3,  name: 'Target',  domain: 'target.com' },
    ],
  },
  {
    id: 'home',
    label: 'Home Improvement',
    retailers: [
      { id: 4,  name: 'Home Depot', domain: 'homedepot.com' },
      { id: 5,  name: "Lowe's",     domain: 'lowes.com', unsupported: true },
    ],
  },
  {
    id: 'grocery',
    label: 'Grocery & Wholesale',
    retailers: [
      { id: 6,  name: 'Kroger',        domain: 'kroger.com', subBrands: ["Smith's", "Fry's"] },
      { id: 7,  name: 'Costco',        domain: 'costco.com',    unsupported: true },
      { id: 8,  name: "Sam's Club",    domain: 'samsclub.com',  unsupported: true },
      { id: 12, name: 'Instacart',     domain: 'instacart.com' },
      { id: 13, name: 'Albertsons',    domain: 'albertsons.com' },
      { id: 14, name: 'Stop & Shop',   domain: 'stopandshop.com' },
      { id: 15, name: 'Wegmans',       domain: 'wegmans.com' },
    ],
  },
  {
    id: 'beauty',
    label: 'Beauty & Personal Care',
    retailers: [
      { id: 9,  name: 'Sephora', domain: 'sephora.com' },
    ],
  },
  {
    id: 'pet',
    label: 'Pet Supplies',
    retailers: [
      { id: 10, name: 'Chewy', domain: 'chewy.com' },
    ],
  },
  {
    id: 'office',
    label: 'Office & Business Supplies',
    retailers: [
      { id: 11, name: 'Staples',              domain: 'staples.com',  unsupported: true },
      { id: 16, name: 'Office Depot/OfficeMax', domain: 'officedepot.com' },
      { id: 17, name: 'Uline',               domain: 'uline.com', unsupported: true },
      { id: 18, name: 'Grainger',            domain: 'grainger.com', unsupported: true },
    ],
  },
]

const ALL_RETAILERS = CATEGORIES.flatMap(c => c.retailers)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FALLBACK_COLORS = [
  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
]

function fallbackColor(name: string) {
  return FALLBACK_COLORS[name.charCodeAt(0) % FALLBACK_COLORS.length]
}

function RetailerLogo({ retailer }: { retailer: Retailer }) {
  const [failed, setFailed] = useState(false)
  const color = FALLBACK_COLORS[(retailer.id - 1) % FALLBACK_COLORS.length]
  if (failed) {
    return (
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-heading ${color}`}>
        {retailer.name[0]}
      </div>
    )
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 flex items-center justify-center p-1.5 overflow-hidden">
      <Image
        src={`https://logo.clearbit.com/${retailer.domain}`}
        alt={retailer.name}
        width={48}
        height={48}
        className="object-contain w-full h-full"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  )
}

function ConnectedRetailerLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  const known = ALL_RETAILERS.find(r => r.name.toLowerCase() === name.toLowerCase())
  if (!known || failed) {
    return (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold font-heading ${fallbackColor(name)}`}>
        {name[0].toUpperCase()}
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
      <Image
        src={`https://logo.clearbit.com/${known.domain}`}
        alt={name}
        width={40}
        height={40}
        className="object-contain w-full h-full"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  )
}

const CONN_TYPE_BADGE: Record<string, string> = {
  oauth:     'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  extension: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
}
const CONN_TYPE_LABEL: Record<string, string> = {
  oauth: 'OAuth', extension: 'Extension',
}

// ---------------------------------------------------------------------------
// ConnectedRetailerCard — with payment method selector
// ---------------------------------------------------------------------------
const CARD_BRANDS = ['Visa', 'Mastercard', 'American Express', 'Discover', 'Other'] as const

function ConnectedRetailerCard({
  retailer,
  onDisconnect,
}: {
  retailer: ConnectedRetailer
  onDisconnect: (r: ConnectedRetailer) => Promise<void>
}) {
  const supabase = createSupabaseBrowserClient()
  const [showConfirm, setShowConfirm]       = useState(false)
  const [disconnecting, setDisconnecting]   = useState(false)
  const [showPayment, setShowPayment]       = useState(false)
  const [methods, setMethods]               = useState<StoredPaymentMethod[]>([])
  const [loadingMethods, setLoadingMethods] = useState(false)
  const [selectedId, setSelectedId]         = useState<string | null>(null)
  const [saving, setSaving]                 = useState(false)
  const [saveMsg, setSaveMsg]               = useState<string | null>(null)
  // Self-entry form state
  const [editingPayment, setEditingPayment] = useState(false)
  const [entryBrand, setEntryBrand]         = useState('')
  const [entryLast4, setEntryLast4]         = useState('')
  const [entryError, setEntryError]         = useState<string | null>(null)
  const [submitting, setSubmitting]         = useState(false)
  const [removing, setRemoving]             = useState<string | null>(null)

  const badgeCls   = CONN_TYPE_BADGE[retailer.connection_type]   ?? CONN_TYPE_BADGE.credentials
  const badgeLabel = CONN_TYPE_LABEL[retailer.connection_type]   ?? retailer.connection_type

  const selectedMethod = methods.find(m => m.payment_method_id === selectedId) ?? null

  const reloadMethods = async () => {
    const { data } = await supabase
      .from('retailer_payment_methods')
      .select('id, payment_method_id, last4, brand, expiry_month, expiry_year, is_default, selected_for_auto_order')
      .eq('retailer_name', retailer.name)
      .order('is_default', { ascending: false })
    const rows = (data as StoredPaymentMethod[]) ?? []
    setMethods(rows)
    const sel = rows.find(m => m.selected_for_auto_order)
    if (sel) setSelectedId(sel.payment_method_id)
    return rows
  }

  // Load payment methods on first expand
  const openPayment = async () => {
    setShowPayment(v => !v)
    if (methods.length > 0 || loadingMethods) return
    setLoadingMethods(true)
    await reloadMethods()
    setLoadingMethods(false)
  }

  // Save radio selection (multi-card)
  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    const res = await fetch('/api/retailers/payment-methods/select', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retailer_name: retailer.name, payment_method_id: selectedId }),
    })
    setSaving(false)
    setSaveMsg(res.ok ? 'Saved!' : 'Failed to save — try again')
    if (res.ok) {
      setMethods(prev => prev.map(m => ({
        ...m,
        selected_for_auto_order: m.payment_method_id === selectedId,
      })))
      setTimeout(() => setSaveMsg(null), 2000)
    }
  }

  // Save self-entered card
  const handleSelfEntrySave = async () => {
    if (!entryBrand) { setEntryError('Please select a card brand'); return }
    if (!/^\d{4}$/.test(entryLast4)) { setEntryError('Please enter exactly 4 digits'); return }
    setEntryError(null)
    setSubmitting(true)
    const res = await fetch('/api/retailers/payment-methods/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        retailer_name: retailer.name,
        last4: entryLast4,
        brand: entryBrand,
        is_default: true,
      }),
    })
    setSubmitting(false)
    if (!res.ok) { setEntryError('Failed to save. Please try again.'); return }
    await reloadMethods()
    setEditingPayment(false)
    setEntryBrand('')
    setEntryLast4('')
  }

  // Remove a payment method
  const handleRemove = async (method: StoredPaymentMethod) => {
    setRemoving(method.id)
    const res = await fetch(`/api/retailers/payment-methods/${method.id}`, { method: 'DELETE' })
    setRemoving(null)
    if (res.ok) {
      const updated = methods.filter(m => m.id !== method.id)
      setMethods(updated)
      if (selectedId === method.payment_method_id) setSelectedId(null)
    }
  }

  const handleConfirm = async () => {
    setDisconnecting(true)
    await onDisconnect(retailer)
    setDisconnecting(false)
    setShowConfirm(false)
  }

  const paymentSummary = selectedMethod
    ? `${selectedMethod.brand ?? 'Card'} ••••${selectedMethod.last4}`
    : methods.length > 0
      ? 'No method selected'
      : 'Not configured'

  return (
    <div className={`relative bg-white dark:bg-[#16213E] rounded-xl border shadow-sm dark:shadow-none overflow-hidden ${
      retailer.is_suspended
        ? 'border-amber-200 dark:border-amber-700/40 opacity-75'
        : 'border-gray-100 dark:border-white/10'
    }`}>
      {/* Suspended banner */}
      {retailer.is_suspended && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/30">
          <PauseCircle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 font-body flex-1">
            Suspended — automated orders paused
          </p>
          <a
            href="/dashboard/settings/billing"
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline font-body"
          >
            Restore by upgrading →
          </a>
        </div>
      )}
      {/* Main row */}
      <div className="p-4 flex items-center gap-3">
        <ConnectedRetailerLogo name={retailer.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-body truncate">
              {retailer.name}
            </p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-body ${badgeCls}`}>
              <Link2 size={9} />
              {badgeLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-body font-semibold">
              <CheckCircle size={11} />
              Connected
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-body">
              <Calendar size={10} />
              {new Date(retailer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowConfirm(v => !v)}
          className="shrink-0 px-3 py-1.5 text-xs font-semibold font-body rounded-lg border border-gray-200 dark:border-white/10
            text-gray-500 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700/40
            hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Payment method summary bar */}
      <button
        onClick={openPayment}
        className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 dark:border-white/10
          bg-gray-50 dark:bg-white/3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
      >
        <CreditCard size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
        <span className="text-xs font-body text-gray-500 dark:text-gray-400 flex-1">
          Auto-order payment:{' '}
          <span className={`font-semibold ${selectedMethod ? 'text-rx-navy dark:text-white' : 'text-amber-600 dark:text-amber-400'}`}>
            {paymentSummary}
          </span>
        </span>
        <ChevronDown size={12} className={`text-gray-400 dark:text-gray-500 transition-transform ${showPayment ? 'rotate-180' : ''}`} />
      </button>

      {/* Expandable payment section */}
      {showPayment && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-white/10 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-body uppercase tracking-wide">
            Auto-order payment
          </p>

          {loadingMethods && (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={14} className="animate-spin text-gray-400" />
              <span className="text-xs text-gray-400 font-body">Loading payment methods…</span>
            </div>
          )}

          {/* ── Self-entry form ── shown when no methods saved, or user is editing */}
          {!loadingMethods && (methods.length === 0 || editingPayment) && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-rx-navy dark:text-white font-body">
                  Which card is saved on {retailer.name}?
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-body mt-1 leading-relaxed">
                  We&apos;ll use this to confirm your orders. Make sure it matches the card saved
                  in your {retailer.name} account.
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  value={entryBrand}
                  onChange={e => setEntryBrand(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-body rounded-lg border border-gray-200 dark:border-white/10
                    bg-white dark:bg-[#1a2744] text-rx-navy dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
                >
                  <option value="">Card brand</option>
                  {CARD_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={entryLast4}
                  onChange={e => setEntryLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  className="w-24 px-3 py-2 text-xs font-body rounded-lg border border-gray-200 dark:border-white/10
                    bg-white dark:bg-[#1a2744] text-rx-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500
                    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
                />
              </div>

              {entryError && (
                <p className="text-xs text-red-500 font-body">{entryError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelfEntrySave}
                  disabled={submitting}
                  className="px-4 py-1.5 bg-rx-orange hover:bg-rx-orange-dark text-white text-xs font-semibold rounded-lg transition-colors font-body disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={11} className="animate-spin" /> : null}
                  {submitting ? 'Saving…' : 'Save payment info'}
                </button>
                {editingPayment && methods.length > 0 && (
                  <button
                    onClick={() => { setEditingPayment(false); setEntryError(null) }}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-body transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex items-start gap-1.5 pt-1">
                <Shield size={11} className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-body leading-relaxed">
                  Restox never stores your full card number. This is for identification only.
                </p>
              </div>
            </div>
          )}

          {/* ── Saved state ── shown when methods exist and not editing */}
          {!loadingMethods && methods.length > 0 && !editingPayment && (
            <div className="space-y-2">
              {methods.length === 1 ? (
                // Single card: compact display with Edit + Remove
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3">
                  <CreditCard size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <p className="text-xs font-semibold text-rx-navy dark:text-white font-body flex-1">
                    {methods[0].brand ?? 'Card'} ••••{methods[0].last4}
                  </p>
                  <button
                    onClick={() => {
                      setEntryBrand(methods[0].brand ?? '')
                      setEntryLast4(methods[0].last4 ?? '')
                      setEditingPayment(true)
                    }}
                    className="text-xs text-rx-orange hover:text-rx-orange-dark font-semibold font-body transition-colors"
                  >
                    Edit
                  </button>
                  <span className="text-gray-200 dark:text-white/10">|</span>
                  <button
                    onClick={() => handleRemove(methods[0])}
                    disabled={removing === methods[0].id}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-body transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    {removing === methods[0].id ? <Loader2 size={10} className="animate-spin" /> : null}
                    Remove
                  </button>
                </div>
              ) : (
                // Multiple cards: radio selection + remove per card
                <>
                  {methods.map(m => (
                    <label
                      key={m.payment_method_id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedId === m.payment_method_id
                          ? 'border-rx-orange/40 bg-rx-orange-light dark:bg-rx-orange/10'
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`payment-${retailer.id}`}
                        value={m.payment_method_id}
                        checked={selectedId === m.payment_method_id}
                        onChange={() => setSelectedId(m.payment_method_id)}
                        className="accent-rx-orange"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-rx-navy dark:text-white font-body">
                          {m.brand ?? 'Card'} ••••{m.last4}
                          {m.is_default && (
                            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">
                              Default
                            </span>
                          )}
                        </p>
                        {m.expiry_month && m.expiry_year && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body mt-0.5">
                            expires {String(m.expiry_month).padStart(2, '0')}/{m.expiry_year}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={e => { e.preventDefault(); handleRemove(m) }}
                        disabled={removing === m.id}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-body transition-colors disabled:opacity-60 flex items-center gap-1"
                      >
                        {removing === m.id ? <Loader2 size={10} className="animate-spin" /> : null}
                        Remove
                      </button>
                    </label>
                  ))}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-1.5 bg-rx-orange hover:bg-rx-orange-dark text-white text-xs font-semibold rounded-lg transition-colors font-body disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {saving ? <Loader2 size={11} className="animate-spin" /> : null}
                      {saving ? 'Saving…' : 'Save selection'}
                    </button>
                    {saveMsg && (
                      <span className={`text-xs font-body font-semibold ${saveMsg === 'Saved!' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {saveMsg}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Security disclaimers */}
              <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-start gap-1.5">
                  <Shield size={11} className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-body leading-relaxed">
                    Restox never stores your full card number. Payment is processed directly by {retailer.name}.
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <Shield size={11} className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-body leading-relaxed">
                    You will always receive a confirmation notification before any order is placed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disconnect confirmation popover */}
      {showConfirm && (
        <div className="absolute right-4 top-14 z-20 w-72 bg-white dark:bg-[#1a2744] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-heading">
              Disconnect {retailer.name}?
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body mb-3">
            This will pause all schedules using this retailer.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={disconnecting}
              className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-1"
            >
              {disconnecting ? <Loader2 size={11} className="animate-spin" /> : null}
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-1.5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function RetailersPage() {
  const supabase = createSupabaseBrowserClient()
  const connectedSectionRef = useRef<HTMLDivElement>(null)
  const { planTier, bypassGates, caps } = useUserTier()

  const [dbRetailers, setDbRetailers]         = useState<ConnectedRetailer[]>([])
  const [loadingRetailers, setLoadingRetailers] = useState(true)
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null)
  const [showUnsupportedFor, setShowUnsupportedFor] = useState<Retailer | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestModalInitialName, setRequestModalInitialName] = useState('')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [searchQuery, setSearchQuery]           = useState('')
  const [collapsed, setCollapsed]               = useState<Record<string, boolean>>(
    () => Object.fromEntries(CATEGORIES.map(c => [c.id, true]))
  )
  const [oauthBanner, setOAuthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [extBannerDismissed, setExtBannerDismissed] = useState(false)
  const extensionDetected = useExtensionDetected()

  // ── Fetch connected retailers from DB ────────────────────────────────────
  const fetchRetailers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingRetailers(false); return }
    const { data } = await supabase
      .from('retailers')
      .select('id, name, connection_type, connection_status, created_at, is_suspended')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDbRetailers((data as ConnectedRetailer[]) ?? [])
    setLoadingRetailers(false)
  }, [supabase])

  useEffect(() => { fetchRetailers() }, [fetchRetailers])

  // ── Handle OAuth callback return ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const oauthResult   = params.get('oauth')
    const oauthRetailer = params.get('retailer')
    const oauthMessage  = params.get('message')

    if (oauthResult === 'success') {
      setOAuthBanner({
        type:    'success',
        message: `${oauthRetailer ?? 'Retailer'} connected successfully via OAuth!`,
      })
      fetchRetailers()
      // Non-blocking: sync payment methods for the newly connected retailer
      if (oauthRetailer) {
        fetch('/api/retailers/payment-methods/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ retailer_name: oauthRetailer }),
        }).catch(() => {})
      }
    } else if (oauthResult === 'error') {
      setOAuthBanner({
        type:    'error',
        message: oauthMessage ?? 'OAuth connection failed. Please try again.',
      })
    }

    if (oauthResult) {
      // Clean query params from URL without reloading
      window.history.replaceState({}, '', '/dashboard/retailers')
    }
  }, [fetchRetailers])

  // ── Disconnect handler ───────────────────────────────────────────────────
  const handleDisconnect = useCallback(async (retailer: ConnectedRetailer) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('purchase_schedules')
      .update({ status: 'paused' })
      .eq('user_id', user.id)
      .eq('retailer', retailer.name)
    await supabase.from('retailers').delete().eq('id', retailer.id)
    setDbRetailers(prev => prev.filter(r => r.id !== retailer.id))
  }, [supabase])

  // ── After connecting via modal, refresh DB list ──────────────────────────
  const handleConnected = useCallback((_name: string) => {
    fetchRetailers()
  }, [fetchRetailers])

  const isConnectedByName = (name: string) =>
    dbRetailers.some(r => r.name.toLowerCase() === name.toLowerCase())

  const query = searchQuery.toLowerCase().trim()

  const filteredCategories = CATEGORIES
    .map(cat => ({
      ...cat,
      retailers: cat.retailers.filter(r =>
        !query || r.name.toLowerCase().includes(query)
      ),
    }))
    .filter(cat => cat.retailers.length > 0)

  const hasNoResults = !!query && filteredCategories.length === 0

  const toggleCategory = (id: string) =>
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))

  const isCategoryCollapsed = (id: string) => !query && !!collapsed[id]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Retailers</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">
          {loadingRetailers
            ? 'Loading…'
            : dbRetailers.length > 0
              ? `${dbRetailers.length} retailer${dbRetailers.length === 1 ? '' : 's'} connected`
              : 'Connect your stores to start automating purchases'}
        </p>
      </div>

      {/* OAuth result banner */}
      {oauthBanner && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-body
          ${oauthBanner.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300'
          }`}>
          {oauthBanner.type === 'success'
            ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            : <AlertCircle  size={16} className="shrink-0 mt-0.5" />
          }
          <span className="flex-1">{oauthBanner.message}</span>
          <button
            onClick={() => setOAuthBanner(null)}
            className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Extension banner ────────────────────────────────────────────── */}
      {extensionDetected === true && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
          <CheckCircle size={14} className="text-green-500 dark:text-green-400 shrink-0" />
          <p className="text-xs font-semibold text-green-700 dark:text-green-300 font-body">Extension installed</p>
        </div>
      )}
      {extensionDetected === false && !extBannerDismissed && (
        <div className="flex items-start gap-4 px-5 py-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30">
          <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0 mt-0.5">
            <Puzzle size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold text-rx-navy dark:text-white">
              Get Restox on any retailer
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-0.5">
              The browser extension lets you add products from any supported retailer with one click.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <a
                href="https://chrome.google.com/webstore/detail/restox"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-rx-orange hover:bg-rx-orange-dark text-white text-xs font-semibold rounded-xl transition-colors font-body"
              >
                Install Chrome Extension
              </a>
              <button
                onClick={() => setExtBannerDismissed(true)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-body transition-colors"
              >
                Already installed? Refresh the page
              </button>
            </div>
          </div>
          <button
            onClick={() => setExtBannerDismissed(true)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Connected Retailers section ─────────────────────────────────── */}
      <div ref={connectedSectionRef}>
        <h2 className="font-heading font-semibold text-sm text-rx-navy dark:text-white mb-3">
          Your Connected Retailers
        </h2>

        {loadingRetailers ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 font-body py-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : dbRetailers.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body py-2">
            No retailers connected yet — connect one below.
          </p>
        ) : (
          <div className="space-y-3">
            {dbRetailers.map(r => (
              <ConnectedRetailerCard
                key={r.id}
                retailer={r}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search retailers..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-[#16213E] border border-gray-200 dark:border-white/10
            rounded-xl text-sm font-body text-rx-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
            shadow-sm dark:shadow-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Request a Retailer banner */}
      {!hasNoResults && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-orange-50 dark:bg-rx-orange/10 border border-orange-200 dark:border-rx-orange/20">
          <div>
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-heading leading-tight">
              Don&apos;t see your retailer?
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 font-body mt-0.5">
              We add new retailers every week based on requests.
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="shrink-0 px-4 py-2 bg-rx-orange hover:bg-rx-orange-dark text-white text-sm font-semibold rounded-xl transition-colors font-body whitespace-nowrap"
          >
            Request a Retailer
          </button>
        </div>
      )}

      {/* No-results state */}
      {hasNoResults && (
        <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none py-14 flex flex-col items-center text-center">
          <p className="text-sm font-medium text-rx-navy dark:text-white font-body mb-1">No retailers found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
            Want us to add one?{' '}
            <button
              onClick={() => setShowRequestModal(true)}
              className="text-rx-orange hover:text-rx-orange-dark font-semibold underline transition-colors"
            >
              Request a retailer
            </button>
          </p>
        </div>
      )}

      {/* ── Category sections ───────────────────────────────────────────── */}
      {filteredCategories.map((cat, catIdx) => {
        const collapsed_ = isCategoryCollapsed(cat.id)
        return (
          <div key={cat.id}>
            {catIdx === 1 && (
              <AdSlot slot="retailers-rectangle" format="rectangle" className="mb-6" />
            )}
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <span className="font-heading font-bold text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 group-hover:text-rx-navy dark:group-hover:text-white transition-colors">
                {cat.label}
              </span>
              {collapsed_
                ? <ChevronRight size={15} className="text-gray-400 dark:text-gray-500 group-hover:text-rx-navy dark:group-hover:text-white transition-colors" />
                : <ChevronDown  size={15} className="text-gray-400 dark:text-gray-500 group-hover:text-rx-navy dark:group-hover:text-white transition-colors" />
              }
            </button>

            {!collapsed_ && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cat.retailers.map(r => {
                    const alreadyConnected = isConnectedByName(r.name)
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          if (alreadyConnected) {
                            connectedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          } else if (r.unsupported) {
                            setShowUnsupportedFor(r)
                          } else if (!bypassGates && dbRetailers.length >= caps.retailers) {
                            setShowUpgradePrompt(true)
                          } else {
                            setSelectedRetailer(r)
                          }
                        }}
                        className={`relative bg-white dark:bg-[#16213E] rounded-xl border shadow-sm dark:shadow-none
                          transition-all p-4 flex flex-col items-center gap-2 text-center group
                          ${alreadyConnected
                            ? 'border-green-200 dark:border-green-800/40 hover:border-green-300 dark:hover:border-green-700/50'
                            : 'border-gray-100 dark:border-white/10 hover:border-rx-orange/40 dark:hover:border-rx-orange/30 hover:shadow-md dark:hover:shadow-black/20'
                          }`}
                      >
                        {alreadyConnected && (
                          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold
                            text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                            <CheckCircle size={8} className="shrink-0" /> Connected
                          </span>
                        )}
                        <RetailerLogo retailer={r} />
                        <span className="text-sm font-medium text-rx-navy dark:text-white font-body leading-tight">
                          {r.name}
                        </span>
                        {r.subBrands && (
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-body leading-tight -mt-1">
                            incl. {r.subBrands.join(', ')}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold font-body transition-opacity
                          ${alreadyConnected
                            ? 'text-green-500 dark:text-green-400 opacity-100'
                            : 'text-rx-orange opacity-0 group-hover:opacity-100'
                          }`}>
                          {alreadyConnected ? 'Manage ↑' : 'Connect →'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-300 dark:text-gray-600 font-body pl-0.5">
                  + More coming soon
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Modals */}
      {selectedRetailer && (
        <RetailerConnectModal
          retailer={selectedRetailer}
          defaultTab="oauth"
          onClose={() => setSelectedRetailer(null)}
          onConnected={handleConnected}
        />
      )}

      {showUnsupportedFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16213E] rounded-2xl w-full max-w-md shadow-2xl dark:shadow-black/60">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm font-bold font-heading text-gray-500 dark:text-gray-400">
                  {showUnsupportedFor.name[0]}
                </div>
                <span className="font-heading font-semibold text-rx-navy dark:text-white">
                  Connect {showUnsupportedFor.name}
                </span>
              </div>
              <button
                onClick={() => setShowUnsupportedFor(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <AlertCircle size={22} className="text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-heading font-semibold text-rx-navy dark:text-white mb-2">
                  Not yet fully supported
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-body leading-relaxed">
                  This retailer is not yet fully supported. We&apos;re working on a direct connection.
                  You&apos;ll be notified when it&apos;s available.
                </p>
              </div>
              <button
                onClick={() => {
                  setRequestModalInitialName(showUnsupportedFor.name)
                  setShowUnsupportedFor(null)
                  setShowRequestModal(true)
                }}
                className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
                  rounded-xl text-sm transition-colors font-body flex items-center justify-center gap-2"
              >
                <Store size={15} /> Request this retailer
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <RequestRetailerModal
          initialRetailerName={requestModalInitialName}
          onClose={() => { setShowRequestModal(false); setRequestModalInitialName('') }}
        />
      )}
      {showUpgradePrompt && (
        <UpgradePromptModal
          featureName="More Retailers"
          requiredTier={planTier === 'free' ? 'consumer' : planTier === 'consumer' ? 'professional' : 'business'}
          currentTier={planTier}
          description={`Your ${TIER_LABELS[planTier] ?? planTier} plan supports up to ${caps.retailers} retailers. Upgrade to connect more.`}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </div>
  )
}
