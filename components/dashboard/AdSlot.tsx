'use client'

import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'

type AdFormat = 'banner' | 'rectangle' | 'video'

interface Props {
  slot: string
  format: AdFormat
  adClient?: string
  adSlot?: string
  className?: string
  videoLabel?: string
}

const FORMAT_SIZE: Record<AdFormat, { width: number; height: number; label: string }> = {
  banner:    { width: 728, height: 90,  label: '728×90' },
  rectangle: { width: 300, height: 250, label: '300×250' },
  video:     { width: 480, height: 270, label: '480×270' },
}

export default function AdSlot({ slot, format, adClient, adSlot, className = '', videoLabel }: Props) {
  const { hasProAccess } = useUser()

  // Only show ads to free-tier users (not Pro or admin)
  if (hasProAccess) return null

  const { width, height, label } = FORMAT_SIZE[format]

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      {format === 'video' && videoLabel && (
        <p className="text-xs text-gray-400 dark:text-gray-500 font-body">{videoLabel}</p>
      )}

      {/* AdSense slot — swap placeholder div for <ins> once approved */}
      <div
        style={{ width, height, maxWidth: '100%' }}
        className="relative bg-gray-100 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-lg flex flex-col items-center justify-center overflow-hidden"
        data-ad-slot={slot}
        data-ad-client={adClient}
        data-ad-adsense-slot={adSlot}
      >
        {/* Placeholder content — remove when real AdSense <ins> tags go in */}
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 dark:text-white/20 font-body select-none">
          Advertisement
        </span>
        <span className="text-[9px] text-gray-200 dark:text-white/10 font-body select-none mt-0.5">{label}</span>
      </div>

      {/* Upgrade nudge */}
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
