import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { ConfirmationLog } from '../types'

export default function Logs() {
  const [logs, setLogs] = useState<ConfirmationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<any[]>([])
  
  // Filters
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchFilters = async () => {
    const { data } = await supabase.from('locations').select('*').order('name')
    if (data) setLocations(data)
  }

  const fetchLogs = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true)
    let query = supabase
      .from('confirmation_logs')
      .select('*, products(product_name, barcode), profiles(full_name), locations(name)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (locationFilter !== 'all') {
      query = query.eq('location_id', locationFilter)
    }
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString())
    }
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }

    const { data } = await query
    
    // Filter by search client-side (products is joined, harder to do ilike on joined in standard postgrest without explicit setup)
    if (data && search) {
      const s = search.toLowerCase()
      const filtered = data.filter((l: any) => 
        l.products?.product_name?.toLowerCase().includes(s) || 
        l.products?.barcode?.toLowerCase().includes(s)
      )
      setLogs(filtered)
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }, [locationFilter, dateFrom, dateTo, search])

  useEffect(() => {
    fetchFilters()
    fetchLogs()
    
    // Poll every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchLogs(true)
    }, 30000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchLogs])

  const clearFilters = () => {
    setSearch('')
    setLocationFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const handleExport = () => {
    if (logs.length === 0) return
    const headers = ['Product', 'Barcode', 'Location', 'Staff Member', 'Confirm 1', 'Confirm 2', 'Date']
    const csvData = logs.map(l => [
      `"${l.products?.product_name || 'Deleted Product'}"`,
      `"${l.products?.barcode || ''}"`,
      `"${l.locations?.name || ''}"`,
      `"${l.profiles?.full_name || ''}"`,
      l.confirmation_1_at ? new Date(l.confirmation_1_at).toLocaleString() : '',
      l.confirmation_2_at ? new Date(l.confirmation_2_at).toLocaleString() : '',
      new Date(l.created_at).toLocaleString()
    ])
    
    const csv = [headers.join(','), ...csvData.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `confirmation_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getDuration = (start?: string, end?: string) => {
    if (!start || !end) return '—'
    const diff = new Date(end).getTime() - new Date(start).getTime()
    if (diff < 0) return '—'
    const mins = Math.floor(diff / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/>
        </span>
        <span className="text-green-500 font-medium">Live</span>
        <span className="text-slate-500">· Updates every 30s</span>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 rounded-xl p-4 border border-white/10 flex gap-4 flex-wrap items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search product or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg h-10 px-4 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg h-10 px-4 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Locations</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg h-10 px-3 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg h-10 px-3 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
          <button onClick={clearFilters} className="text-slate-400 hover:text-white text-sm">
            Clear Filters
          </button>
        </div>
        
        <button onClick={handleExport} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 px-4 h-10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Export CSV
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 font-medium pl-6">Product</th>
                <th className="p-4 font-medium">Barcode</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Staff Member</th>
                <th className="p-4 font-medium">Confirm 1 Time</th>
                <th className="p-4 font-medium">Confirm 2 Time</th>
                <th className="p-4 font-medium text-right">Duration</th>
                <th className="p-4 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center text-slate-500">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-slate-500">No confirmation logs found matching criteria.</td></tr>
              ) : logs.map(log => {
                const confStatus = log.confirmation_1_at && log.confirmation_2_at ? 'done' 
                  : log.confirmation_1_at ? 'partial' : 'none'
                  
                return (
                  <tr key={log.id} className={`hover:bg-slate-800/30 transition-colors ${
                    confStatus === 'done' ? '' : confStatus === 'partial' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-red-500'
                  }`}>
                    <td className="p-4 font-medium text-white pl-6 max-w-[200px] truncate" title={log.products?.product_name}>
                      {log.products?.product_name || <span className="text-slate-500 italic">Deleted</span>}
                    </td>
                    <td className="p-4 font-mono text-sm text-slate-400">{log.products?.barcode || '—'}</td>
                    <td className="p-4 text-slate-300">{log.locations?.name || '—'}</td>
                    <td className="p-4 text-slate-300">{log.profiles?.full_name || '—'}</td>
                    <td className="p-4">
                      {log.confirmation_1_at ? (
                         <span className="text-slate-300 font-mono text-xs bg-slate-800 px-2 py-1 rounded">
                           {new Date(log.confirmation_1_at).toLocaleTimeString()}
                         </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="p-4">
                      {log.confirmation_2_at ? (
                         <span className="text-slate-300 font-mono text-xs bg-slate-800 px-2 py-1 rounded">
                           {new Date(log.confirmation_2_at).toLocaleTimeString()}
                         </span>
                      ) : <span className="text-yellow-500 text-xs italic">Pending</span>}
                    </td>
                    <td className="p-4 font-mono text-right text-slate-400 text-sm">
                      {getDuration(log.confirmation_1_at, log.confirmation_2_at)}
                    </td>
                    <td className="p-4 text-right text-slate-400 text-sm">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
