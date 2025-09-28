import { useEffect, useMemo, useState } from 'react'
import { listCurriculumUnits, upsertCurriculumUnit, type CurriculumUnit } from '../../api'
import { useToast } from '../../components/Toast'
import { canWrite } from '../../lib/auth'
import DataTable, { type ColumnDef } from '../../components/DataTable'

export default function CurriculumPage() {
  const [items, setItems] = useState<CurriculumUnit[]>([])
  const [selected, setSelected] = useState<CurriculumUnit | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [sortKey, setSortKey] = useState<'title'|'version'|'updated_at'>('updated_at')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const columns = useMemo<ColumnDef[]>(() => [
    { key: 'title', label: 'Title', width: '50%' },
    { key: 'version', label: 'Version', width: '20%' },
    { key: 'updated_at', label: 'Updated', width: '30%' },
  ], [])

  async function refresh() {
    setLoading(true); setError('')
    try {
      const { items } = await listCurriculumUnits()
      setItems(items)
      if (selected?._id) {
        const found = items.find(i => i._id === selected._id) || null
        setSelected(found)
        setDraft(found ? JSON.stringify(found, null, 2) : '')
      }
    } catch (e: any) { setError(e?.message || 'load_failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])
  useEffect(() => { if (selected) setDraft(JSON.stringify(selected, null, 2)) }, [selected])

  function handleNew() {
    const base: CurriculumUnit = { title: '새 커리큘럼 유닛', activities: [], taxonomy: {}, rubric_refs: [], version: 'v1' }
    setSelected(base)
    setDraft(JSON.stringify(base, null, 2))
  }

  function validateUnit(obj: any): string | null {
    if (!obj || typeof obj !== 'object') return 'object required'
    if (!obj.title || typeof obj.title !== 'string') return 'title(string) is required'
    if (!Array.isArray(obj.activities)) return 'activities(array) is required'
    return null
  }

  async function handleSave() {
    setLoading(true); setError('')
    try {
      const parsed = JSON.parse(draft || '{}')
      const vErr = validateUnit(parsed)
      if (vErr) throw new Error(`invalid_input: ${vErr}`)
      const saved = await upsertCurriculumUnit(parsed)
      await refresh(); setSelected(saved)
      setNotice('Saved')
      setTimeout(()=>setNotice(''), 1500)
    } catch (e: any) { setError(e?.message || 'save_failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Curriculum Units</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={() => exportJson()} className="px-3 py-1.5 rounded border">Export</button>
          <button onClick={refresh} className="px-3 py-1.5 rounded border">Refresh</button>
          {canWrite('curriculum') && <button onClick={handleNew} className="px-3 py-1.5 rounded bg-neutral-900 text-white">New</button>}
          {canWrite('curriculum') && <button onClick={handleSave} className="px-3 py-1.5 rounded bg-blue-600 text-white">Save</button>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <section className="col-span-1 bg-white border rounded overflow-hidden">
          <div className="p-2 border-b flex gap-2 items-center">
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Search title" value={q} onChange={e=>{ setQ(e.target.value); setPage(1) }} />
          </div>
          <DataTable
            columns={columns}
            rows={items}
            filterText={q}
            filterKeys={['title']}
            sortKey={sortKey}
            sortDir={sortDir}
            setSortKey={(k)=>setSortKey(k as any)}
            setSortDir={(d)=>setSortDir(d)}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            onRowClick={(row)=>setSelected(row as any)}
          />
        </section>
        <section className="col-span-2 bg-white border rounded">
          <div className="border-b px-3 py-2 text-sm font-medium">Editor</div>
          <textarea className="w-full h-[520px] font-mono text-sm p-3 outline-none" value={draft} onChange={e=>setDraft(e.target.value)} spellCheck={false} />
        </section>
      </div>
      <div className="text-sm text-neutral-500 mt-2 h-5">{loading ? 'Loading…' : error ? <span className="text-red-600">{error}</span> : notice ? <span className="text-green-600">{notice}</span> : ''}</div>
    </div>
  )

  function exportJson() {
    const blob = new Blob([
      JSON.stringify(items, null, 2)
    ], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'curriculum_units.json'
    a.click()
    setTimeout(()=>URL.revokeObjectURL(a.href), 0)
  }
}
