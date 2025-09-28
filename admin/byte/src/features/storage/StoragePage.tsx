import { useState } from 'react'
import { storagePresign } from '../../api'

export default function StoragePage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Array<{ key?:string; publicUrl?:string; ts:string }>>([])

  async function handleUpload() {
    if (!file) return
    setLoading(true); setError(''); setResult(null)
    try {
      const ct = file.type || 'application/octet-stream'
      const presign = await storagePresign({ contentType: ct })
      if (!presign.uploadUrl) throw new Error('no uploadUrl')
      const res = await fetch(presign.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': ct } })
      if (!res.ok) throw new Error(`upload failed ${res.status}`)
      const out = { ...presign, status: 'ok' }
      setResult(out)
      setHistory(prev => [{ key: out.key, publicUrl: out.publicUrl, ts: new Date().toISOString() }, ...prev].slice(0, 50))
    } catch (e:any) { setError(e?.message || 'upload_failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Storage</h1>
        <div className="text-sm text-neutral-500">{loading?'Uploading…':error? <span className="text-red-600">{error}</span>:''}</div>
      </div>
      <div className="bg-white border rounded p-4 space-y-3">
        <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button className="px-3 py-1.5 rounded bg-neutral-900 text-white text-sm" onClick={handleUpload} disabled={!file}>Upload</button>
        {result && (
          <div className="text-sm">
            <div>Key: <span className="text-neutral-700">{result.key||'-'}</span></div>
            <div>Public URL: <a className="text-blue-600 underline" href={result.publicUrl} target="_blank" rel="noreferrer">{result.publicUrl}</a></div>
          </div>
        )}
      </div>
      <div className="bg-white border rounded p-4">
        <div className="font-medium mb-2">Recent uploads</div>
        <div className="text-sm max-h-[220px] overflow-auto">
          {history.map((h,i)=>(
            <div key={i} className="border-b py-1 flex items-center justify-between">
              <div className="truncate mr-2">{h.key}</div>
              <a className="text-blue-600 underline" href={h.publicUrl} target="_blank" rel="noreferrer">open</a>
            </div>
          ))}
          {!history.length && <div className="text-neutral-500">No uploads yet.</div>}
        </div>
      </div>
    </div>
  )
}
