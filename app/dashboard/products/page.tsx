'use client'

import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import AddProductModal from '@/components/dashboard/AddProductModal'

interface Product {
  id: string
  name: string
  source: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)

  const handleAdded = (name: string) => {
    setProducts(prev => [
      ...prev,
      { id: crypto.randomUUID(), name, source: 'manual' },
    ])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-rx-navy">Products</h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            {products.length > 0
              ? `${products.length} product${products.length === 1 ? '' : 's'} in your reorder catalog`
              : 'Your reorder catalog'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
        >
          <Plus size={16} /> Add product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rx-orange-light flex items-center justify-center mb-4">
            <Package size={26} className="text-rx-orange" />
          </div>
          <h2 className="font-heading font-semibold text-rx-navy text-base mb-1">No products yet</h2>
          <p className="text-sm text-gray-400 font-body max-w-xs mb-6">
            Add the products you buy repeatedly and Restox will automate the reordering for you.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-rx-orange text-white text-sm font-semibold rounded-xl hover:bg-rx-orange-dark transition-colors font-body"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Package size={18} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-rx-navy font-body truncate">{p.name}</p>
                <button className="text-[10px] font-bold text-rx-orange hover:text-rx-orange-dark bg-rx-orange-light px-1.5 py-0.5 rounded-full transition-colors mt-1">
                  + Add schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}
