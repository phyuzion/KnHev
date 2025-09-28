import { useMemo, useState } from 'react'

export type ColumnDef = { key: string; label: string; width?: string }

type Props = {
  columns: ColumnDef[]
  rows: any[]
  filterText?: string
  filterKeys?: string[]
  sortKey: string
  sortDir: 'asc'|'desc'
  setSortKey: (k: string) => void
  setSortDir: (d: 'asc'|'desc') => void
  page: number
  setPage: (p: number) => void
  pageSize: number
  onRowClick?: (row: any) => void
}

export default function DataTable({ columns, rows, filterText, filterKeys, sortKey, sortDir, setSortKey, setSortDir, page, setPage, pageSize, onRowClick }: Props) {
  const [visible, setVisible] = useState<Record<string, boolean>>(()=>{
    const v: Record<string, boolean> = {}
    for (const c of columns) v[c.key] = true
    return v
  })

  const filtered = useMemo(()=>{
    if (!filterText) return rows
    const keys = filterKeys && filterKeys.length ? filterKeys : columns.map(c=>c.key)
    const q = filterText.toLowerCase()
    return rows.filter(r => keys.some(k => String((r as any)[k] ?? '').toLowerCase().includes(q)))
  }, [rows, filterText, filterKeys, columns])

  const sorted = useMemo(()=>{
    return [...filtered].sort((a,b)=>{
      const dir = sortDir==='asc'?1:-1
      const va = (a as any)[sortKey] ?? ''
      const vb = (b as any)[sortKey] ?? ''
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [filtered, sortKey, sortDir])

  const total = sorted.length
  const start = (page-1)*pageSize
  const paged = sorted.slice(start, start+pageSize)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(sortDir==='asc'?'desc':'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="w-full">
      <div className="p-2 border-b flex items-center justify-between text-xs">
        <div className="flex gap-2 items-center">
          <span className="text-neutral-500">Columns:</span>
          {columns.map(col => (
            <label key={col.key} className="flex items-center gap-1">
              <input type="checkbox" checked={!!visible[col.key]} onChange={(e)=>setVisible(v=>({ ...v, [col.key]: e.target.checked }))} />
              <span>{col.label}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 border rounded disabled:opacity-40" disabled={page<=1} onClick={()=>setPage(Math.max(1, page-1))}>Prev</button>
          <span className="px-2">{page}/{totalPages}</span>
          <button className="px-2 py-1 border rounded disabled:opacity-40" disabled={page>=totalPages} onClick={()=>setPage(Math.min(totalPages, page+1))}>Next</button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 border-b">
          <tr>
            {columns.map(col => visible[col.key] && (
              <th
                key={col.key}
                className="text-left px-3 py-2 cursor-pointer select-none"
                style={{ width: col.width }}
                onClick={()=>toggleSort(col.key)}
              >
                {col.label}{sortKey===col.key ? (sortDir==='asc'?' ▲':' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.map((row, idx) => (
            <tr key={(row as any)._id || idx} className="border-b hover:bg-neutral-50 cursor-pointer" onClick={()=>onRowClick && onRowClick(row)}>
              {columns.map(col => visible[col.key] && (
                <td key={col.key} className="px-3 py-2 truncate">{String((row as any)[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2 text-xs text-neutral-500">{total} items</div>
    </div>
  )
}


