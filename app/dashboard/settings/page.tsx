'use client'

import { useState } from 'react'
import { User, Bell, CreditCard, Store, Shield } from 'lucide-react'

const SECTIONS = [
  { id: 'profile',       label: 'Account & Profile',     icon: User },
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

export default function SettingsPage() {
  const [section, setSection] = useState<SectionId>('profile')
  const currentPlan = 'free'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy">Settings</h1>
        <p className="text-gray-500 text-sm mt-1 font-body">Manage your account, billing, and preferences</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Section nav */}
        <nav className="w-48 shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-body font-medium text-left transition-colors border-l-2
                ${section === id
                  ? 'bg-rx-orange-light text-rx-orange border-rx-orange'
                  : 'text-gray-600 hover:bg-gray-50 border-transparent'
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="font-heading font-semibold text-rx-navy">Account & Profile</h2>
              <div className="space-y-4">
                {[
                  { label: 'Full name', placeholder: 'Your name', type: 'text', disabled: false },
                  { label: 'Email',     placeholder: 'you@example.com', type: 'email', disabled: true },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-gray-500 font-body mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      disabled={f.disabled}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm font-body
                        focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                        ${f.disabled ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-gray-200'}`}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-500 font-body mb-1">Household size</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-body bg-white
                    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange">
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

          {section === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-1">
              <h2 className="font-heading font-semibold text-rx-navy mb-4">Notifications</h2>
              {[
                { label: 'Email notifications',    desc: 'Order confirmations and reminders', on: true,  gate: null },
                { label: 'SMS notifications',      desc: 'Text reminders before orders',     on: false, gate: 'Consumer+' },
                { label: 'Upcoming order reminders',desc: 'Default 24hr before each order',  on: true,  gate: null },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-rx-navy font-body">{item.label}</p>
                      {item.gate && (
                        <span className="text-[10px] font-bold text-rx-orange bg-rx-orange-light px-1.5 py-0.5 rounded-full">{item.gate}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-body">{item.desc}</p>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer
                    ${item.on ? 'bg-rx-orange' : 'bg-gray-200'}
                    ${item.gate ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                      ${item.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'billing' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-heading font-semibold text-rx-navy">Billing & Plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    className={`rounded-xl border-2 p-4 transition-colors
                      ${currentPlan === plan.id ? 'border-rx-orange bg-rx-orange-light' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-rx-navy text-sm">{plan.label}</span>
                      {currentPlan === plan.id && (
                        <span className="text-[10px] font-bold text-rx-orange border border-rx-orange/30 bg-white px-1.5 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                    <p className="text-lg font-bold font-heading text-rx-navy">{plan.price}</p>
                    <p className="text-xs text-gray-400 font-body mt-0.5 mb-2">{plan.schedules}</p>
                    <ul className="space-y-0.5">
                      {plan.features.map(f => (
                        <li key={f} className="text-xs text-gray-500 font-body">· {f}</li>
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-heading font-semibold text-rx-navy">Retailer Memberships</h2>
              <p className="text-sm text-gray-500 font-body">Store loyalty numbers for faster checkout and rewards tracking.</p>
              {['Amazon Prime', 'Costco', 'Target Circle', 'Kroger Plus'].map(r => (
                <div key={r} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-rx-navy font-body w-32 shrink-0">{r}</span>
                  <input
                    placeholder="Membership number"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-body
                      focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                      placeholder:text-gray-300"
                  />
                </div>
              ))}
              <button className="px-5 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body">
                Save memberships
              </button>
            </div>
          )}

          {section === 'security' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-1">
              <h2 className="font-heading font-semibold text-rx-navy mb-4">Security</h2>
              {[
                { label: 'Change password',  desc: 'Update your email/password login',           action: 'Update', danger: false },
                { label: 'Active sessions',  desc: 'View and revoke devices',                    action: 'Manage', danger: false },
                { label: 'Delete account',   desc: 'Permanently delete your Restox account',     action: 'Delete', danger: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className={`text-sm font-medium font-body ${item.danger ? 'text-red-500' : 'text-rx-navy'}`}>{item.label}</p>
                    <p className="text-xs text-gray-400 font-body">{item.desc}</p>
                  </div>
                  <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg font-body transition-colors
                    ${item.danger ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-rx-blue bg-rx-blue/10 hover:bg-rx-blue/20'}`}>
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
