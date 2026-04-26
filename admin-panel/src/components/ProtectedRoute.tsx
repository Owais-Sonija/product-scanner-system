import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export const ProtectedRoute = () => {
  const { isAuthenticated, isAdmin } = useAuthStore()
  
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  
  if (!isAdmin()) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-xl font-bold">
          Access Denied
        </p>
        <p className="text-slate-400 mt-2">
          Admin privileges required
        </p>
      </div>
    </div>
  )
  return <Outlet />
}
