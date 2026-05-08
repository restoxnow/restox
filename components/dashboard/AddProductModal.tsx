'use client'

import { useState } from 'react'
import { X, Search, ExternalLink, Package, Loader2, CheckCircle, Store } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Method = 'search' | 'url' | 'history'

const MOCK_SEARCH_RESULTS = [
  { name: 'Dawn Ultra Dish Soap 90oz', retailer: 'Amazon', category: 'Cleaning' },
  { name: 'Dawn Powerwash Spray 16oz', retailer: 'Walmart', category: 'Cleaning' },
  { name: 'Dawn EZ-Squeeze 28oz', retailer: 'Target', category: 'Cleaning' },
]

interface Props {
  onClose: () => void
  onAdded: (name: string) => void
}

export default function AddProductModal({ onClose, onAdded }: Props) {
  const [method, setMethod] = useState<Method>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<typeof MOCK_SEARCH_RESULTS>([])
  const [productUrl, setProductUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createSupabaseBrowserClient()

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    // Mock search — returns filtered results based on query
    setSearchResults(
      MOCK_SEARCH_RESULTS.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchQuery.toLowerCase().includes('dawn')
      ).length > 0
        ? MOCK_SEARCH_RESULTS
        : []
    )
  }

  const handleAddFromSearch = async (result: typeof MOCK_SEARCH_RESULTS[0]) => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: dbError } = await supabase.from('products').insert({
        user_id: user.id,
        name: result.name,
        category: result.category,
        reorder_quantity: 1,
      })
      if (dbError) throw dbError
      onAdded(result.name)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFromUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productUrl.trim()) { setError('Please enter a product URL'); return }
    setError('')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Parse a product name from the URL path as a best-effort label
      let parsedName = 'Product from URL'
      try {
        const url = new URL(productUrl)
        const segments = url.pathname.split('/').filter(Boolean)
        if (segments.length > 0) {
          parsedName = segments[segments.length - 1]
            .replace(/[-_]/g, ' ')
            .replace(/\.\w+$/, '')
            .slice(0, 80)
        }
      } catch {}

      const { error: dbError } = await supabase.from('products').insert({
        user_id: user.id,
        name: parsedName,
        product_url: productUrl.trim(),
        reorder_quantity: 1,
      })
      if (dbError) throw dbError
      onAdded(parsedName)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const TABS: { id: Method; label: string; icon: React.ElementType }[] = [
    { id: 'search',  label: 'Search',       icon: Search },
    { id: 'url',     label: 'Paste URL',    icon: ExternalLink },
    { id: 'history', label: 'From History', icon: Package },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-heading font-semibold text-rx-navy">Add a Product</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setMethod(id); setError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium font-body transition-colors border-b-2
                ${method === id
                  ? 'border-rx-orange text-rx-orange'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          {/* Search tab */}
          {method === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for a product…"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-body
                      focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                      placeholder:text-gray-300"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2.5 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
                >
                  Search
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {searchResults.map(r => (
                    <div key={r.name} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-rx-navy font-body truncate">{r.name}</p>
                        <p className="text-xs text-gray-400 font-body">{r.retailer} · {r.category}</p>
                      </div>
                      <button
                        onClick={() => handleAddFromSearch(r)}
                        disabled={loading}
                        className="shrink-0 px-3 py-1.5 bg-rx-orange text-white text-xs font-bold rounded-lg hover:bg-rx-orange-dark transition-colors font-body disabled:opacity-60"
                      >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && (
                <p className="text-sm text-gray-400 font-body text-center py-4">
                  No results found. Try a different search term.
                </p>
              )}

              {error && <p className="text-red-500 text-xs font-body">{error}</p>}
              <p className="text-xs text-gray-400 font-body text-center">
                Showing sample results — full product search coming soon.
              </p>
            </div>
          )}

          {/* URL tab */}
          {method === 'url' && (
            <form onSubmit={handleAddFromUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 font-body mb-1">
                  Product URL
                </label>
                <input
                  type="url"
                  value={productUrl}
                  onChange={e => setProductUrl(e.target.value)}
                  placeholder="https://amazon.com/dp/..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-body
                    focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                    placeholder:text-gray-300"
                />
                <p className="text-xs text-gray-400 font-body mt-1.5">
                  Paste any product link from Amazon, Walmart, Target, and more.
                </p>
              </div>
              {error && <p className="text-red-500 text-xs font-body">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
                  rounded-xl text-sm transition-colors font-body disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Adding…</>
                  : <><CheckCircle size={15} /> Add Product</>
                }
              </button>
            </form>
          )}

          {/* History tab */}
          {method === 'history' && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Store size={22} className="text-gray-400" />
              </div>
              <p className="font-heading font-semibold text-rx-navy mb-1">No purchase history yet</p>
              <p className="text-sm text-gray-400 font-body max-w-xs">
                Connect a retailer to see your purchase history and add repeat purchases with one click.
              </p>
              <a
                href="/dashboard/retailers"
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
              >
                Connect a retailer
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
