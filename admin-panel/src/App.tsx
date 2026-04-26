import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ImportCSV from './pages/ImportCSV'
import Logs from './pages/Logs'
import Locations from './pages/Locations'
import Staff from './pages/Staff'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Navigate to="/dashboard" replace />
        } />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/import" element={<ImportCSV />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/staff" element={<Staff />} />
          </Route>
        </Route>
        <Route path="*" element={
          <Navigate to="/dashboard" replace />
        } />
      </Routes>
    </BrowserRouter>
  )
}
