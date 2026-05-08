import { Plus, BrainCircuit, Mail, MessageSquare, Pause, Pencil } from 'lucide-react'

const SCHEDULES = [
  { id: 1, product: 'Dawn Dish Soap 90oz',     retailer: 'Amazon',  frequency: 'Every 30 days', next: 'May 8',  aiManaged: false, channel: 'email', notifyBefore: '24hr' },
  { id: 2, product: 'Tide Pods 96ct',           retailer: 'Costco',  frequency: 'Every 45 days', next: 'May 10', aiManaged: true,  channel: 'email', notifyBefore: '24hr' },
  { id: 3, product: 'Bounty Paper Towels 12pk', retailer: 'Walmart', frequency: 'Every 60 days', next: 'May 12', aiManaged: false, channel: 'sms',   notifyBefore: '12hr' },
  { id: 4, product: 'Cascade Pods 60ct',        retailer: 'Amazon',  frequency: 'Every 30 days', next: 'May 15', aiManaged: true,  channel: 'both',  notifyBefore: '48hr' },
]

const NOTIFY_OPTIONS = ['6hr', '12hr', '24hr', '48hr']

export default function SchedulesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy">Schedules</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            {SCHEDULES.length} active · 1 remaining before free limit
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body">
          <Plus size={16} /> New schedule
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {SCHEDULES.map(s => (
          <div key={s.id} className="px-5 py-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-rx-navy font-body">{s.product}</span>
                  {s.aiManaged && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                      <BrainCircuit size={10} /> AI managed
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-body mt-0.5">{s.retailer} · {s.frequency}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-gray-300">
                  {(s.channel === 'email' || s.channel === 'both') && <Mail size={14} />}
                  {(s.channel === 'sms'   || s.channel === 'both') && <MessageSquare size={14} />}
                </div>
                <span className="text-xs font-semibold text-rx-navy bg-gray-100 px-2 py-1 rounded-lg font-body">
                  Next: {s.next}
                </span>
                <button className="text-gray-300 hover:text-rx-navy transition-colors p-1 rounded">
                  <Pencil size={14} />
                </button>
                <button className="text-gray-300 hover:text-rx-orange transition-colors p-1 rounded">
                  <Pause size={14} />
                </button>
              </div>
            </div>

            {/* Notify timing bar */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-body">Notify</span>
              {NOTIFY_OPTIONS.map(t => (
                <button
                  key={t}
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-body font-medium transition-colors
                    ${t === s.notifyBefore
                      ? 'bg-rx-orange text-white border-rx-orange'
                      : 'border-gray-200 text-gray-400 hover:border-rx-orange hover:text-rx-orange'
                    }`}
                >
                  {t}
                </button>
              ))}
              <span className="text-[11px] text-gray-400 font-body ml-1">before order</span>
            </div>
          </div>
        ))}
      </div>

      {/* Free tier nudge */}
      <div className="bg-rx-orange-light border border-rx-orange/20 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-rx-navy font-heading">4 of 5 schedules used</p>
          <p className="text-xs text-gray-500 font-body mt-0.5">Upgrade to Consumer for unlimited schedules + SMS</p>
        </div>
        <button className="px-4 py-2 bg-rx-orange text-white text-xs font-bold rounded-lg hover:bg-rx-orange-dark transition-colors font-body">
          Upgrade — $9.99/mo
        </button>
      </div>
    </div>
  )
}
