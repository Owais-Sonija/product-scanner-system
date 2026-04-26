import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { signIn, loading, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // If somehow already logged in and on login page
    if (isAdmin()) navigate('/dashboard')
  }, [isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await signIn(email, password)
      
      // We must check if they are an admin
      // We need to wait for state to update, or query manually
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Verification failed")
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      if (profile?.role !== 'admin') {
        // Sign out if not admin
        await supabase.auth.signOut()
        throw new Error("Access denied. Admin account required.")
      }
      
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center p-6 sm:px-12 lg:px-24">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600/20 border-2 border-blue-500/30 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <rect x="7" y="7" width="10" height="10" rx="1"></rect>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Product Scanner</h1>
          <p className="text-slate-400 text-lg font-medium">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm font-medium mb-1.5 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-14 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm font-medium mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-14 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-xl text-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
