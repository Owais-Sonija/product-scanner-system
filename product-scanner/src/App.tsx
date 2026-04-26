import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import ScanPage from './pages/ScanPage'
import ProductDetail from './pages/ProductDetail'
import RegisterProduct from './pages/RegisterProduct'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/product/:barcode" element={<ProductDetail />} />
          <Route path="/register/:barcode" element={<RegisterProduct />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
