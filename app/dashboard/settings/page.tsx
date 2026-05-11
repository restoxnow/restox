'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { User, Bell, AlertTriangle, CreditCard, Store, Shield, Palette, Sun, Moon, Monitor, PartyPopper, CheckCircle, Loader2, Users, Lock, Headphones } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useUserTier } from '@/contexts/UserContext'

const SECTIONS = [
  { id: 'profile',       label: 'Account & Profile',     icon: User },
  { id: 'appearance',   label: 'Appearance',             icon: Palette },
  { id: 'notifications', label: 'Notifications',         icon: Bell },
  { id: 'billing',       label: 'Billing & Plan',        icon: CreditCard },
  { id: 'retailers',     label: 'Retailer Memberships',  icon: Store },
  { id: 'security',      label: 'Security',              icon: Shield },
] as const

type SectionId = typeof SECTIONS[number]['id']

const MONTHLY_PRICES: Record<string, string> = {
  free: '$0', consumer: '$9.99', professional: '$29', business: '$79',
}
const ANNUAL_PRICES: Record<string, { yearly: string; perMonth: string }> = {
  free:         { yearly: '$0',   perMonth: '$0' },
  consumer:     { yearly: '$99',  perMonth: '$8.25' },
  professional: { yearly: '$290', perMonth: '$24.17' },
  business:     { yearly: '$790', perMonth: '$65.83' },
}
const TIER_ORDER = ['free', 'consumer', 'professional', 'business']
const RETAILER_CAPS: Record<string, number> = { free: 3, consumer: 5, professional: 10, business: Infinity }
const SCHEDULE_CAPS: Record<string, number> = { free: 3, consumer: 10, professional: 30, business: Infinity }

const PLANS = [
  { id: 'free',         label: 'Free',         tagline: 'Basic restocking automation',    schedules: '3 schedules · 3 retailers',       features: ['Basic automation', 'Price Compare', 'Ad-supported'] },
  { id: 'consumer',     label: 'Consumer',     tagline: 'Smart home restocking, ad-free', schedules: '10 schedules · 5 retailers',      features: ['Price Compare', 'AI Reorder Timing', 'Full automation', 'Ad-free'] },
  { id: 'professional', label: 'Professional', tagline: 'Advanced tools for power users', schedules: '30 schedules · 10 retailers',     features: ['Spend Intelligence', 'Order History AI', 'Ad-free'] },
  { id: 'business',     label: 'Business',     tagline: 'Unlimited scale for your team',  schedules: 'Unlimited schedules & retailers', features: ['Seasonal Forecasting', 'Advanced Analytics', 'Multi-user / Team', 'Priority Support'] },
]

const THEME_OPTIONS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
  ['DC','Washington D.C.'],
]

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-rx-navy dark:bg-white text-white dark:text-rx-navy px-4 py-3 rounded-xl shadow-xl text-sm font-body font-medium animate-in slide-in-from-bottom-4">
      <CheckCircle size={16} className="text-green-400 dark:text-green-600 shrink-0" />
      {message}
    </div>
  )
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as SectionId | null
  const showWelcome = searchParams.get('welcome') === 'true'

  const [section, setSection] = useState<SectionId>(
    tabParam && SECTIONS.some(s => s.id === tabParam) ? tabParam : 'profile'
  )
  const { theme, setTheme } = useTheme()
  const supabase = createSupabaseBrowserClient()
  const { isBusinessOnly, bypassGates } = useUserTier()

  // Nudge email preference
  const [nudgeEmailUnsubscribed, setNudgeEmailUnsubscribed] = useState(false)

  // Billing state
  const [currentPlan, setCurrentPlan] = useState('free')
  const [focusGroupExpiry, setFocusGroupExpiry] = useState<string | null>(null)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState('')
  const [redeemSuccess, setRedeemSuccess] = useState('')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [retailerCount, setRetailerCount] = useState(0)
  const [scheduleCount, setScheduleCount] = useState(0)
  const [paymentFailedAt, setPaymentFailedAt] = useState<string | null>(null)
  const [previousPlanTier, setPreviousPlanTier] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  // Profile state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [stateAbbr, setStateAbbr] = useState('')
  const [zip, setZip] = useState('')
  const [householdSize, setHouseholdSize] = useState('1')
  const [defaultFrequency, setDefaultFrequency] = useState('monthly')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (tabParam && SECTIONS.some(s => s.id === tabParam)) {
      setSection(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase
        .from('users')
        .select('full_name, shipping_addresses, household_size, default_frequency, plan_tier, focus_group_access_expires_at, nudge_email_unsubscribed, payment_failed_at, previous_plan_tier')
        .eq('id', user.id)
        .single()
      if (data) {
        setFullName(data.full_name ?? '')
        setCurrentPlan((data.plan_tier as string | null) ?? 'free')
        setFocusGroupExpiry((data.focus_group_access_expires_at as string | null) ?? null)
        setNudgeEmailUnsubscribed((data.nudge_email_unsubscribed as boolean | null) ?? false)
        setPaymentFailedAt((data.payment_failed_at as string | null) ?? null)
        setPreviousPlanTier((data.previous_plan_tier as string | null) ?? null)
        setHouseholdSize(String(data.household_size ?? 1))
        setDefaultFrequency(data.default_frequency ?? 'monthly')
        const addrs = data.shipping_addresses
        const addr = Array.isArray(addrs) ? addrs[0] : addrs
        if (addr && typeof addr === 'object') {
          setStreet((addr as any).street ?? '')
          setCity((addr as any).city ?? '')
          setStateAbbr((addr as any).state ?? '')
          setZip((addr as any).zip ?? '')
        }
      }
      const [rRes, sRes] = await Promise.all([
        supabase.from('retailers').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_suspended', false),
        supabase.from('purchase_schedules').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_suspended', false),
      ])
      setRetailerCount(rRes.count ?? 0)
      setScheduleCount(sRes.count ?? 0)
    }
    loadProfile()
  }, [supabase])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('users').upsert({
        id: user.id,
        full_name: fullName,
        shipping_addresses: [{ street, city, state: stateAbbr, zip }],
        household_size: parseInt(householdSize) || 1,
      }, { onConflict: 'id' })

      if (showWelcome) {
        setToast('Profile saved! Welcome to Restox.')
        setTimeout(() => router.push('/dashboard'), 1800)
      } else {
        setToast('Profile saved!')
      }
    } catch (err: any) {
      setToast('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRedeem = async () => {
    const trimmed = redeemCode.trim().toUpperCase()
    if (!trimmed) return
    setRedeeming(true)
    setRedeemError('')
    setRedeemSuccess('')
    try {
      const res = await fetch('/api/access-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) { setRedeemError(json.error ?? 'Failed to redeem code'); return }
      const expiry = new Date(json.access_expires_at)
      setRedeemSuccess(`Code redeemed! You now have Pro access until ${expiry.toLocaleDateString()}.`)
      setRedeemCode('')
      setCurrentPlan('pro')
      setFocusGroupExpiry(json.access_expires_at)
    } catch {
      setRedeemError('Network error. Please try again.')
    } finally {
      setRedeeming(false)
    }
  }

  const handleNudgeEmailToggle = async () => {
    const newSubscribed = nudgeEmailUnsubscribed // flipping: if currently unsub, we're re-enabling
    const nextUnsubscribed = !nudgeEmailUnsubscribed
    setNudgeEmailUnsubscribed(nextUnsubscribed)
    try {
      await fetch('/api/nudge/email-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribe: newSubscribed }),
      })
    } catch { /* silent */ }
  }

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').upsert({ id: user.id, theme: newTheme }, { onConflict: 'id' })
      }
    } catch { /* silent — localStorage already persists the choice */ }
  }

  const handleFrequencyChange = async (freq: string) => {
    setDefaultFrequency(freq)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').upsert({ id: user.id, default_frequency: freq }, { onConflict: 'id' })
        setToast('Default frequency saved!')
      }
    } catch { /* silent */ }
  }

  const handleUpgrade = async (tier: string) => {
    setUpgrading(tier)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingPeriod }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setToast('Something went wrong. Please try again.')
    } catch {
      setToast('Something went wrong. Please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  const inputCls = `w-full px-4 py-2.5 border rounded-xl text-sm font-body
    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
    border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-body">Manage your account, billing, and preferences</p>
      </div>

      {showWelcome && (
        <div className="bg-rx-orange-light dark:bg-rx-orange/10 border border-rx-orange/20 rounded-xl p-4 flex items-start gap-3">
          <PartyPopper size={18} className="text-rx-orange mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rx-navy dark:text-white font-body">Welcome to Restox!</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-body mt-0.5">
              Complete your profile to get started — just add your name and household size.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Section nav */}
        <nav className="w-48 shrink-0 bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-medium text-left transition-colors border-l-2
                ${section === id
                  ? 'bg-rx-orange-light dark:bg-rx-orange/10 text-rx-orange border-rx-orange'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 border-transparent'
                }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Content panels */}
        <div className="flex-1 min-w-0">
          {section === 'profile' && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-5">
              <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Account & Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">Full name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className={`${inputCls} bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none`}
                  />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body mt-1">Email cannot be changed here.</p>
                </div>

                {/* Shipping address — split fields */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">Street address</label>
                  <input
                    type="text"
                    placeholder="123 Main St"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">ZIP code</label>
                    <input
                      type="text"
                      placeholder="12345"
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                      maxLength={10}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">State</label>
                  <select
                    value={stateAbbr}
                    onChange={e => setStateAbbr(e.target.value)}
                    className={`${inputCls} bg-white dark:bg-[#16213E]`}
                  >
                    <option value="">Select state…</option>
                    {US_STATES.map(([abbr, name]) => (
                      <option key={abbr} value={abbr}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">Household size</label>
                  <select
                    value={householdSize}
                    onChange={e => setHouseholdSize(e.target.value)}
                    className={`${inputCls} bg-white dark:bg-[#16213E]`}
                  >
                    {[1,2,3,4,5,'6+'].map(n => (
                      <option key={n} value={String(n)}>{n} {n === 1 ? 'person' : 'people'}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-5 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-5">
              <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Appearance</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleThemeChange(value)}
                      className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-colors
                        ${theme === value
                          ? 'border-rx-orange bg-rx-orange-light dark:bg-rx-orange/10'
                          : 'border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'
                        }`}
                    >
                      <Icon
                        size={22}
                        className={theme === value ? 'text-rx-orange' : 'text-gray-400 dark:text-gray-500'}
                      />
                      <span className={`text-xs font-semibold font-body
                        ${theme === value ? 'text-rx-orange' : 'text-gray-600 dark:text-gray-400'}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-3">
                  System follows your OS preference. Your choice is saved automatically.
                </p>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-1">
              <h2 className="font-heading font-semibold text-rx-navy dark:text-white mb-4">Notifications</h2>
              {[
                { label: 'Email notifications',     desc: 'Order confirmations and reminders', on: true,  gate: null },
                { label: 'SMS notifications',       desc: 'Text reminders before orders',     on: false, gate: 'Consumer+' },
                { label: 'Upcoming order reminders',desc: 'Default 24hr before each order',  on: true,  gate: null },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/5 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-rx-navy dark:text-white font-body">{item.label}</p>
                      {item.gate && (
                        <span className="text-[10px] font-bold text-rx-orange bg-rx-orange-light dark:bg-rx-orange/10 px-1.5 py-0.5 rounded-full">{item.gate}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-body">{item.desc}</p>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer
                    ${item.on ? 'bg-rx-orange' : 'bg-gray-200 dark:bg-white/10'}
                    ${item.gate ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                      ${item.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}

              {/* Nudge email toggle — Free and Consumer users only, not admins */}
              {!bypassGates && ['free', 'consumer'].includes(currentPlan) && (
                <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/5">
                  <div>
                    <p className="text-sm font-medium text-rx-navy dark:text-white font-body">
                      Weekly upgrade insights emails
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
                      Get a weekly email when Restox detects products you reorder regularly. In-app notifications are always on.
                    </p>
                  </div>
                  <button
                    onClick={handleNudgeEmailToggle}
                    aria-pressed={!nudgeEmailUnsubscribed}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      nudgeEmailUnsubscribed ? 'bg-gray-200 dark:bg-white/10' : 'bg-rx-orange'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      nudgeEmailUnsubscribed ? 'translate-x-0.5' : 'translate-x-5'
                    }`} />
                  </button>
                </div>
              )}

              {/* Default reorder frequency */}
              <div className="pt-4">
                <label className="block text-sm font-medium text-rx-navy dark:text-white font-body mb-1">
                  Default reorder frequency
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-body mb-3">
                  Used when adding a new product without a detected frequency.
                </p>
                <select
                  value={defaultFrequency}
                  onChange={e => handleFrequencyChange(e.target.value)}
                  className={inputCls}
                >
                  {[
                    { value: 'weekly',      label: 'Weekly' },
                    { value: 'bi-weekly',   label: 'Every 2 weeks' },
                    { value: 'monthly',     label: 'Monthly' },
                    { value: 'six-weekly',  label: 'Every 6 weeks' },
                    { value: 'bi-monthly',  label: 'Every 2 months' },
                    { value: 'quarterly',   label: 'Every 3 months' },
                  ].map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {section === 'billing' && (
            <div className="space-y-4">
              {/* Payment failure banner */}
              {paymentFailedAt && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 font-body">Payment failed — account temporarily on Free</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 font-body mt-0.5">
                      Update your payment method to restore{' '}
                      <span className="font-medium capitalize">{previousPlanTier ?? 'paid'}</span> access.
                    </p>
                  </div>
                  <a href="/dashboard/settings/billing" className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0">Fix now →</a>
                </div>
              )}

              <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-4">
                <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Billing & Plan</h2>

                {/* Current plan banner with usage meters */}
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-rx-navy dark:text-white">
                      {PLANS.find(p => p.id === currentPlan)?.label ?? 'Free'}
                    </span>
                    <span className="text-[10px] font-bold text-rx-orange border border-rx-orange/30 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-full">Current plan</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-body">
                    {PLANS.find(p => p.id === currentPlan)?.tagline ?? ''}
                  </p>
                  {currentPlan !== 'business' ? (
                    <div className="space-y-2">
                      {[
                        { label: 'Retailers', count: retailerCount, cap: RETAILER_CAPS[currentPlan] ?? 3 },
                        { label: 'Schedules', count: scheduleCount, cap: SCHEDULE_CAPS[currentPlan] ?? 3 },
                      ].map(({ label, count, cap }) => {
                        const pct = Math.min(100, Math.round((count / cap) * 100))
                        return (
                          <div key={label}>
                            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-body mb-1">
                              <span>{label}</span>
                              <span>{count} / {cap}</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-rx-orange'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-body">{retailerCount} retailers · {scheduleCount} schedules · Unlimited</p>
                  )}
                </div>

                {/* Focus group expiry notice */}
                {focusGroupExpiry && (
                  <div className="flex items-start gap-3 bg-rx-orange/5 dark:bg-rx-orange/10 border border-rx-orange/20 rounded-xl p-4">
                    <span className="text-rx-orange text-lg shrink-0">🎉</span>
                    <div>
                      <p className="text-sm font-semibold text-rx-navy dark:text-white font-body">Focus Group Pro Access</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-0.5">
                        Active until{' '}
                        <span className="font-medium text-rx-navy dark:text-white">
                          {new Date(focusGroupExpiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        . Thank you for being a focus group member!
                      </p>
                    </div>
                  </div>
                )}

                {/* Monthly/Annual toggle */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold font-body ${billingPeriod === 'monthly' ? 'text-rx-navy dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Monthly</span>
                  <button
                    onClick={() => setBillingPeriod(p => p === 'monthly' ? 'annual' : 'monthly')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${billingPeriod === 'annual' ? 'bg-rx-orange' : 'bg-gray-200 dark:bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${billingPeriod === 'annual' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className={`text-xs font-semibold font-body ${billingPeriod === 'annual' ? 'text-rx-navy dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Annual</span>
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">Save 17%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLANS.map(plan => {
                    const isCurrent = currentPlan === plan.id
                    const isUpgrade = TIER_ORDER.indexOf(plan.id) > TIER_ORDER.indexOf(currentPlan)
                    const price = billingPeriod === 'monthly' ? MONTHLY_PRICES[plan.id] : ANNUAL_PRICES[plan.id].perMonth
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-xl border-2 p-4 transition-colors
                          ${isCurrent
                            ? 'border-rx-orange bg-rx-orange-light dark:bg-rx-orange/10'
                            : 'border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-heading font-bold text-rx-navy dark:text-white text-sm">{plan.label}</span>
                          <div className="flex items-center gap-1">
                            {billingPeriod === 'annual' && plan.id !== 'free' && (
                              <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded">2 mo free</span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-rx-orange border border-rx-orange/30 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-full">Current</span>
                            )}
                          </div>
                        </div>
                        <p className="text-lg font-bold font-heading text-rx-navy dark:text-white">
                          {price}<span className="text-xs font-normal text-gray-400 dark:text-gray-500">/mo</span>
                        </p>
                        {billingPeriod === 'annual' && plan.id !== 'free' && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-body">{ANNUAL_PRICES[plan.id].yearly}/yr billed annually</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5 mb-2">{plan.schedules}</p>
                        <ul className="space-y-0.5">
                          {plan.features.map(f => (
                            <li key={f} className="text-xs text-gray-500 dark:text-gray-400 font-body">· {f}</li>
                          ))}
                        </ul>
                        {!isCurrent && isUpgrade && (
                          <button
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={upgrading === plan.id}
                            className="mt-3 w-full py-1.5 bg-rx-orange text-white text-xs font-bold rounded-lg hover:bg-rx-orange-dark transition-colors font-body flex items-center justify-center gap-1 disabled:opacity-60"
                          >
                            {upgrading === plan.id ? <Loader2 size={12} className="animate-spin" /> : 'Upgrade'}
                          </button>
                        )}
                        {!isCurrent && !isUpgrade && plan.id !== 'free' && (
                          <a
                            href="/dashboard/settings/billing"
                            className="mt-3 block w-full py-1.5 text-center border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body"
                          >
                            Downgrade
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 font-body text-center">
                  Manage payment methods and invoices at{' '}
                  <a href="/dashboard/settings/billing" className="text-rx-orange hover:underline">your billing page</a>
                </p>
              </div>

              {/* Focus group code redemption */}
              {!focusGroupExpiry && (
                <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-3">
                  <div>
                    <h3 className="font-heading font-semibold text-rx-navy dark:text-white text-sm">Have a focus group code?</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-0.5">
                      Enter your code below to unlock 2 months of full Pro access.
                    </p>
                  </div>
                  {redeemSuccess ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle size={15} />
                      <p className="text-sm font-body">{redeemSuccess}</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={redeemCode}
                        onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setRedeemError('') }}
                        placeholder="RESTOX-BETA-XXXXXX"
                        className="flex-1 px-3 py-2 text-sm font-mono bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-rx-navy dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
                      />
                      <button
                        onClick={handleRedeem}
                        disabled={redeeming || !redeemCode.trim()}
                        className="px-4 py-2 bg-rx-orange hover:bg-rx-orange/90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors font-body shrink-0"
                      >
                        {redeeming ? <Loader2 size={14} className="animate-spin" /> : 'Redeem'}
                      </button>
                    </div>
                  )}
                  {redeemError && (
                    <p className="text-xs text-red-500 font-body">{redeemError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {section === 'retailers' && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-4">
              <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Retailer Memberships</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-body">Store loyalty numbers for faster checkout and rewards tracking.</p>
              {['Amazon Prime', 'Costco', 'Target Circle', 'Kroger Plus'].map(r => (
                <div key={r} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-rx-navy dark:text-white font-body w-32 shrink-0">{r}</span>
                  <input
                    placeholder="Membership number"
                    className={`${inputCls} flex-1 w-auto`}
                  />
                </div>
              ))}
              <button className="px-5 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body">
                Save memberships
              </button>
            </div>
          )}

          {section === 'security' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-1">
                <h2 className="font-heading font-semibold text-rx-navy dark:text-white mb-4">Security</h2>
                {[
                  { label: 'Change password', desc: 'Update your email/password login',       action: 'Update', danger: false },
                  { label: 'Active sessions', desc: 'View and revoke devices',                action: 'Manage', danger: false },
                  { label: 'Delete account',  desc: 'Permanently delete your Restox account', action: 'Delete', danger: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/5 last:border-0">
                    <div>
                      <p className={`text-sm font-medium font-body ${item.danger ? 'text-red-500' : 'text-rx-navy dark:text-white'}`}>{item.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-body">{item.desc}</p>
                    </div>
                    <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg font-body transition-colors
                      ${item.danger ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' : 'text-rx-blue dark:text-blue-400 bg-rx-blue/10 hover:bg-rx-blue/20'}`}>
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>

              {/* Team Members — Business only */}
              <div className={`relative bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 ${!isBusinessOnly ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Team Members</h2>
                  </div>
                  {!isBusinessOnly && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                      <Lock size={9} /> Business
                    </span>
                  )}
                </div>
                {isBusinessOnly ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-body">Invite team members to share your Restox workspace.</p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-body">
                    Multi-user seats and approval workflows are available on the Business plan.{' '}
                    <a href="/dashboard/settings/billing" className="text-rx-orange hover:underline">Upgrade →</a>
                  </p>
                )}
              </div>

              {/* Priority Support — Business only */}
              <div className={`relative bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 ${!isBusinessOnly ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Headphones size={16} className="text-gray-400" />
                    <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Priority Support</h2>
                  </div>
                  {!isBusinessOnly && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                      <Lock size={9} /> Business
                    </span>
                  )}
                </div>
                {isBusinessOnly ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-body">
                    You have dedicated priority support. Email{' '}
                    <a href="mailto:priority@restox.net" className="text-rx-orange hover:underline">priority@restox.net</a>{' '}
                    for fastest response.
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-body">
                    Priority support with dedicated response times is available on the Business plan.{' '}
                    <a href="/dashboard/settings/billing" className="text-rx-orange hover:underline">Upgrade →</a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  )
}
