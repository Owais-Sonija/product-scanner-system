import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { BarcodeScanner } from '../lib/scanner'
import { supabase } from '../lib/supabase'
import { Footer } from '../components/Footer'

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<BarcodeScanner | null>(null)
  const [scanning, setScanning] = useState(true)
  const [manualBarcode, setManualBarcode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    scannerRef.current = new BarcodeScanner()
    if (videoRef.current) {
      scannerRef.current.startScanning(
        videoRef.current,
        handleBarcodeScan,
        (err) => setError(err.message)
      )
    }

    return () => {
      scannerRef.current?.stopScanning()
    }
  }, [])

  const handleBarcodeScan = async (barcode: string) => {
    if (lastScanned === barcode) return // prevent duplicate
    setLastScanned(barcode)
    setScanning(false)
    if (navigator.vibrate) navigator.vibrate(200)
    
    // Play beep
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 1000
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(
        0.001, ctx.currentTime + 0.1
      )
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    } catch (e) {
      // Audio context might fail if no user interaction
    }
    
    try {
      // Query Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle()  // returns null instead of error if not found
      
      if (data) {
        navigate('/product/' + encodeURIComponent(barcode))
      } else {
        navigate('/register/' + encodeURIComponent(barcode))
      }
    } catch (e) {
      navigate('/register/' + encodeURIComponent(barcode))
    }
  }

  const handleManualSearch = () => {
    const trimmed = manualBarcode.trim()
    if (!trimmed) return
    if (trimmed.length < 3) {
      setError('Please enter at least 3 characters')
      return
    }
    handleBarcodeScan(trimmed)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* TOP BAR (h-16 fixed) */}
      <div className="flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10 h-16 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white font-medium text-sm">
            {(profile as any)?.locations?.name ?? 'Store'}
          </span>
        </div>
        
        <span className="text-blue-400 font-mono text-xs tracking-widest">SCANNER</span>
        
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">
            {profile?.full_name}
          </span>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors p-2 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* CAMERA AREA (flex-1) */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          autoPlay 
          playsInline 
          muted 
        />
        
        {/* OVERLAY */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent to-slate-950/70" />
          
          {/* Scan window (280x280) */}
          <div className="relative w-[280px] h-[280px]">
            {/* Top-left */}
            <div className="absolute top-0 left-0">
              <div className="w-8 h-1 bg-blue-500 corner-pulse"/>
              <div className="w-1 h-8 bg-blue-500 corner-pulse"/>
            </div>
            {/* Top-right */}
            <div className="absolute top-0 right-0">
              <div className="w-8 h-1 bg-blue-500 right-0 absolute corner-pulse"/>
              <div className="w-1 h-8 bg-blue-500 right-0 absolute corner-pulse"/>
            </div>
            {/* Bottom-left */}
            <div className="absolute bottom-0 left-0">
              <div className="w-8 h-1 bg-blue-500 bottom-0 absolute corner-pulse"/>
              <div className="w-1 h-8 bg-blue-500 bottom-0 absolute corner-pulse"/>
            </div>
            {/* Bottom-right */}
            <div className="absolute bottom-0 right-0">
              <div className="w-8 h-1 bg-blue-500 bottom-0 right-0 absolute corner-pulse"/>
              <div className="w-1 h-8 bg-blue-500 bottom-0 right-0 absolute corner-pulse"/>
            </div>
            
            {/* Scan line */}
            {scanning && (
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent scan-line" />
            )}
          </div>
          
          <p className="text-blue-400 font-mono text-xs tracking-widest mt-6 z-20">
            ALIGN BARCODE WITHIN FRAME
          </p>
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <div className="bg-slate-900/90 backdrop-blur-md border-t border-white/10 p-4 flex-shrink-0 z-20">
        <p className="text-slate-500 text-xs mb-2 font-mono tracking-wider">MANUAL ENTRY</p>
        
        <div className="flex gap-3">
          <input
            value={manualBarcode}
            onChange={e => setManualBarcode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="Enter barcode manually..."
            className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl h-12 px-4 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleManualSearch}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-12 rounded-xl font-semibold transition-colors"
          >
            Search
          </button>
        </div>
        
        {error && (
          <p className="text-red-400 text-sm mt-2 text-center">
            {error}
          </p>
        )}
        <div className="mt-4">
          <Footer />
        </div>
      </div>
    </div>
  )
}
