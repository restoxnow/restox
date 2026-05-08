'use client'

import { BrainCircuit, Lock, TrendingDown, Sliders } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

const PREDICTIONS = [
  { id: 1, product: 'Tide Pods 96ct',  predictedDate: 'May 10', confidence: 94, seasonal: false, daysLeft: 3 },
  { id: 2, product: 'Dawn Dish Soap',  predictedDate: 'May 22', confidence: 87, seasonal: false, daysLeft: 15 },
  { id: 3, product: 'Vitamin D3',      predictedDate: 'Jun 1',  confidence: 72, seasonal: true,  daysLeft: 25 },
]

function ConfidenceBadge({ value }: { value: number }) {
  const cls = value >= 90
    ? 'text-green-600 bg-green-50'
    : value >= 75
    ? 'text-amber-600 bg-amber-50'
    : 'text-red-500 bg-red-50'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {value}% confidence
    </span>
  )
}

export default function AITimingPage() {
  const { hasProAccess: isPro } = useUser()
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy">AI Reorder Timing</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">Predicted run-out dates powered by AI</p>
        </div>

        {/* Blurred preview with upgrade overlay */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="blur-sm pointer-events-none select-none bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {PREDICTIONS.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BrainCircuit size={18} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-rx-navy font-body">{p.product}</p>
                  <p className="text-xs text-gray-400 font-body mt-0.5">
                    Predicted run-out: {p.predictedDate} · {p.daysLeft} days left
                  </p>
                </div>
                <ConfidenceBadge value={p.confidence} />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rx-orange-light flex items-center justify-center mb-4">
              <Lock size={24} className="text-rx-orange" />
            </div>
            <h3 className="font-heading font-bold text-rx-navy text-lg mb-1">Professional Feature</h3>
            <p className="text-sm text-gray-500 font-body text-center max-w-xs mb-5">
              AI Reorder Timing predicts when you&apos;ll run out before you do — using consumption patterns, household size, and seasonal trends.
            </p>
            <button className="px-6 py-2.5 bg-rx-orange text-white font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body text-sm">
              Upgrade to Professional — $29/mo
            </button>
            <a href="/dashboard/settings" className="mt-2 text-xs text-gray-400 hover:text-gray-600 font-body transition-colors">
              View all plans
            </a>
          </div>
        </div>

        {/* Feature teasers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: BrainCircuit, title: 'Consumption patterns', desc: 'Learns how fast your household uses each product' },
            { icon: TrendingDown,  title: 'Seasonal adjustments', desc: 'Accounts for summer vs winter usage differences' },
            { icon: Sliders,       title: 'Manual overrides',     desc: 'Adjust predictions when life changes' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 p-4 opacity-50">
              <Icon size={20} className="text-purple-500 mb-2" />
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
        <h1 className="text-2xl font-heading font-bold text-rx-navy">AI Reorder Timing</h1>
        <p className="text-gray-500 text-sm mt-1 font-body">Predicted run-out dates powered by AI</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {PREDICTIONS.map(p => (
          <div key={p.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <BrainCircuit size={18} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-rx-navy font-body">{p.product}</p>
                {p.seasonal && (
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">Seasonal</span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-body mt-0.5">
                Predicted run-out: <strong>{p.predictedDate}</strong> · {p.daysLeft} days left
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConfidenceBadge value={p.confidence} />
              <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-rx-navy font-body transition-colors">
                <Sliders size={12} /> Override
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
