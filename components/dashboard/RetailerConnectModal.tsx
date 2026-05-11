'use client'

import { useState } from 'react'
import { X, Zap, Puzzle, CheckCircle, Loader2, ShieldCheck } from 'lucide-react'

// Retailers that have an OAuth flow at /api/retailers/oauth/[slug]
// Keep in sync with OAUTH_CONFIGS in lib/retailer-oauth.ts
const OAUTH_SLUGS: Record<string, string> = {
  'Amazon':      'amazon',
  'Walmart':     'walmart',
  'Target':      'target',
  'Kroger':      'kroger',
  'Instacart':   'instacart',
  'Albertsons':  'albertsons',
  'Stop & Shop': 'stopandshop',
  'Wegmans':     'wegmans',
  'Sephora':     'sephora',
  'Chewy':       'chewy',
  'Home Depot':  'homedepot',
}

type Tab = 'oauth' | 'extension'

interface Props {
  retailer: { name: string; domain?: string }
  defaultTab?: Tab
  onClose: () => void
  onConnected: (retailerName: string) => void
}

export default function RetailerConnectModal({ retailer, defaultTab = 'oauth', onClose }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [oauthLoading, setOAuthLoading] = useState(false)

  const oauthSlug = OAUTH_SLUGS[retailer.name] ?? null

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'oauth',     label: 'OAuth',             icon: Zap },
    { id: 'extension', label: 'Browser Extension', icon: Puzzle },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16213E] rounded-2xl w-full max-w-md shadow-2xl dark:shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rx-orange-light dark:bg-rx-orange/10 flex items-center justify-center text-sm font-bold font-heading text-rx-orange">
              {retailer.name[0]}
            </div>
            <span className="font-heading font-semibold text-rx-navy dark:text-white">Connect {retailer.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-white/10">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium font-body transition-colors border-b-2
                ${tab === id
                  ? 'border-rx-orange text-rx-orange'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 py-6">
          {tab === 'oauth' && (
            oauthSlug ? (
              /* ── OAuth supported ────────────────────────────────────────── */
              <div className="flex flex-col items-center text-center py-4 gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Zap size={22} className="text-blue-500 dark:text-blue-400" />
                </div>

                <div>
                  <p className="font-heading font-semibold text-rx-navy dark:text-white mb-1">
                    Connect with {retailer.name}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-body">
                    You&apos;ll be redirected to {retailer.name} to authorize Restox.
                    Restox never stores your login credentials — only a secure OAuth token.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setOAuthLoading(true)
                    window.location.href = `/api/retailers/oauth/${oauthSlug}`
                  }}
                  disabled={oauthLoading}
                  className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
                    rounded-xl text-sm transition-colors font-body flex items-center justify-center gap-2
                    disabled:opacity-60"
                >
                  {oauthLoading ? (
                    <><Loader2 size={15} className="animate-spin" /> Redirecting to {retailer.name}…</>
                  ) : (
                    <><Zap size={15} /> Authorize with {retailer.name}</>
                  )}
                </button>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-body">
                  <ShieldCheck size={12} className="text-green-500 shrink-0" />
                  Secured with OAuth 2.0 + PKCE — Restox never sees your password
                </div>
              </div>
            ) : (
              /* ── OAuth not yet available ─────────────────────────────────── */
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Zap size={22} className="text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-rx-navy dark:text-white mb-1">
                    OAuth Not Available
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-body">
                    {retailer.name} does not offer a public OAuth API yet.
                    Use the <strong>Browser Extension</strong> tab to detect and add products from this retailer.
                  </p>
                </div>
                <button
                  onClick={() => setTab('extension')}
                  className="text-xs text-rx-orange hover:text-rx-orange-dark font-semibold font-body transition-colors"
                >
                  Use Browser Extension →
                </button>
              </div>
            )
          )}

          {tab === 'extension' && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <Puzzle size={22} className="text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-heading font-semibold text-rx-navy dark:text-white mb-1">Restox Browser Extension</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-body">
                  The Restox browser extension lets you add products from any supported retailer with one click.
                </p>
              </div>
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
                  rounded-xl text-sm transition-colors font-body text-center"
              >
                Add to Chrome — It&apos;s Free
              </a>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body">Also works with Microsoft Edge</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-body">
                Already installed?{' '}
                <button
                  onClick={onClose}
                  className="text-rx-orange hover:text-rx-orange-dark font-semibold transition-colors"
                >
                  Refresh this page
                </button>
                {' '}and the extension will connect automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
