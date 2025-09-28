import { useEffect, useMemo, useState } from 'react'
import { listAssets3D, upsertAsset3D, type Asset3D, listScenes3D, upsertScene3D, listAnims3D, upsertAnim3D } from '../../api'

export default function Assets3DPage() {
  const [tab, setTab] = useState<'assets'|'scenes'|'anims'>('assets')
  const [items, setItems] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const columns = useMemo(()=>{
    return tab==='assets' ? [
      { key:'title', label:'Title', width:'40%' },
      { key:'type', label:'Type', width:'20%' },
      { key:'version', label:'Version', width:'20%' },
      { key:'updated_at', label:'Updated', width:'20%' },
    ] : [
      { key:'title', label:'Title', width:'50%' },
      { key:'version', label:'Version', width:'20%' },
      { key:'updated_at', label:'Updated', width:'30%' },
    ]
  }, [tab])

  async function refresh() {
    setLoading(true); setError('')
    try {
      if (tab==='assets') { const { items } = await listAssets3D(); setItems(items) }
      else if (tab==='scenes') { const { items } = await listScenes3D(); setItems(items) }
      else { const { items } = await listAnims3D(); setItems(items) }
    } catch (e:any) { setError(e?.message||'load_failed') }
    finally { setLoading(false) }
  }

  useEffect(()=>{ refresh() }, [tab])
  useEffect(()=>{ if (selected) setDraft(JSON.stringify(selected, null, 2)) }, [selected])

  function handleNew() {
    const base = tab==='assets'? { title:'새 에셋', type:'prop', version:'v1' } : tab==='scenes'? { title:'새 씬', points:[], props:[], version:'v1' } : { title:'새 애님', target:'character', clip:'Idle', version:'v1' }
    setSelected(base); setDraft(JSON.stringify(base, null, 2))
  }

  async function handleSave() {
    setLoading(true); setError('')
    try {
      const parsed = JSON.parse(draft||'{}')
      let saved: any
      if (tab==='assets') saved = await upsertAsset3D(parsed as Partial<Asset3D>)
      else if (tab==='scenes') saved = await upsertScene3D(parsed)
      else saved = await upsertAnim3D(parsed)
      await refresh(); setSelected(saved)
    } catch (e:any) { setError(e?.message||'save_failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button className={`px-3 py-1.5 rounded border ${tab==='assets'?'bg-neutral-900 text-white':''}`} onClick={()=>setTab('assets')}>Assets</button>
          <button className={`px-3 py-1.5 rounded border ${tab==='scenes'?'bg-neutral-900 text-white':''}`} onClick={()=>setTab('scenes')}>Scenes</button>
          <button className={`px-3 py-1.5 rounded border ${tab==='anims'?'bg-neutral-900 text-white':''}`} onClick={()=>setTab('anims')}>Anims</button>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={refresh} className="px-3 py-1.5 rounded border">Refresh</button>
          <button onClick={handleNew} className="px-3 py-1.5 rounded bg-neutral-900 text-white">New</button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded bg-blue-600 text-white">Save</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <section className="col-span-1 bg-white border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="text-left px-3 py-2" style={{ width: col.width }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item:any) => (
                <tr key={item._id || item.title} className={`border-b hover:bg-neutral-50 cursor-pointer ${selected?._id === item._id ? 'bg-neutral-100' : ''}`} onClick={()=>setSelected(item)}>
                  <td className="px-3 py-2 truncate">{item.title}</td>
                  <td className="px-3 py-2">{(item.type||item.version)||''}</td>
                  <td className="px-3 py-2 text-neutral-500">{item.updated_at || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="col-span-2 bg-white border rounded">
          <div className="border-b px-3 py-2 text-sm font-medium">Editor</div>
          <textarea className="w-full h-[520px] font-mono text-sm p-3 outline-none" value={draft} onChange={e=>setDraft(e.target.value)} spellCheck={false} />
        </section>
      </div>
      <div className="text-sm text-neutral-500 mt-2 h-5">{loading ? 'Loading…' : error ? <span className="text-red-600">{error}</span> : ''}</div>
    </div>
  )
}
