import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'

export default function ImportCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [summary, setSummary] = useState({ total: 0, valid: 0, errors: 0, duplicates: 0 })
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ imported: number, failed: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const headers = [
      'barcode', 'product_name', 'manufacturer', 'source_url', 'country', 'notes',
      ...Array.from({length: 28}, (_, i) => `field_${String(i+1).padStart(2,'0')}`)
    ]
    const example = [
      '1234567890123', 'Example Product', 'Example Manufacturer', 'https://example.com',
      'USA', 'Sample notes',
      ...Array(28).fill('FALSE')
    ]
    const csv = [headers, example].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseFile = (fileToParse: File) => {
    setFile(fileToParse)
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let valid = 0, errors = 0, duplicates = 0
        const dataWithMeta = results.data.map((row: any, idx) => {
          const r: any = { ...row, _origRowId: idx + 2, status: 'valid', errorMsgs: [] }
          if (!r.barcode?.trim()) { r.status = 'error'; r.errorMsgs.push('Missing barcode') }
          if (!r.product_name?.trim()) { r.status = 'error'; r.errorMsgs.push('Missing product_name') }
          
          for(let i=1; i<=28; i++){
            const f = `field_${String(i).padStart(2,'0')}`
            const val = r[f]?.toUpperCase()
            if (val && val !== 'TRUE' && val !== 'FALSE') {
              r.status = 'error'
              r.errorMsgs.push(`Invalid boolean value in ${f}`)
            }
          }
          if (r.status === 'valid') valid++
          if (r.status === 'error') errors++
          return r
        })

        // Simple duplicate UI check (doesn't check DB yet to save time, but will conflict on import)
        // For a true robust system, we would batch check barcodes
        
        setParsedData(dataWithMeta)
        setSummary({ total: dataWithMeta.length, valid, errors, duplicates })
      }
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0]
      if (f.name.endsWith('.csv')) parseFile(f)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setProgress(0)
    setImportError(null)
    
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    if (count !== null && count >= 500) {
      setImportError('Product limit reached (500 max on free tier). Please delete some products before importing.')
      setImporting(false)
      return
    }
    
    const validRows = parsedData.filter(r => r.status === 'valid')
    
    if (count !== null && count + validRows.length > 500) {
      setImportError(`Importing ${validRows.length} products would exceed the 500 product limit. Currently: ${count}/500. You can import max ${500 - count} products.`)
      setImporting(false)
      return
    }

    const batchSize = 50
    let imported = 0
    let failed = 0
    
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize)
      const records = batch.map(row => {
        const record: any = {
          barcode: row.barcode.trim(),
          product_name: row.product_name.trim(),
          manufacturer: row.manufacturer?.trim() || null,
          source_url: row.source_url?.trim() || null,
          country: row.country?.trim() || null,
          notes: row.notes?.trim() || null,
        }
        for(let j=1; j<=28; j++) {
          const k = `field_${String(j).padStart(2,'0')}`
          record[k] = row[k]?.toUpperCase() === 'TRUE'
        }
        return record
      })
      
      const { error } = await supabase
        .from('products')
        .upsert(records, { onConflict: 'barcode', ignoreDuplicates: false })
      
      if (error) {
        failed += batch.length
        console.error("Batch error", error)
      } else {
        imported += batch.length
      }
      setProgress(Math.round((i + batchSize) / validRows.length * 100))
    }
    
    setImporting(false)
    setImportResult({ imported, failed })
  }

  const resetAll = () => {
    setFile(null)
    setParsedData([])
    setImportResult(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Step 1 */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Step 1 — Download CSV Template</h3>
            <p className="text-slate-400 text-sm">Download this template, fill it in Google Sheets or Excel, then export as CSV and upload below.</p>
          </div>
          <button onClick={downloadTemplate} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Template
          </button>
        </div>
        <div className="bg-slate-950 rounded-xl p-4 border border-white/5 font-mono text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
          barcode, product_name, manufacturer, source_url, country, notes, field_01, field_02, ... field_28
        </div>
      </div>

      {/* Step 2 */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Step 2 — Upload CSV File</h3>
        
        {!file ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragActive ? 'bg-blue-500/10 border-blue-400' : 'border-slate-600 hover:border-blue-500 hover:bg-blue-500/5'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <p className="text-white font-medium text-lg">Drag & drop your CSV file here</p>
            <p className="text-slate-400 text-sm mt-1 mb-2">or click to browse</p>
            <span className="bg-slate-800 text-slate-500 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-medium">Accepts .csv files only</span>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-slate-500 text-xs text-left">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            {!importing && !importResult && (
              <button onClick={resetAll} className="text-slate-500 hover:text-red-400 p-2 transition-colors">
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 3 */}
      {parsedData.length > 0 && !importResult && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-xl p-4 flex gap-6 border border-slate-700">
            <div className="text-slate-300"><span className="text-slate-500 mr-2">Total rows:</span><span className="font-bold text-white">{summary.total}</span></div>
            <div className="text-green-400"><span className="text-slate-500 mr-2">Valid:</span><span className="font-bold">{summary.valid}</span></div>
            <div className="text-red-400"><span className="text-slate-500 mr-2">Errors:</span><span className="font-bold">{summary.errors}</span></div>
          </div>

          {summary.errors > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Please fix the following errors before importing:
              </h4>
              <ul className="list-disc list-inside text-red-300 text-sm space-y-1 max-h-32 overflow-y-auto">
                {parsedData.filter(r => r.status === 'error').slice(0,20).map((r,i) => (
                  <li key={i}>Row {r._origRowId}: {r.errorMsgs.join(', ')}</li>
                ))}
                {summary.errors > 20 && <li>...and {summary.errors - 20} more errors</li>}
              </ul>
            </div>
          )}

          <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-slate-900/50">
              <h4 className="text-white font-medium text-sm">Preview (First 10 rows)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-950 text-slate-400">
                    <th className="p-3 font-medium border-b border-slate-800">Row</th>
                    <th className="p-3 font-medium border-b border-slate-800">Status</th>
                    <th className="p-3 font-medium border-b border-slate-800">Barcode</th>
                    <th className="p-3 font-medium border-b border-slate-800">Product Name</th>
                    <th className="p-3 font-medium border-b border-slate-800">Manufacturer</th>
                    <th className="p-3 font-medium border-b border-slate-800">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="p-3 text-slate-500 font-mono text-xs">{row._origRowId}</td>
                      <td className="p-3">
                        {row.status === 'valid' ? (
                          <span className="inline-flex items-center gap-1 text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>Valid</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>Error</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-300">{row.barcode || '—'}</td>
                      <td className="p-3 text-white truncate max-w-[200px]">{row.product_name || '—'}</td>
                      <td className="p-3 text-slate-400">{row.manufacturer || '—'}</td>
                      <td className="p-3 text-slate-400">{row.country || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="pt-4">
            {importError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center mb-4">
                {importError}
              </div>
            )}
            {importing ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">Importing...</span>
                  <span className="text-blue-400 font-mono">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleImport}
                disabled={summary.errors > 0 || summary.valid === 0}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-blue-900/20"
              >
                Import {summary.valid} Products
              </button>
            )}
          </div>
        </div>
      )}

      {/* Done State */}
      {importResult && (
        <div className="bg-slate-900 rounded-2xl p-8 border border-white/10 text-center">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Import Complete</h3>
          <div className="text-slate-400 space-y-1 mb-8">
            <p><strong className="text-green-400">{importResult.imported}</strong> products successfully imported or updated</p>
            {importResult.failed > 0 && <p><strong className="text-red-400">{importResult.failed}</strong> products failed</p>}
          </div>
          <button onClick={resetAll} className="bg-slate-800 hover:bg-slate-700 text-white px-6 h-12 rounded-xl font-medium transition-colors border border-slate-700">
            Import Another File
          </button>
        </div>
      )}
      
    </div>
  )
}
