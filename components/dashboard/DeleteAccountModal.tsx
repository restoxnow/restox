'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface Props {
  planTier: string
  onClose: () => void
}

const PAID_TIERS = ['consumer', 'professional', 'business']

const PLAN_LABELS: Record<string, string> = {
  consumer: 'Consumer',
  professional: 'Professional',
  business: 'Business',
}

export default function DeleteAccountModal({ planTier, onClose }: Props) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const isPaid = PAID_TIERS.includes(planTier)
  const confirmed = confirmText === 'DELETE'

  // Focus the input and lock body scroll on mount
  useEffect(() => {
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDelete = async () => {
    if (!confirmed || deleting) return
    setDeleting(true)
    setError('')

    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Something went wrong. Please try again or contact support@restox.net.')
        setDeleting(false)
        return
      }

      // Sign out locally then redirect to home
      await supabase.auth.signOut()
      router.push('/?account=deleted')
    } catch {
      setError('Network error. Please try again or contact support@restox.net.')
      setDeleting(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#16213E] rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Icon + heading */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-rx-navy dark:text-white text-base leading-snug">
              Delete your Restox account?
            </h2>
          </div>
        </div>

        {/* Warning */}
        <div className="space-y-3 text-sm font-body text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            This will permanently delete your account, all your schedules, retailers, products,
            and order history. <span className="font-semibold text-red-600 dark:text-red-400">This cannot be undone.</span>
          </p>
          {isPaid && (
            <p className="px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
              Your <span className="font-semibold">{PLAN_LABELS[planTier]}</span> subscription will
              be cancelled immediately. No refunds are issued for unused time.
            </p>
          )}
        </div>

        {/* Confirm text input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 font-body uppercase tracking-wide">
            Type <span className="font-mono text-red-600 dark:text-red-400 normal-case tracking-normal">DELETE</span> to confirm
          </label>
          <input
            ref={inputRef}
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            spellCheck={false}
            className="w-full px-4 py-2.5 border-2 rounded-xl text-sm font-mono font-bold text-rx-navy dark:text-white
              bg-white dark:bg-white/5 placeholder:text-gray-300 dark:placeholder:text-gray-600
              focus:outline-none transition-colors
              border-gray-200 dark:border-white/10
              focus:border-red-400 dark:focus:border-red-500"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 font-body">{error}</p>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-body disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white font-body flex items-center justify-center gap-2 transition-colors
              bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            {deleting ? 'Deleting…' : 'Permanently delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}
