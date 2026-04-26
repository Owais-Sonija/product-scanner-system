import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Product } from '../types'
import { BOOLEAN_FIELDS } from '../types'
import { Footer } from '../components/Footer'
export default function ProductDetail() {
  const { barcode } = useParams<{ barcode: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [conf1, setConf1] = useState<Date | null>(null)
  const [conf2, setConf2] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false) // While not strictly needed for UI, good state practice
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadProduct() {
      if (!barcode) return
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle()
      
      if (data) {
        setProduct(data)
      } else {
        navigate('/register/' + barcode)
      }
      setLoading(false)
    }
    loadProduct()
  }, [barcode, navigate])

  const handleConfirm1 = () => {
    setConf1(new Date())
    if (navigator.vibrate) navigator.vibrate(100)
  }

  const handleConfirm2 = async () => {
    setConf2(new Date())
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    await saveConfirmationLog()
  }

  const cleanupOldLogs = async () => {
    try {
      const { count } = await supabase
        .from('confirmation_logs')
        .select('*', { count: 'exact', head: true })
      
      if (count && count > 200) {
        // Get oldest 50 log IDs
        const { data: oldLogs } = await supabase
          .from('confirmation_logs')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(50)
        
        if (oldLogs && oldLogs.length > 0) {
          const ids = oldLogs.map(l => l.id)
          await supabase
            .from('confirmation_logs')
            .delete()
            .in('id', ids)
          console.log('Cleaned up 50 old confirmation logs')
        }
      }
    } catch (err) {
      console.error('Cleanup error:', err)
    }
  }

  const saveConfirmationLog = async () => {
    if (!product || !profile) return
    setSaving(true)
    await supabase.from('confirmation_logs').insert({
      product_id: product.id,
      location_id: profile.location_id,
      staff_id: profile.id,
      confirmation_1_at: conf1?.toISOString(),
      confirmation_2_at: new Date().toISOString()
    })
    
    // Call after successful log save:
    await cleanupOldLogs()
    
    setSaving(false)
    setSaved(true)
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xl">Loading...</div>
  }

  if (!product) return null

  return (
    <div className="min-h-screen bg-slate-950">
      {/* TOP BAR */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 h-16 flex items-center gap-4">
        <button 
          onClick={() => navigate('/scan')}
          className="text-slate-400 hover:text-white transition-colors p-2 flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>
        <span className="text-white font-semibold">
          Product Details
        </span>
        <span className="text-slate-500 font-mono text-sm ml-auto">
          {barcode}
        </span>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* CARD 1 - Product Identity */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-4 py-1 text-sm font-medium mb-3">
                ✓ PRODUCT FOUND
              </span>
              <h1 className="text-3xl font-bold text-white">
                {product.product_name}
              </h1>
              <p className="text-slate-400 font-mono mt-1">
                {product.barcode}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Manufacturer', value: product.manufacturer },
              { label: 'Country', value: product.country },
              { label: 'Source', value: product.source_url, link: true },
              { label: 'Registered', value: new Date(product.created_at).toLocaleDateString() },
            ].map(item => (
              <div key={item.label}>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{item.label}</p>
                {item.link && item.value ? (
                  <a href={item.value} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm truncate block">
                    {item.value}
                  </a>
                ) : (
                  <p className="text-white text-sm">
                    {item.value || '—'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2 - Boolean Fields */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
          <p className="text-slate-400 text-xs font-mono tracking-widest mb-4">PRODUCT ATTRIBUTES</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BOOLEAN_FIELDS.map(field => {
              const value = product[field.key as keyof Product] as boolean
              return (
                <div key={field.key} className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center min-h-[100px]">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border mb-2
                  ${value 
                    ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                    : 'bg-slate-700/50 border-slate-600/30 text-slate-500'
                  }`}>
                    {value ? '✓' : '—'}
                  </div>
                  <p className="text-slate-300 text-xs text-center">{field.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CARD 3 - Confirmation */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
          <p className="text-slate-400 text-xs font-mono tracking-widest mb-4">
            STAFF CONFIRMATION REQUIRED
          </p>
          
          <div className="space-y-4">
            {/* BUTTON 1 */}
            {!conf1 ? (
              <button 
                onClick={handleConfirm1}
                className="w-full h-20 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-2xl text-xl font-bold border-2 border-blue-400/30 transition-all flex items-center justify-center gap-3 touch-manipulation"
              >
                👆 TAP TO CONFIRM RECEIPT
              </button>
            ) : (
              <div className="w-full h-20 bg-green-900/40 border-2 border-green-500/50 rounded-2xl flex flex-col items-center justify-center">
                <p className="text-green-400 font-bold text-lg">
                  ✓ RECEIPT CONFIRMED
                </p>
                <p className="text-green-600 text-sm">
                  {conf1.toLocaleTimeString()}
                </p>
              </div>
            )}
            
            {/* BUTTON 2 */}
            {!conf2 ? (
              <button 
                onClick={conf1 ? handleConfirm2 : undefined}
                disabled={!conf1}
                className={`w-full h-20 rounded-2xl text-xl font-bold border-2 transition-all flex items-center justify-center gap-3 touch-manipulation
                ${conf1
                  ? 'bg-green-600 hover:bg-green-500 text-white border-green-400/30 active:scale-[0.98]'
                  : 'bg-slate-700 text-slate-500 border-slate-600 cursor-not-allowed'
                }`}
              >
                {conf1 
                  ? '👆 TAP TO CONFIRM QUALITY CHECK'
                  : 'QUALITY CHECK — CONFIRM RECEIPT FIRST'
                }
              </button>
            ) : (
              <div className="w-full h-20 bg-green-900/40 border-2 border-green-500/50 rounded-2xl flex flex-col items-center justify-center">
                <p className="text-green-400 font-bold text-lg">
                  ✓ QUALITY CHECK CONFIRMED
                </p>
                <p className="text-green-600 text-sm">
                  {conf2.toLocaleTimeString()}
                </p>
              </div>
            )}
            
            {/* AFTER BOTH CONFIRMED */}
            {conf1 && conf2 && (
              <div className="space-y-4 pt-2">
                <div className="text-center py-4">
                  <div className="text-5xl mb-2 success-pop inline-block">✅</div>
                  <p className="text-green-400 font-bold text-lg">
                    ALL CONFIRMATIONS COMPLETE
                  </p>
                  {saving && (
                    <p className="text-slate-400 text-sm mt-1">
                      Saving...
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => navigate('/scan')}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xl font-bold transition-colors flex items-center justify-center gap-3 touch-manipulation"
                >
                  SCAN NEXT PRODUCT →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NOTES CARD */}
        {product.notes && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Notes</p>
            <p className="text-slate-300 italic">
              {product.notes}
            </p>
          </div>
        )}
        <div className="pt-4 border-t border-white/5 mt-8">
          <Footer />
        </div>
      </div>
    </div>
  )
}
