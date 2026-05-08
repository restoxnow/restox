'use client'

import { Lock, CreditCard, Mail, Camera } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

const INSIGHTS = [
  { id: 1, product: 'Organic Coffee Beans', source: 'email',  spend: '$18.99/mo avg',  action: 'Add to Restox',  done: false },
  { id: 2, product: 'Protein Powder',        source: 'plaid',  spend: '$44.99/6wks avg', action: 'Add to Restox',  done: false },
  { id: 3, product: 'Laundry Detergent',     source: 'receipt',spend: '$21.99/mo avg',  action: 'Already tracked', done: true },
]

const SOURCE_ICON: Record<string, React.ElementType> = { email: Mail, plaid: CreditCard, receipt: Camera }
const SOURCE_LABEL: Record<string, string> = { email: 'Email parsing', plaid: 'Plaid bank link', receipt: 'Receipt OCR' }

export default function SpendIntelligencePage() {
  const { hasProAccess: isPro } = useUser()
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy">Spend Intelligence</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">AI-powered purchase insights and automation suggestions</p>
        </div>

        {/* Blurred preview with overlay */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="blur-sm pointer-events-none select-none bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {INSIGHTS.map(insight => {
              const Icon = SOURCE_ICON[insight.source]
              return (
                <div key={insight.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-rx-navy font-body">{insight.product}</p>
                    <p className="text-xs text-gray-400 font-body mt-0.5">
                      Detected via {SOURCE_LABEL[insight.source]} · {insight.spend}
                    </p>
                  </div>
                  <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg font-body
                    ${insight.done ? 'text-gray-400 bg-gray-50' : 'text-rx-orange bg-rx-orange-light'}`}>
                    {insight.action}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rx-orange-light flex items-center justify-center mb-4">
              <Lock size={24} className="text-rx-orange" />
            </div>
            <h3 className="font-heading font-bold text-rx-navy text-lg mb-1">Professional Feature</h3>
            <p className="text-sm text-gray-500 font-body text-center max-w-xs mb-5">
              Spend Intelligence scans your purchase history via Plaid, email, or receipt OCR to surface things you buy repeatedly but haven&apos;t automated yet.
            </p>
            <button className="px-6 py-2.5 bg-rx-orange text-white font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body text-sm">
              Upgrade to Professional — $29/mo
            </button>
            <a href="/dashboard/settings" className="mt-2 text-xs text-gray-400 hover:text-gray-600 font-body transition-colors">
              View all plans
            </a>
          </div>
        </div>

        {/* Source teasers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: CreditCard, title: 'Plaid bank link',  desc: 'Scans bank & card transactions to find repeat purchases' },
            { icon: Mail,       title: 'Email parsing',    desc: 'Reads order confirmation emails from retailers' },
            { icon: Camera,     title: 'Receipt OCR',      desc: 'Snap a receipt and Restox extracts products automatically' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 p-4 opacity-50">
              <Icon size={20} className="text-blue-500 mb-2" />
              <p className="text-sm font-semibold text-rx-navy font-heading">{title}</p>
              <p className="text-xs text-gray-400 font-body mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy">Spend Intelligence</h1>
        <p className="text-gray-500 text-sm mt-1 font-body">Detected repeat purchases you haven&apos;t automated yet</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {INSIGHTS.map(insight => {
          const Icon = SOURCE_ICON[insight.source]
          return (
            <div key={insight.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-rx-navy font-body">{insight.product}</p>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  Detected via {SOURCE_LABEL[insight.source]} · {insight.spend}
                </p>
              </div>
              <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg font-body transition-colors
                ${insight.done
                  ? 'text-gray-400 bg-gray-50'
                  : 'text-rx-orange bg-rx-orange-light hover:bg-rx-orange/20'
                }`}>
                {insight.action}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
