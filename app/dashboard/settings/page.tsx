'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { User, Bell, CreditCard, Store, Shield, Palette, Sun, Moon, Monitor, PartyPopper } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const SECTIONS = [
  { id: 'profile',       label: 'Account & Profile',     icon: User },
  { id: 'appearance',   label: 'Appearance',             icon: Palette },
  { id: 'notifications', label: 'Notifications',         icon: Bell },
  { id: 'billing',       label: 'Billing & Plan',        icon: CreditCard },
  { id: 'retailers',     label: 'Retailer Memberships',  icon: Store },
  { id: 'security',      label: 'Security',              icon: Shield },
] as const

type SectionId = typeof SECTIONS[number]['id']

const PLANS = [
  { id: 'free',         label: 'Free',         price: '$0/mo',    schedules: '5 schedules',        features: ['Manual only', 'Ad-supported'] },
  { id: 'consumer',     label: 'Consumer',     price: '$9.99/mo', schedules: '25 schedules',       features: ['Full automation', 'Ad-free', 'SMS notifications'] },
  { id: 'professional', label: 'Professional', price: '$29/mo',   schedules: 'Unlimited',          features: ['AI Reorder Timing', 'Spend Intelligence', 'Price auto-switching'] },
  { id: 'business',     label: 'Business SMB', price: '$79/mo',   schedules: 'Unlimited + API',    features: ['Multi-user seats', 'Approval workflows', 'White-label API'] },
]

const THEME_OPTIONS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function SettingsContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as SectionId | null
  const showWelcome = searchParams.get('welcome') === 'true'

  const [section, setSection] = useState<SectionId>(
    tabParam && SECTIONS.some(s => s.id === tabParam) ? tabParam : 'profile'
  )
  const currentPlan = 'free'
  const { theme, setTheme } = useTheme()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (tabParam && SECTIONS.some(s => s.id === tabParam)) {
      setSection(tabParam)
    }
  }, [tabParam])

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').upsert({ id: user.id, theme: newTheme }, { onConflict: 'id' })
      }
    } catch { /* silent — localStorage already persists the choice */ }
  }

  const inputCls = `w-full px-4 py-2.5 border rounded-xl text-sm font-body
    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
    border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                  <input type="text" placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    disabled
                    className={`${inputCls} border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-400 cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">Shipping address</label>
                  <input type="text" placeholder="123 Main St, City, State, ZIP" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">Household size</label>
                  <select className={`${inputCls} bg-white dark:bg-[#16213E]`}>
                    {[1,2,3,4,5,'6+'].map(n => (
                      <option key={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                    ))}
                  </select>
                </div>
                <button className="px-5 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body">
                  Save changes
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
            </div>
          )}

          {section === 'billing' && (
            <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-6 space-y-4">
              <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Billing & Plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    className={`rounded-xl border-2 p-4 transition-colors
                      ${currentPlan === plan.id
                        ? 'border-rx-orange bg-rx-orange-light dark:bg-rx-orange/10'
                        : 'border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-rx-navy dark:text-white text-sm">{plan.label}</span>
                      {currentPlan === plan.id && (
                        <span className="text-[10px] font-bold text-rx-orange border border-rx-orange/30 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                    <p className="text-lg font-bold font-heading text-rx-navy dark:text-white">{plan.price}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5 mb-2">{plan.schedules}</p>
                    <ul className="space-y-0.5">
                      {plan.features.map(f => (
                        <li key={f} className="text-xs text-gray-500 dark:text-gray-400 font-body">· {f}</li>
                      ))}
                    </ul>
                    {currentPlan !== plan.id && (
                      <button className="mt-3 w-full py-1.5 bg-rx-orange text-white text-xs font-bold rounded-lg hover:bg-rx-orange-dark transition-colors font-body">
                        Upgrade
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
