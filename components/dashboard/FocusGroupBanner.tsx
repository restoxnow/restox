'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  expiresAt: string // ISO string
}

const DISMISS_KEY = 'fg_banner_dismissed_date'

export default function FocusGroupBanner({ expiresAt }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed !== today) setVisible(true)
  }, [])

  const expiry = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Only show banner within 7 days of expiry
  if (daysLeft > 7 || daysLeft <= 0 || !visible) return null

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(DISMISS_KEY, today)
    setVisible(false)
  }

  return (
    <div className="shrink-0 bg-gradient-to-r from-rx-orange/10 to-amber-50 dark:from-rx-orange/20 dark:to-amber-900/20 border-b border-rx-orange/20 dark:border-rx-orange/30 px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-rx-orange text-sm shrink-0">⏳</span>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-body truncate">
            Your focus group Pro access expires in{' '}
            <span className="font-semibold text-rx-orange">
              {daysLeft === 1 ? '1 day' : `${daysLeft} days`}
            </span>
            {' '}— we'd love your feedback!
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://forms.gle/restox-feedback"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-white bg-rx-orange hover:bg-rx-orange/90 px-3 py-1.5 rounded-lg transition-colors font-body"
          >
            <MessageSquare size={12} />
            Share feedback
          </a>
          <Link
            href="/dashboard/settings?tab=billing"
            className="flex items-center gap-1 text-xs font-semibold text-rx-orange border border-rx-orange/40 hover:bg-rx-orange/10 px-3 py-1.5 rounded-lg transition-colors font-body"
          >
            Upgrade to Pro
            <ArrowRight size={12} />
          </Link>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
