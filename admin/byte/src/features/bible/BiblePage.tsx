import { useEffect, useMemo, useState } from 'react'
import { listBibleUnits, upsertBibleUnit, listKnowledgePacks, upsertKnowledgePack, aiPerceptionSummarize, aiDirectorDecideActions, aiMasterPropose, aiMasterValidate, aiMasterShadowTest, aiMasterPromote, listBibleRules, upsertBibleRule, archiveBibleRule, promoteBibleRule, listBibleRuleChanges, type BibleRule } from '../../api'
import { canWrite } from '../../lib/auth'

export default function BiblePage(){
  const [tab,setTab]=useState<'bible'|'knowledge'|'rules'|'magi'|'master'>('bible')
  const [items,setItems]=useState<any[]>([])
  const [draft,setDraft]=useState('')
  const [out,setOut]=useState<any>(null)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')

  async function refresh(){
    setLoading(true); setError('')
    try{
      if(tab==='bible'){ const { items } = await listBibleUnits(); setItems(items) }
      else if(tab==='knowledge'){ const { items } = await listKnowledgePacks(); setItems(items) }
      else if(tab==='rules'){ const { items } = await listBibleRules({ limit: 200 }); setItems(items as any) }
      else setItems([])
    }catch(e:any){ setError(e?.message||'load_failed') }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ refresh() },[tab])

  function newDoc(){
    const base = tab==='bible'? { title:'새 바이블 유닛', version:'v1', content:{} }
      : tab==='knowledge'? { bible_version:'v1', version:'v1', summary:{} }
      : { rule_text:'', category:'tone', status:'draft', source:'manual', tags:[] }
    setDraft(JSON.stringify(base,null,2))
  }

  async function save(){
    if(!canWrite('scenarios')) return
    setLoading(true); setError('')
    try{
      const parsed = JSON.parse(draft||'{}')
      const saved = tab==='bible'? await upsertBibleUnit(parsed)
        : tab==='knowledge'? await upsertKnowledgePack(parsed)
        : await upsertBibleRule(parsed)
      setOut(saved); await refresh()
    }catch(e:any){ setError(e?.message||'save_failed') }
    finally{ setLoading(false) }
  }

  // rules helpers
  const [ruleFilters, setRuleFilters] = useState<{ q?: string; status?: string; category?: string; source?: string }>({ status: 'draft' })
  const filteredRules: BibleRule[] = useMemo(() => {
    if (tab!=='rules') return []
    const list = (items as BibleRule[]) || []
    return list.filter((r)=>{
      if (ruleFilters.status && r.status !== ruleFilters.status) return false
      if (ruleFilters.category && r.category !== ruleFilters.category) return false
      if (ruleFilters.source && (r as any).source !== ruleFilters.source) return false
      if (ruleFilters.q) {
        const q = ruleFilters.q.toLowerCase()
        const hay = `${r.rule_text||''} ${(r.tags||[]).join(' ')} ${(r.category||'')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, ruleFilters, tab])

  const [changes, setChanges] = useState<any[]>([])
  async function loadChanges(ruleId?: string){
    try{ const { items } = await listBibleRuleChanges({ ruleId, limit: 100 }); setChanges(items) }catch{}
  }

  async function runPerception(){
    setLoading(true); setError(''); setOut(null)
    try{ setOut(await aiPerceptionSummarize({ text:'사용자 최근 상태 요약 예시' })) }catch(e:any){ setError(e?.message||'failed') } finally{ setLoading(false) }
  }
  async function runDirector(){
    setLoading(true); setError(''); setOut(null)
    try{ setOut(await aiDirectorDecideActions({ state:{ need:'calm' }, policy:{} })) }catch(e:any){ setError(e?.message||'failed') } finally{ setLoading(false) }
  }
  async function runMaster(step:'propose'|'validate'|'shadow'|'promote'){
    setLoading(true); setError(''); setOut(null)
    try{
      if(step==='propose') setOut(await aiMasterPropose({ base_id_code:'BASE_SKEL_V1' }))
      else if(step==='validate') setOut(await aiMasterValidate({ draft_id:'draft_demo' }))
      else if(step==='shadow') setOut(await aiMasterShadowTest({ draft_id:'draft_demo', sample:10 }))
      else setOut(await aiMasterPromote({ draft_id:'draft_demo', mode:'auto' }))
    }catch(e:any){ setError(e?.message||'failed') } finally{ setLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button className={`px-3 py-1.5 rounded border ${tab==='bible'?'bg-neutral-900 text-white':''}`} onClick={()=>setTab('bible')}>Bible Units</button>
          <button className={`px-3 py-1.5 rounded border ${tab==='knowledge'?'bg-neutral-900 text-white':''}`} onClick={()=>setTab('knowledge')}>Knowledge Packs</button>
          <button className={`px-3 py-1.5 rounded border ${tab==='rules'?'bg-neutral-900 text-white':''}`} onClick={()=>setTab('rules')}>Bible Rules</button>
          <button className={`px-3 py-1.5 rounded border ${tab==='magi'?'bg-neutral-900 text-white':''}`} onClick={()=>setTab('magi')}>MAGI (Perception/Director)</button>
          <button className={`px-3 py-1.5 rounded border ${tab==='master'?'bg-neutral-900 text-white':''}`} onClick={()=>setTab('master')}>Master (Autopilot)</button>
        </div>
        <div className="text-sm text-neutral-500">{loading?'Loading…':error? <span className="text-red-600">{error}</span> : ''}</div>
      </div>

      {tab==='bible' || tab==='knowledge' ? (
        <div className="grid grid-cols-3 gap-4">
          <section className="col-span-1 bg-white border rounded p-2 max-h-[560px] overflow-auto">
            {items.map(it=> (
              <div key={it._id||it.title} className="border-b py-1 cursor-pointer" onClick={()=>setDraft(JSON.stringify(it,null,2))}>{it.title || it.version}</div>
            ))}
          </section>
          <section className="col-span-2 bg-white border rounded p-3">
            <div className="flex gap-2 mb-2">
              <button className="px-3 py-1.5 rounded border" onClick={newDoc}>New</button>
              {canWrite('scenarios') && <button className="px-3 py-1.5 rounded bg-blue-600 text-white" onClick={save}>Save</button>}
            </div>
            <textarea className="w-full h-[500px] font-mono text-sm p-2 border rounded" value={draft} onChange={e=>setDraft(e.target.value)} />
            {out && <pre className="mt-2 bg-neutral-50 border rounded p-2 text-xs overflow-auto">{JSON.stringify(out,null,2)}</pre>}
          </section>
        </div>
      ) : tab==='rules' ? (
        <div className="grid grid-cols-3 gap-4">
          {/* Left: Rule list + filters */}
          <section className="col-span-1 bg-white border rounded p-2 max-h-[560px] overflow-auto space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <input className="border rounded px-2 py-1 flex-1" placeholder="검색" value={ruleFilters.q||''} onChange={e=>setRuleFilters(v=>({ ...v, q: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <select className="border rounded px-2 py-1" value={ruleFilters.status||''} onChange={e=>setRuleFilters(v=>({ ...v, status: e.target.value||undefined }))}>
                <option value="">(status)</option>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
              <select className="border rounded px-2 py-1" value={ruleFilters.category||''} onChange={e=>setRuleFilters(v=>({ ...v, category: e.target.value||undefined }))}>
                <option value="">(category)</option>
                <option value="tone">tone</option>
                <option value="safety">safety</option>
                <option value="policy">policy</option>
              </select>
              <select className="border rounded px-2 py-1" value={ruleFilters.source||''} onChange={e=>setRuleFilters(v=>({ ...v, source: e.target.value||undefined }))}>
                <option value="">(source)</option>
                <option value="manual">manual</option>
                <option value="from_user">from_user</option>
                <option value="auto">auto</option>
              </select>
            </div>
            <div className="text-xs text-neutral-500">{filteredRules.length} rules</div>
            <div>
              {filteredRules.map((r)=> (
                <div key={String((r as any)._id)||r.rule_text} className="border-b py-1 cursor-pointer" onClick={()=>{ setDraft(JSON.stringify(r,null,2)); loadChanges(String((r as any)._id)) }}>
                  <div className="text-sm line-clamp-2">{r.rule_text}</div>
                  <div className="text-xs text-neutral-500">{r.status} · {r.category} {(r.tags||[]).slice(0,3).join(', ')}</div>
                </div>
              ))}
            </div>
          </section>
          {/* Middle: Editor */}
          <section className="col-span-1 bg-white border rounded p-3">
            <div className="flex gap-2 mb-2">
              <button className="px-3 py-1.5 rounded border" onClick={newDoc}>New</button>
              {canWrite('scenarios') && <button className="px-3 py-1.5 rounded bg-blue-600 text-white" onClick={save}>Save</button>}
              {canWrite('scenarios') && <button className="px-3 py-1.5 rounded border" onClick={async()=>{ try{ const id=(JSON.parse(draft)._id); if(!id) return; await promoteBibleRule({ ruleId: String(id) }); await refresh() }catch{} }}>Promote</button>}
              {canWrite('scenarios') && <button className="px-3 py-1.5 rounded border" onClick={async()=>{ try{ const id=(JSON.parse(draft)._id); if(!id) return; await archiveBibleRule({ ruleId: String(id), reason: 'manual' }); await refresh() }catch{} }}>Archive</button>}
            </div>
            <textarea className="w-full h-[500px] font-mono text-sm p-2 border rounded" value={draft} onChange={e=>setDraft(e.target.value)} />
            {out && <pre className="mt-2 bg-neutral-50 border rounded p-2 text-xs overflow-auto">{JSON.stringify(out,null,2)}</pre>}
          </section>
          {/* Right: Change log */}
          <section className="col-span-1 bg-white border rounded p-3 space-y-2">
            <div className="font-medium text-sm">Change Log</div>
            <div className="text-xs max-h-[540px] overflow-auto">
              {changes.map((c,i)=>(
                <div key={i} className="border-b py-1">
                  <div className="text-[11px] text-neutral-500">{c.created_at} · {c.change_type} · {c.by}</div>
                  <div className="whitespace-pre-wrap">{c.notes || JSON.stringify(c.proposal || c.update || {}, null, 0)}</div>
                </div>
              ))}
              {!changes.length && <div className="text-neutral-500">No changes.</div>}
            </div>
          </section>
        </div>
      ) : tab==='magi' ? (
        <div className="bg-white border rounded p-3 space-y-2">
          <div className="text-sm text-neutral-600">Perception → Director 샘플 호출</div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded border" onClick={runPerception}>Perception.summarize</button>
            <button className="px-3 py-1.5 rounded border" onClick={runDirector}>Director.decideActions</button>
          </div>
          {out && <pre className="mt-2 bg-neutral-50 border rounded p-2 text-xs overflow-auto">{JSON.stringify(out,null,2)}</pre>}
        </div>
      ) : (
        <div className="bg-white border rounded p-3 space-y-2">
          <div className="text-sm text-neutral-600">Master Autopilot: propose → validate → shadow → promote</div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded border" onClick={()=>runMaster('propose')}>Propose</button>
            <button className="px-3 py-1.5 rounded border" onClick={()=>runMaster('validate')}>Validate</button>
            <button className="px-3 py-1.5 rounded border" onClick={()=>runMaster('shadow')}>Shadow</button>
            <button className="px-3 py-1.5 rounded border" onClick={()=>runMaster('promote')}>Promote</button>
          </div>
          {out && <pre className="mt-2 bg-neutral-50 border rounded p-2 text-xs overflow-auto">{JSON.stringify(out,null,2)}</pre>}
        </div>
      )}
    </div>
  )
}
