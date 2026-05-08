'use client'

import { useState } from 'react'
import { X, Zap, Puzzle, KeyRound, CheckCircle, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Tab = 'oauth' | 'extension' | 'credentials'

interface Props {
  retailer: { name: string; emoji: string }
  onClose: () => void
  onConnected: (retailerName: string) => void
}

export default function RetailerConnectModal({ retailer, onClose, onConnected }: Props) {
  const [tab, setTab] = useState<Tab>('oauth')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createSupabaseBrowserClient()

  const handleCredentialSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) { setError('Username is required'); return }
    setError('')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: dbError } = await supabase.from('retailers').insert({
        user_id: user.id,
        name: retailer.name,
        connection_type: 'credentials',
        connection_status: 'connected',
      })
      if (dbError) throw dbError

      onConnected(retailer.name)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'oauth',       label: 'OAuth',            icon: Zap },
    { id: 'extension',   label: 'Browser Extension',icon: Puzzle },
    { id: 'credentials', label: 'Credentials',      icon: KeyRound },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{retailer.emoji}</span>
            <span className="font-heading font-semibold text-rx-navy">Connect {retailer.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium font-body transition-colors border-b-2
                ${tab === id
                  ? 'border-rx-orange text-rx-orange'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 py-6">
          {tab === 'oauth' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                <Zap size={22} className="text-blue-500" />
              </div>
              <p className="font-heading font-semibold text-rx-navy mb-1">OAuth Integration</p>
              <p className="text-sm text-gray-400 font-body">
                Coming Soon — OAuth integration with {retailer.name} is pending approval.
                This will be the most secure connection method.
              </p>
            </div>
          )}

          {tab === 'extension' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                <Puzzle size={22} className="text-purple-500" />
              </div>
              <p className="font-heading font-semibold text-rx-navy mb-1">Browser Extension</p>
              <p className="text-sm text-gray-400 font-body">
                Download Extension — Coming Soon. The Restox browser extension will
                automatically detect and sync your purchases from {retailer.name}.
              </p>
            </div>
          )}

          {tab === 'credentials' && (
            <form onSubmit={handleCredentialSave} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-body">
                🔒 Your credentials are encrypted in transit and never stored in plain text.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 font-body mb-1">
                  {retailer.name} username or email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-body
                    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                    placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 font-body mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-body
                    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                    placeholder:text-gray-300"
                />
              </div>
              {error && <p className="text-red-500 text-xs font-body">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
                  rounded-xl text-sm transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Connecting…</>
                  : <><CheckCircle size={15} /> Connect {retailer.name}</>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
