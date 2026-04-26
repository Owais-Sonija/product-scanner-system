import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Location } from '../types'

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newLocName, setNewLocName] = useState('')
  const [newLocCode, setNewLocCode] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchLocations = async () => {
    setLoading(true)
    const { data } = await supabase.from('locations').select('*').order('name')
    if (data) setLocations(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName || !newLocCode) return
    setSaving(true)
    await supabase.from('locations').insert({ name: newLocName, code: newLocCode })
    setSaving(false)
    setShowModal(false)
    setNewLocName('')
    setNewLocCode('')
    fetchLocations()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Store Locations</h2>
          <p className="text-slate-400 text-sm">Manage store branches and their unique identifiers.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 px-5 h-11 rounded-xl text-white font-medium transition-colors flex items-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Location
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading locations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map(loc => (
            <div key={loc.id} className="bg-slate-900 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{loc.name}</h3>
                  <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-lg text-xs font-mono uppercase">
                    {loc.code}
                  </span>
                </div>
                
                <div className="text-sm text-slate-500 space-y-1">
                  <p>Added: {new Date(loc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Add New Location</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Location Name</label>
                <input
                  type="text"
                  value={newLocName}
                  onChange={e => setNewLocName(e.target.value)}
                  className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white text-base focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Downtown Branch"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm font-medium mb-1.5 block">Location Code</label>
                <input
                  type="text"
                  value={newLocCode}
                  onChange={e => setNewLocCode(e.target.value)}
                  className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white text-base focus:outline-none focus:border-blue-500 font-mono uppercase"
                  placeholder="e.g. DT-01"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 h-12 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
