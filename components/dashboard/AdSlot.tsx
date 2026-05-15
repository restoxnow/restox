'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useUserTier } from '@/contexts/UserContext'

// ---------------------------------------------------------------------------
// AdSlot — renders real AdSense units for free-tier users only.
// Paid users (Consumer and above) and admins see nothing.
// ---------------------------------------------------------------------------

const AD_CLIENT = 'ca-pub-5385038600205472'

// Maps logical slot names to AdSense data-ad-slot IDs
const SLOT_IDS: Record<string, string> = {
  'dashboard':  '9606669535',
  'ai-preview': '7135584712',
  'schedules':  '1979689866',
  'products':   '5013652552',
}

type AdFormat = 'banner' | 'rectangle' | 'video'

interface Props {
  slot: string
  format?: AdFormat
  className?: string
  videoLabel?: string
  // Legacy — ignored; slot name now determines the AdSense slot ID
  adClient?: string
  adSlot?: string
}

export default function AdSlot({ slot, format = 'rectangle', className = '', videoLabel }: Props) {
  const { isConsumerOrAbove } = useUserTier()
  const pushed = useRef(false)

  // Push to adsbygoogle once per mount, but only for free-tier users
  useEffect(() => {
    if (isConsumerOrAbove || pushed.current) return
    pushed.current = true
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).adsbygoogle.push({})
    } catch {
      // AdSense script may not have loaded yet — silently skip
    }
  }, [isConsumerOrAbove])

  // Paid users and admins are ad-free
  if (isConsumerOrAbove) return null

  const adSlotId = SLOT_IDS[slot] ?? SLOT_IDS['dashboard']

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      {format === 'video' && videoLabel && (
        <p className="text-xs text-gray-400 dark:text-gray-500 font-body">{videoLabel}</p>
      )}

      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={adSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />

      {/* Upgrade nudge shown below the ad */}
      <p className="text-[10px] text-gray-300 dark:text-white/20 font-body">
        Remove ads —{' '}
        <Link
          href="/dashboard/settings?tab=billing"
          className="underline hover:text-gray-400 dark:hover:text-white/40 transition-colors"
        >
          upgrade to Consumer plan
        </Link>
      </p>
    </div>
  )
}
