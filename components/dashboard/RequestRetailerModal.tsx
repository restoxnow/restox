'use client'

import { useState } from 'react'
import { X, Store, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  onClose: () => void
  initialRetailerName?: string
}

export default function RequestRetailerModal({ onClose, initialRetailerName = '' }: Props) {
  const [retailerName, setRetailerName] = useState(initialRetailerName)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!retailerName.trim()) { setError('Retailer name is required'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/retailers/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailerName: retailerName.trim(),
          websiteUrl: websiteUrl.trim() || null,
          reason: reason.trim() || null,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Submission failed')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full px-4 py-2.5 border rounded-xl text-sm font-body
    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
    border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-300`

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16213E] rounded-2xl w-full max-w-md shadow-2xl dark:shadow-black/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center">
              <Store size={16} className="text-rx-orange" />
            </div>
            <span className="font-heading font-semibold text-rx-navy dark:text-white">Request a Retailer</span>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          {!submitted && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-orange-50 dark:bg-rx-orange/10 border border-orange-100 dark:border-rx-orange/20">
              <p className="text-xs text-orange-800 dark:text-orange-300 font-body leading-relaxed">
                Requested retailers are reviewed weekly. You&apos;ll be notified at your account email when your retailer is added.
              </p>
            </div>
          )}
          {submitted ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3">
                <CheckCircle size={24} className="text-green-500 dark:text-green-400" />
              </div>
              <p className="font-heading font-semibold text-rx-navy dark:text-white mb-1">Request submitted!</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-body mb-5">
                Thanks for the suggestion. We review all retailer requests and prioritize by demand.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">
                  Retailer name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={retailerName}
                  onChange={e => setRetailerName(e.target.value)}
                  placeholder="e.g. Chewy, IKEA, Petco"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">
                  Website URL <span className="text-gray-300 dark:text-gray-600">(optional)</span>
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-body mb-1">
                  Why do you want this retailer? <span className="text-gray-300 dark:text-gray-600">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="I regularly order from here and would love to automate it…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              {error && <p className="text-red-500 text-xs font-body">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
                  rounded-xl text-sm transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : 'Submit Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
