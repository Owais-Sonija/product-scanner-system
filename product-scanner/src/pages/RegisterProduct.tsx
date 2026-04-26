import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { 
  BOOLEAN_FIELDS, COMMON_COUNTRIES, COMMON_MANUFACTURERS,
  getCustomCountries, getCustomManufacturers,
  saveCustomCountry, saveCustomManufacturer
} from '../types'
import { Toggle } from '../components/ui/Toggle'
import { ComboInput } from '../components/ui/ComboInput'

export default function RegisterProduct() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const [formData, setFormData] = useState({
    product_name: '',
    manufacturer: '',
    country: '',
    source_url: '',
    notes: '',
    field_01: false, field_02: false, field_03: false,
    field_04: false, field_05: false, field_06: false,
    field_07: false, field_08: false, field_09: false,
    field_10: false, field_11: false, field_12: false,
    field_13: false, field_14: false, field_15: false,
    field_16: false, field_17: false, field_18: false,
    field_19: false, field_20: false, field_21: false,
    field_22: false, field_23: false, field_24: false,
    field_25: false, field_26: false, field_27: false,
    field_28: false
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [allCountries, setAllCountries] = useState<string[]>([])
  const [allManufacturers, setAllManufacturers] = useState<string[]>([])

  useEffect(() => {
    const customCountries = getCustomCountries()
    const customMfrs = getCustomManufacturers()
    
    // Merge custom values before "Other" option
    const countries = [...COMMON_COUNTRIES]
    const otherIdx = countries.indexOf('Other')
    if (otherIdx !== -1) {
      countries.splice(otherIdx, 0, ...customCountries)
    } else {
      countries.push(...customCountries)
    }
    setAllCountries(countries)
    
    const manufacturers = [...COMMON_MANUFACTURERS]
    const otherIdx2 = manufacturers.indexOf('Other')
    if (otherIdx2 !== -1) {
      manufacturers.splice(otherIdx2, 0, ...customMfrs)
    } else {
      manufacturers.push(...customMfrs)
    }
    setAllManufacturers(manufacturers)
  }, [])

  const enabledCount = BOOLEAN_FIELDS.filter(f => 
    formData[f.key as keyof typeof formData]
  ).length

  const allEnabled = enabledCount === 28
  const allDisabled = enabledCount === 0

  const handleSelectAll = () => {
    const allTrue = BOOLEAN_FIELDS.reduce((acc, field) => ({
      ...acc, [field.key]: true
    }), {})
    setFormData(prev => ({ ...prev, ...allTrue }))
  }

  const handleDeselectAll = () => {
    const allFalse = BOOLEAN_FIELDS.reduce((acc, field) => ({
      ...acc, [field.key]: false
    }), {})
    setFormData(prev => ({ ...prev, ...allFalse }))
  }

  const handleSubmit = async () => {
    if (!formData.product_name) {
      setError('Product Name is required')
      return
    }
    setLoading(true)
    setError(null)
    
    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      if (count !== null && count >= 500) {
        setError('Product database is full. Please contact your administrator.')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('products').insert({
        barcode,
        ...formData,
        location_id: profile?.location_id
      })
      if (error) throw error

      setSuccess(true)
      
      if (formData.manufacturer && 
          !COMMON_MANUFACTURERS.includes(formData.manufacturer)) {
        saveCustomManufacturer(formData.manufacturer)
      }
      if (formData.country && 
          !COMMON_COUNTRIES.includes(formData.country)) {
        saveCustomCountry(formData.country)
      }

      setTimeout(() => navigate('/scan'), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to register product')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* TOP BAR */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold flex items-center gap-2">
              Register Product
            </span>
            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
              NEW
            </span>
          </div>
        </div>
        <span className="text-slate-500 font-mono text-sm">
          {barcode}
        </span>
      </div>

      {/* CONTENT */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* WARNING CARD */}
        <div className="bg-orange-500/10 rounded-2xl p-5 border border-orange-500/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-orange-400 font-bold">
                PRODUCT NOT FOUND IN DATABASE
              </p>
              <p className="text-orange-300/70 font-mono text-lg mt-1">{barcode}</p>
              <p className="text-slate-400 text-sm mt-1">
                Complete the form below to register this product
              </p>
            </div>
          </div>
        </div>

        {/* PRODUCT INFO CARD */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
          <div className="mb-5">
            <p className="text-slate-400 text-xs font-mono tracking-widest mb-2">PRODUCT INFORMATION</p>
            <p className="text-slate-500 text-xs mb-5">
              Fields marked with 
              <span className="text-red-400 font-bold"> * </span> 
              are required
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input 
                value={formData.product_name}
                onChange={e => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                className={`w-full bg-slate-800 border ${!formData.product_name && error === 'Product Name is required' ? 'border-red-500' : 'border-slate-700'} text-white placeholder-slate-500 rounded-xl h-14 px-5 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
                placeholder="e.g. Coca-Cola 500ml, Samsung TV 55&quot;"
              />
              <p className="text-slate-500 text-xs mt-1.5">Enter the full product name as it appears on packaging</p>
            </div>

            <div>
              <ComboInput
                value={formData.manufacturer}
                onChange={val => setFormData(prev => ({
                  ...prev, manufacturer: val
                }))}
                options={allManufacturers}
                placeholder="Select or search manufacturer..."
                label="Manufacturer"
                helperText="Company or brand that produces this product"
              />
            </div>

            <div>
              <ComboInput
                value={formData.country}
                onChange={val => setFormData(prev => ({
                  ...prev, country: val
                }))}
                options={allCountries}
                placeholder="Select or search country..."
                label="Country of Origin"
                helperText="Country where this product is manufactured"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Source URL</label>
              <input 
                type="url"
                value={formData.source_url}
                onChange={e => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl h-14 px-5 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="https://example.com/product-page"
              />
              <p className="text-slate-500 text-xs mt-1.5">Link to product information page (optional)</p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Additional Notes</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl h-28 p-5 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Enter any special handling instructions, storage requirements, or other relevant information..."
              />
              <p className="text-slate-500 text-xs mt-1.5">Optional notes for staff reference</p>
            </div>
          </div>
        </div>

        {/* BOOLEAN FIELDS CARD */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <p className="text-slate-400 text-xs font-mono tracking-widest">PRODUCT ATTRIBUTES</p>
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1 text-xs font-medium">
                {enabledCount} / 28 enabled
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={allEnabled}
                className="h-9 px-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✓ All On
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                disabled={allDisabled}
                className="h-9 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-400 border border-slate-600/50 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✗ All Off
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BOOLEAN_FIELDS.map(field => {
              const isChecked = formData[field.key as keyof typeof formData] as boolean
              return (
                <div
                  key={field.key}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    [field.key]: !prev[field.key as keyof typeof prev]
                  }))}
                  className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex items-center justify-between hover:bg-slate-800 hover:border-white/10 active:bg-slate-700 transition-all select-none cursor-pointer"
                >
                  <span className="text-white text-base">
                    {field.label}
                  </span>
                  <Toggle
                    checked={isChecked}
                    onChange={() => {}} // handled by parent div
                    label={field.label}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        {success ? (
          <div className="w-full h-16 bg-green-900/40 border-2 border-green-500/50 rounded-2xl flex items-center justify-center">
            <p className="text-green-400 font-bold text-lg">
              ✓ PRODUCT REGISTERED SUCCESSFULLY
            </p>
          </div>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full h-16 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl text-xl font-bold transition-colors flex items-center justify-center gap-3 touch-manipulation mb-8"
          >
            {loading ? (
              <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'REGISTER PRODUCT'}
          </button>
        )}
      </div>
    </div>
  )
}
