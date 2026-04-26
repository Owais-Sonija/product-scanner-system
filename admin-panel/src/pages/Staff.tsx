import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Location } from '../types'

export default function Staff() {
  const [staff, setStaff] = useState<(Profile & { locations: Location | null })[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  // If no staff showing, run this SQL in Supabase:
  // DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
  // CREATE POLICY "admin_read_all_profiles" ON profiles
  // FOR SELECT TO authenticated
  // USING (true);

  useEffect(() => {
    const fetchStaffAndLocations = async () => {
      setLoading(true)
      try {
        const locRes = await supabase.from('locations').select('*').order('name')
        if (locRes.data) setLocations(locRes.data)

        // First get all profiles with role staff OR admin
        const { data, error } = await supabase
          .from('profiles')
          .select('*, locations(name, code)')
          .order('full_name')
        
        console.log('All profiles:', data, 'Error:', error)
        
        if (error) {
          console.error('Staff fetch error:', error)
          setLoading(false)
          return
        }
        
        // Filter staff only (role = 'staff')
        const staffOnly = (data ?? []).filter(p => 
          p.role === 'staff'
        )
        setStaff(staffOnly as any)
      } catch (err) {
        console.error('Staff error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStaffAndLocations()
  }, [])

  const handleAssignLocation = async (staffId: string, locationId: string) => {
    // Optimistic update
    setStaff(prev => prev.map(s => s.id === staffId ? { 
      ...s, 
      location_id: locationId, 
      locations: locations.find(l => l.id === locationId) || null 
    } : s))

    await supabase.from('profiles').update({ location_id: locationId }).eq('id', staffId)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Staff Management</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            To add new staff members, you must first create their user account in the <span className="text-slate-300 font-medium">Supabase Auth Dashboard</span>. Once authenticated, their profile will automatically appear here where you can assign them to a specific branch location.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-5 font-medium">Staff Member</th>
                <th className="p-5 font-medium">Assigned Location</th>
                <th className="p-5 font-medium text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={3} className="p-8 text-center text-slate-500">Loading staff...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-slate-500">No staff members found.</td></tr>
              ) : staff.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                        {s.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{s.full_name || 'Unnamed'}</p>
                        <p className="text-slate-500 text-xs mt-0.5 font-mono">{s.id.slice(0,8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <select
                      value={s.location_id || ''}
                      onChange={(e) => handleAssignLocation(s.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[250px] cursor-pointer"
                    >
                      <option value="">Unassigned (Select Location)</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-5 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      Standard Staff
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
