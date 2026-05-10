'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, RefreshCw, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface AccessCode {
  id: string
  code: string
  notes: string | null
  duration_months: number
  redeemed_by: string | null
  redeemed_at: string | null
  access_expires_at: string | null
  revoked_at: string | null
  created_at: string
}

function CodeRow({ code, onRevoke }: { code: AccessCode; onRevoke: (id: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async () => {
    if (!confirm(`Revoke code ${code.code}? This will immediately revert the user's plan to Free.`)) return
    setRevoking(true)
    try {
      await fetch('/api/admin/access-codes/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_id: code.id }),
      })
      onRevoke(code.id)
    } finally {
      setRevoking(false)
    }
  }

  const status = code.revoked_at
    ? 'revoked'
    : code.redeemed_by
    ? 'redeemed'
    : 'available'

  const statusColors = {
    available: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    redeemed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    revoked: 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
  }

  return (
    <tr className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-rx-navy dark:text-white">{code.code}</code>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full font-body ${statusColors[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-body">
        {code.duration_months}mo
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-body">
        {code.notes ?? '—'}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-body">
        {code.redeemed_at
          ? new Date(code.redeemed_at).toLocaleDateString()
          : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-body">
        {code.access_expires_at
          ? new Date(code.access_expires_at).toLocaleDateString()
          : '—'}
      </td>
      <td className="px-4 py-3">
        {status !== 'revoked' && (
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors disabled:opacity-40"
            title="Revoke"
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  )
}

export default function AdminPage() {
  const supabase = createSupabaseBrowserClient()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [loading, setLoading] = useState(true)

  // Generate form state
  const [genCount, setGenCount] = useState('10')
  const [genDuration, setGenDuration] = useState('2')
  const [genNotes, setGenNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [newCodes, setNewCodes] = useState<AccessCode[]>([])
  const [copiedAll, setCopiedAll] = useState(false)
  const [genError, setGenError] = useState('')
  const [showForm, setShowForm] = useState(true)

  const loadCodes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('access_codes')
      .select('id, code, notes, duration_months, redeemed_by, redeemed_at, access_expires_at, revoked_at, created_at')
      .order('created_at', { ascending: false })
    setCodes(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsAdmin(false); return }
      const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      const admin = profile?.is_admin ?? false
      setIsAdmin(admin)
      if (admin) await loadCodes()
      else setLoading(false)
    }
    init()
  }, [supabase, loadCodes])

  const handleGenerate = async () => {
    setGenerating(true)
    setGenError('')
    setNewCodes([])
    try {
      const res = await fetch('/api/admin/access-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(genCount, 10),
          duration_months: parseInt(genDuration, 10),
          notes: genNotes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setGenError(json.error ?? 'Failed to generate codes'); return }
      setNewCodes(json.codes)
      await loadCodes()
    } catch {
      setGenError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(newCodes.map(c => c.code).join('\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleRevoke = (id: string) => {
    setCodes(prev => prev.map(c => c.id === id ? { ...c, revoked_at: new Date().toISOString() } : c))
  }

  if (isAdmin === null) return null

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={16} />
          <p className="text-sm font-body">Admin access required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-rx-navy dark:text-white">Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-body mt-1">Focus group access code management</p>
      </div>

      {/* Generate codes panel */}
      <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden">
        <button
          onClick={() => setShowForm(f => !f)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
        >
          <h2 className="font-heading font-semibold text-rx-navy dark:text-white">Generate New Codes</h2>
          {showForm ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {showForm && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-50 dark:border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-body">
                  Number of codes (max 100)
                </label>
                <input
                  type="number"
                  value={genCount}
                  onChange={e => setGenCount(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-rx-navy dark:text-white font-body focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-body">
                  Duration (months)
                </label>
                <input
                  type="number"
                  value={genDuration}
                  onChange={e => setGenDuration(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-rx-navy dark:text-white font-body focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-body">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={genNotes}
                  onChange={e => setGenNotes(e.target.value)}
                  placeholder="e.g. May 2026 cohort"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-rx-navy dark:text-white font-body placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange"
                />
              </div>
            </div>

            {genError && (
              <p className="text-xs text-red-500 font-body">{genError}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 bg-rx-orange hover:bg-rx-orange/90 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors font-heading"
            >
              {generating ? 'Generating…' : 'Generate Codes'}
            </button>

            {newCodes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 font-body">
                    {newCodes.length} code{newCodes.length !== 1 ? 's' : ''} generated
                  </p>
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1 text-xs text-rx-orange hover:text-rx-orange/80 font-semibold font-body transition-colors"
                  >
                    {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                    {copiedAll ? 'Copied!' : 'Copy all'}
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {newCodes.map(c => (
                    <p key={c.id} className="text-xs font-mono text-rx-navy dark:text-white py-0.5">{c.code}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Codes table */}
      <div className="bg-white dark:bg-[#16213E] rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-white/5">
          <h2 className="font-heading font-semibold text-rx-navy dark:text-white">
            All Codes
            {codes.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">({codes.length})</span>
            )}
          </h2>
          <button
            onClick={loadCodes}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center">
            <RefreshCw size={16} className="animate-spin text-gray-300 mx-auto" />
          </div>
        ) : codes.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400 font-body">No codes yet. Generate some above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  {['Code', 'Status', 'Duration', 'Notes', 'Redeemed', 'Expires', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 font-body uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map(code => (
                  <CodeRow key={code.id} code={code} onRevoke={handleRevoke} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
