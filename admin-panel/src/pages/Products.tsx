import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'
import { BOOLEAN_FIELDS } from '../types'

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 20
  const [locations, setLocations] = useState<any[]>([])

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  
  // Delete confirm
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  useEffect(() => {
    supabase.from('locations').select('*').then(({data}) => setLocations(data || []))
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase.from('products').select('*, locations(name)', { count: 'exact' })
    
    if (search) {
      query = query.or(`barcode.ilike.%${search}%,product_name.ilike.%${search}%,manufacturer.ilike.%${search}%`)
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)
      
    const { data, count } = await query
    if (data) setProducts(data)
    if (count !== null) setTotalCount(count)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, page])

  const handleEdit = (p: any) => {
    setSelectedProduct({...p})
    setIsEditMode(true)
    setShowModal(true)
  }

  const handleView = (p: any) => {
    setSelectedProduct({...p})
    setIsEditMode(false)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    await supabase.from('products').delete().eq('id', productToDelete.id)
    setProductToDelete(null)
    fetchProducts()
  }

  const handleSaveModal = async () => {
    if (!selectedProduct) return
    const { id, locations: _, created_at, updated_at, count, ...updateData } = selectedProduct as any
    await supabase.from('products').update(updateData).eq('id', id)
    setShowModal(false)
    fetchProducts()
  }

  const countEnabled = (p: any) => Object.keys(p).filter(k => k.startsWith('field_') && p[k] === true).length

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Products Setup</h2>
          <span className="text-slate-400 text-sm mt-1 block">Manage the product catalog and attributes</span>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              placeholder="Search barcode, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl h-11 pl-10 pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
          </div>
          <div className="bg-slate-800 text-slate-300 px-4 h-11 rounded-xl flex items-center border border-slate-700 flex-shrink-0 font-medium">
            Total DB: {totalCount}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-white/10 flex flex-col min-h-[600px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="p-4 font-medium pl-6">Barcode</th>
                <th className="p-4 font-medium">Product Name</th>
                <th className="p-4 font-medium">Manufacturer</th>
                <th className="p-4 font-medium">Country</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium text-center">Attributes Enabled</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center text-slate-500">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-slate-500">No products found.</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="p-4 pl-6 font-mono text-sm text-slate-300">{p.barcode}</td>
                  <td className="p-4 font-medium text-white max-w-[250px] truncate" title={p.product_name}>{p.product_name}</td>
                  <td className="p-4 text-slate-400">{p.manufacturer || '—'}</td>
                  <td className="p-4 text-slate-400">{p.country || '—'}</td>
                  <td className="p-4 text-slate-400">{p.locations?.name || '—'}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {countEnabled(p)} / 28
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-4 pr-6">
                    <div className="flex justify-end gap-2 opacity-100 lg:opacity-50 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleView(p)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors" title="View">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                      <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 flex items-center justify-center transition-colors" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => setProductToDelete(p)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center transition-colors" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-white/10 bg-slate-900 flex items-center justify-between rounded-b-2xl">
          <p className="text-slate-400 text-sm">
            Showing <span className="text-white font-medium">{Math.min(totalCount, page * pageSize + 1)}</span> to <span className="text-white font-medium">{Math.min(totalCount, (page + 1) * pageSize)}</span> of <span className="text-white font-medium">{totalCount}</span> products
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))} 
              disabled={page === 0}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={(page + 1) * pageSize >= totalCount}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white">Delete Product?</h3>
            </div>
            <p className="text-slate-400 mb-6">
              This will permanently delete <span className="text-white font-medium">{productToDelete.product_name}</span> ({productToDelete.barcode}) and automatically cascade delete all related confirmation logs. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setProductToDelete(null)} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20">Delete Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal View / Edit */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950/50">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {isEditMode ? 'Edit Product' : 'View Product Details'}
                </h3>
                <p className="text-slate-400 font-mono text-sm">{selectedProduct.barcode}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">General Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block uppercase tracking-wider">Product Name</label>
                    <input 
                      type="text" 
                      value={selectedProduct.product_name} 
                      onChange={e => setSelectedProduct({...selectedProduct, product_name: e.target.value})}
                      disabled={!isEditMode}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl h-12 px-4 focus:outline-none focus:border-blue-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block uppercase tracking-wider">Manufacturer</label>
                    <input 
                      type="text" 
                      value={selectedProduct.manufacturer || ''} 
                      onChange={e => setSelectedProduct({...selectedProduct, manufacturer: e.target.value})}
                      disabled={!isEditMode}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl h-12 px-4 focus:outline-none focus:border-blue-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block uppercase tracking-wider">Country</label>
                    <input 
                      type="text" 
                      value={selectedProduct.country || ''} 
                      onChange={e => setSelectedProduct({...selectedProduct, country: e.target.value})}
                      disabled={!isEditMode}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl h-12 px-4 focus:outline-none focus:border-blue-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block uppercase tracking-wider">Source URL</label>
                    <input 
                      type="text" 
                      value={selectedProduct.source_url || ''} 
                      onChange={e => setSelectedProduct({...selectedProduct, source_url: e.target.value})}
                      disabled={!isEditMode}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl h-12 px-4 focus:outline-none focus:border-blue-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block uppercase tracking-wider">Assigned Location</label>
                    <select
                      value={selectedProduct.location_id || ''}
                      onChange={e => setSelectedProduct({...selectedProduct, location_id: e.target.value})}
                      disabled={!isEditMode}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl h-12 px-4 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:appearance-none pr-8"
                    >
                      <option value="">Global / Unassigned</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block uppercase tracking-wider">Notes</label>
                    <textarea 
                      value={selectedProduct.notes || ''} 
                      onChange={e => setSelectedProduct({...selectedProduct, notes: e.target.value})}
                      disabled={!isEditMode}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-4 focus:outline-none focus:border-blue-500 disabled:opacity-70 min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-2">Product Attributes</h4>
                  <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1 text-xs font-medium">
                    {countEnabled(selectedProduct)} / 28 enabled
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {BOOLEAN_FIELDS.map(f => {
                    const isChecked = selectedProduct[f.key as keyof Product] as boolean
                    return (
                      <div 
                        key={f.key} 
                        onClick={() => isEditMode && setSelectedProduct(prev => ({...prev, [f.key]: !isChecked}))}
                        className={`flex items-center justify-between p-3 rounded-xl border ${isChecked ? 'bg-slate-800 border-blue-500/30' : 'bg-slate-900 border-slate-800'} ${isEditMode ? 'cursor-pointer hover:bg-slate-800' : ''} transition-colors`}
                      >
                        <span className={`text-sm ${isChecked ? 'text-white' : 'text-slate-500'}`}>{f.label}</span>
                        <div className={`w-8 h-5 rounded-full relative transition-colors ${isChecked ? 'bg-blue-600' : 'bg-slate-700'} ${!isEditMode && 'opacity-70'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isChecked ? 'translate-x-3' : ''}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-white/10 bg-slate-950/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-6 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                {isEditMode ? 'Cancel' : 'Close'}
              </button>
              {isEditMode && (
                <button 
                  onClick={handleSaveModal} 
                  className="px-6 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
