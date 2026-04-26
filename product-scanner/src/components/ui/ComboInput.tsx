import { useState, useEffect, useRef } from 'react'

interface ComboInputProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  label: string
  required?: boolean
  helperText?: string
  onCustomSave?: (value: string) => void
}

export const ComboInput = ({
  value, onChange, options, placeholder,
  label, required, helperText, onCustomSave
}: ComboInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = options.filter(o => 
    o.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (option: string) => {
    if (option === 'Other') {
      setIsCustom(true)
      onChange('')
    } else {
      setIsCustom(false)
      onChange(option)
    }
    setIsOpen(false)
    setSearch('')
  }

  if (isCustom) {
    return (
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Enter custom ${label.toLowerCase()}...`}
            className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl h-14 px-5 text-base focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => { 
              setIsCustom(false)
              if (value && onCustomSave) onCustomSave(value)
              onChange('') 
            }}
            className="h-14 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors text-sm"
          >
            ← Back
          </button>
        </div>
        {helperText && (
          <p className="text-slate-500 text-xs mt-1.5">
            {helperText}
          </p>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-slate-300 text-sm font-medium mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-800 border ${isOpen ? 'border-blue-500' : 'border-slate-700'} text-white rounded-xl h-14 px-5 text-base flex items-center justify-between cursor-pointer transition-colors hover:border-slate-500`}
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <svg 
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          
          <div className="p-2 border-b border-slate-700">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-700 text-white placeholder-slate-400 rounded-lg h-10 px-3 text-sm focus:outline-none"
              onClick={e => e.stopPropagation()}
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-slate-500 text-sm text-center">No results found</div>
            ) : (
              filtered.map(option => (
                <div
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-3 cursor-pointer text-base transition-colors ${option === value ? 'bg-blue-600 text-white' : 'text-white hover:bg-slate-700'} ${option === 'Other' ? 'border-t border-slate-700 text-blue-400' : ''}`}
                >
                  {option === 'Other' ? '+ Enter custom value' : option}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {helperText && (
        <p className="text-slate-500 text-xs mt-1.5">
          {helperText}
        </p>
      )}
    </div>
  )
}
