'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const CATEGORIES = ['Bug Report', 'Broken Link', 'Feature Request', 'Other'] as const
type Category = (typeof CATEGORIES)[number]

interface Props {
  onClose: () => void
  initialOpen?: boolean
}

export default function ReportIssueModal({ onClose, initialOpen }: Props) {
  const supabase = createSupabaseBrowserClient()
  const [category, setCategory] = useState<Category>('Bug Report')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [emailLocked, setEmailLocked] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msgError, setMsgError] = useState('')
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const overlayRef = useRef<HTMLDivElement>(null)

  // Pre-fill email if logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email)
        setEmailLocked(true)
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      setMsgError('Please write at least 10 characters.')
      return
    }
    setMsgError('')
    setStatus('loading')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim(), page_url: pageUrl, email }),
      })
      if (!res.ok) throw new Error('bad status')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#16213E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white font-heading">
            Report an Issue
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {status === 'success' ? (
            <div className="py-6 text-center space-y-2">
              <div className="text-2xl">✓</div>
              <p className="text-sm font-medium text-gray-800 dark:text-white font-body">
                Thanks — we've received your report and will look into it.
              </p>
            </div>
          ) : status === 'error' ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm text-red-500 font-body">
                Something went wrong. Please email{' '}
                <a href="mailto:asevedge@restox.net" className="underline">
                  asevedge@restox.net
                </a>{' '}
                directly.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-body">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white font-body focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-body">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => { setMessage(e.target.value); setMsgError('') }}
                  rows={4}
                  placeholder="Describe the issue or your feedback…"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white font-body placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange resize-none"
                />
                {msgError && (
                  <p className="text-xs text-red-400 mt-1 font-body">{msgError}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-body">
                  Your email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  readOnly={emailLocked}
                  placeholder="you@example.com"
                  className={`w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                    ${emailLocked
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 cursor-default'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white'
                    }`}
                />
                {emailLocked && (
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 font-body">
                    Signed in as {email}
                  </p>
                )}
              </div>

              {/* Page URL — hidden but auto-captured */}
              {pageUrl && (
                <p className="text-[10px] text-gray-300 dark:text-gray-700 font-body truncate">
                  Page: {pageUrl}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {status !== 'success' && status !== 'error' && (
          <div className="px-5 pb-5">
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="w-full py-2.5 text-sm font-semibold text-white bg-rx-orange hover:bg-rx-orange/90 disabled:opacity-60 rounded-xl transition-colors font-heading"
            >
              {status === 'loading' ? 'Sending…' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
