import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { ConfirmationLog } from '../types'

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    confirmations: 0,
    todayConfirmations: 0,
    locations: 0,
    staff: 0,
    pending: 0
  })
  
  const [recentLogs, setRecentLogs] = useState<ConfirmationLog[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      const prodRes = await supabase.from('products').select('*', { count: 'exact', head: true })
      if (prodRes.error) {
        console.error('Query error:', prodRes.error.message)
        return
      }

      const logRes = await supabase.from('confirmation_logs').select('*', { count: 'exact', head: true })
      if (logRes.error) {
        console.error('Query error:', logRes.error.message)
        return
      }

      const locRes = await supabase.from('locations').select('*', { count: 'exact', head: true })
      if (locRes.error) {
        console.error('Query error:', locRes.error.message)
        return
      }

      const staffRes = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'staff')
      if (staffRes.error) {
        console.error('Query error:', staffRes.error.message)
        return
      }

      // Today's confirmations
      const startOfDay = new Date()
      startOfDay.setHours(0,0,0,0)
      const todayRes = await supabase
        .from('confirmation_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString())
      if (todayRes.error) {
        console.error('Query error:', todayRes.error.message)
        return
      }

      // Pending confirmations (has confirm 1 but missing confirm 2)
      const pendingRes = await supabase
        .from('confirmation_logs')
        .select('*', { count: 'exact', head: true })
        .not('confirmation_1_at', 'is', null)
        .is('confirmation_2_at', null)
      if (pendingRes.error) {
        console.error('Query error:', pendingRes.error.message)
        return
      }

      setStats({
        products: prodRes.count || 0,
        confirmations: logRes.count || 0,
        todayConfirmations: todayRes.count || 0,
        locations: locRes.count || 0,
        staff: staffRes.count || 0,
        pending: pendingRes.count || 0
      })

      // Fetch recent logs
      const recentLogsRes = await supabase
        .from('confirmation_logs')
        .select(`
          *,
          products(product_name, barcode),
          locations(name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
        
      if (recentLogsRes.error) {
        console.error('Query error:', recentLogsRes.error.message)
        return
      }
        
      if (recentLogsRes.data) setRecentLogs(recentLogsRes.data)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    // Poll every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchDashboardData()
    }, 30000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchDashboardData])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading dashboard...</div>
  }

  const statCards = [
    { label: 'Total Products', value: stats.products, color: 'text-blue-400', icon: '📦' },
    { label: 'Total Confirmations', value: stats.confirmations, color: 'text-green-400', icon: '✓' },
    { label: "Today's Confirmations", value: stats.todayConfirmations, color: 'text-purple-400', icon: '📅' },
    { label: 'Locations', value: stats.locations, color: 'text-orange-400', icon: '📍' },
    { label: 'Staff Users', value: stats.staff, color: 'text-cyan-400', icon: '👥' },
    { label: 'Pending Checks', value: stats.pending, color: 'text-yellow-400', icon: '⏳' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/>
        </span>
        <span className="text-green-500 font-medium">Live</span>
        <span className="text-slate-500">· Updates every 30s</span>
      </div>

      {stats.products > 400 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 mb-6">
          <span className="text-amber-400 text-xl">⚠️</span>
          <div>
            <p className="text-amber-400 font-semibold">
              Approaching Product Limit
            </p>
            <p className="text-amber-300/70 text-sm">
              {stats.products}/500 products used on free tier. 
              Consider deleting unused products.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((c, i) => (
          <div key={i} className="bg-slate-900 rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-5 group-hover:scale-110 transition-transform">
              {c.icon}
            </div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className={`text-4xl font-bold ${c.color} mb-1 drop-shadow-sm`}>{c.value}</p>
                <p className="text-slate-400 text-sm font-medium">{c.label}</p>
              </div>
              <div className="text-2xl opacity-50">{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Recent Confirmations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Product / Barcode</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Confirm 1</th>
                <th className="p-4 font-medium">Confirm 2</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentLogs.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No logs found.</td></tr>
              ) : recentLogs.map((log, i) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <p className="text-white font-medium">{log.products?.product_name || 'Deleted Product'}</p>
                    <p className="text-slate-500 font-mono text-xs mt-0.5">{log.products?.barcode || '—'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300">{log.locations?.name || 'Unknown'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{log.locations?.code || '—'}</p>
                  </td>
                  <td className="p-4">
                    {log.confirmation_1_at ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {new Date(log.confirmation_1_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="p-4">
                    {log.confirmation_2_at ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {new Date(log.confirmation_2_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                      </span>
                    ) : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs border border-yellow-500/20">
                      Pending
                    </span>}
                  </td>
                  <td className="p-4 text-slate-400 text-sm">
                    {new Date(log.created_at).toLocaleDateString()}
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
