'use client'

import { useState } from 'react'
import { X, Zap, Puzzle, Loader2, ShieldCheck, Clock, CheckCircle, ExternalLink } from 'lucide-react'
import { OAUTH_STATUS_BY_NAME, OAUTH_SLUG_BY_NAME } from '@/lib/retailer-oauth-meta'
import { useExtensionDetected } from '@/hooks/useExtensionDetected'

type Tab = 'oauth' | 'extension'

interface Props {
  retailer: { name: string; domain?: string }
  defaultTab?: Tab
  onClose: () => void
  onConnected: (retailerName: string) => void
}

export default function RetailerConnectModal({ retailer, onClose }: Props) {
  const oauthStatus = OAUTH_STATUS_BY_NAME[retailer.name] ?? 'none'
  const oauthSlug   = OAUTH_SLUG_BY_NAME[retailer.name] ?? null

  // If there's no OAuth at all, only the extension tab exists
  const hasOAuthTab  = oauthStatus !== 'none'
  const initialTab: Tab = hasOAuthTab ? 'oauth' : 'extension'

  const [tab, setTab]               = useState<Tab>(initialTab)
  const [oauthLoading, setOAuthLoading] = useState(false)
  const extensionDetected = useExtensionDetected()

  const retailerUrl = retailer.domain
    ? `https://${retailer.domain}`
    : `https://www.google.com/search?q=${encodeURIComponent(retailer.name)}`

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    ...(hasOAuthTab ? [{ id: 'oauth' as Tab, label: 'OAuth', icon: Zap }] : []),
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

        {/* Tabs — only rendered when there are 2+ tabs */}
        {TABS.length > 1 && (
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
                {id === 'oauth' && oauthStatus === 'coming-soon' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 leading-none">
                    SOON
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div className="px-6 py-6">
          {tab === 'oauth' && oauthStatus === 'live' && oauthSlug && (
            /* ── OAuth live ─────────────────────────────────────────────── */
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
          )}

          {tab === 'oauth' && oauthStatus === 'coming-soon' && (
            /* ── OAuth coming soon ───────────────────────────────────────── */
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Clock size={22} className="text-amber-500 dark:text-amber-400" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="font-heading font-semibold text-rx-navy dark:text-white">
                    Coming Soon
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    IN PROGRESS
                  </span>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-body">
                  We&apos;re working on a direct connection with {retailer.name}. Install the browser
                  extension to add products in the meantime.
                </p>
              </div>

              <button
                disabled
                className="w-full py-2.5 bg-rx-orange/40 text-white font-semibold
                  rounded-xl text-sm font-body flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Zap size={15} /> Authorize with {retailer.name}
              </button>

              <button
                onClick={() => setTab('extension')}
                className="text-xs text-rx-orange hover:text-rx-orange-dark font-semibold font-body transition-colors"
              >
                Use Browser Extension →
              </button>
            </div>
          )}

          {tab === 'extension' && extensionDetected === true && (
            /* ── Extension installed — usage instructions ─────────────────── */
            <div className="flex flex-col py-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500 dark:text-green-400 shrink-0" />
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 font-body">
                  Restox extension is installed
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-rx-navy dark:text-white font-body mb-3">
                  To add products from {retailer.name}:
                </p>
                <ol className="space-y-2.5">
                  {[
                    `Browse to ${retailer.domain ?? retailer.name + '.com'}`,
                    'Find a product you reorder regularly',
                    'Click the Restox button on the product page',
                    'Set your reorder frequency and save',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-rx-orange-light dark:bg-rx-orange/10 text-rx-orange text-[11px] font-bold font-body flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-body">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <a
                href={retailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
                  rounded-xl text-sm transition-colors font-body flex items-center justify-center gap-2"
              >
                Browse {retailer.name} now
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {tab === 'extension' && extensionDetected !== true && (
            /* ── Extension not detected — install prompt ─────────────────── */
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
                href="https://chrome.google.com/webstore/detail/restox"
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
