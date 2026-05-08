'use client'

import Link from 'next/link'
import { Lock, CreditCard, Mail, Camera, PieChart } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

// Sample rows shown only behind the paywall blur — not real data
const SAMPLE_ROWS = [
  { id: 1, product: 'Organic Coffee Beans', source: 'email',   spend: '$18.99/mo avg'  },
  { id: 2, product: 'Protein Powder',        source: 'plaid',  spend: '$44.99/6wks avg' },
  { id: 3, product: 'Laundry Detergent',     source: 'receipt',spend: '$21.99/mo avg'  },
]

const SOURCE_ICON: Record<string, React.ElementType> = { email: Mail, plaid: CreditCard, receipt: Camera }
const SOURCE_LABEL: Record<string, string> = { email: 'Email parsing', plaid: 'Plaid bank link', receipt: 'Receipt OCR' }

export default function SpendIntelligencePage() {
  const { hasProAccess } = useUser()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-rx-navy">Spend Intelligence</h1>
        <p className="text-gray-500 text-sm mt-1 font-body">AI-powered purchase insights and automation suggestions</p>
      </div>

      {!hasProAccess ? (
        <>
          {/* Blurred preview with overlay */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="blur-sm pointer-events-none select-none bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {SAMPLE_ROWS.map(row => {
                const Icon = SOURCE_ICON[row.source]
                return (
                  <div key={row.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Icon size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-rx-navy font-body">{row.product}</p>
                      <p className="text-xs text-gray-400 font-body mt-0.5">
                        Detected via {SOURCE_LABEL[row.source]} · {row.spend}
                      </p>
                    </div>
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
        </>
      ) : (
        /* Pro / admin unlocked — empty state until real data exists */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
            <PieChart size={26} className="text-blue-500" />
          </div>
          <h2 className="font-heading font-semibold text-rx-navy text-base mb-1">No insights yet</h2>
          <p className="text-sm text-gray-400 font-body max-w-xs mb-6">
            Connect a retailer or link your bank via Plaid to surface products you buy repeatedly.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/dashboard/retailers"
              className="px-5 py-2.5 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
            >
              Connect a Retailer
            </Link>
            <button
              disabled
              className="px-5 py-2.5 border border-gray-200 text-gray-400 text-sm font-semibold rounded-xl font-body cursor-not-allowed"
            >
              Link Bank Account (Coming Soon)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
