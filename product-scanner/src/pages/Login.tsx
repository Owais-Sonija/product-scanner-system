import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
      navigate('/scan')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-10 border border-white/10 shadow-2xl">
        <svg width="64" height="64" viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" strokeWidth="1.5"
          className="text-blue-500 mx-auto mb-6">
            <path d="M3 5h2M7 5h1M11 5h2M15 5h1M19 5h2
                     M3 19h2M7 19h1M11 19h2M15 19h1M19 19h2
                     M3 8v8M7 8v8M11 8v8M15 8v8M19 8v8"/>
        </svg>
        
        <h1 className="text-4xl font-bold text-white text-center">Product Scanner</h1>
        <p className="text-slate-400 text-center text-lg mt-2 mb-8">Store Management System</p>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl h-14 px-5 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="staff@store.com"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl h-14 px-5 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-lg font-semibold transition-colors duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-slate-600 text-xs text-center mt-8">
          v1.0.0 · Product Scanner System
        </p>
      </div>
    </div>
  )
}
