import { useEffect, useState } from 'react'
import { listBibleUnits, upsertBibleUnit, listKnowledgePacks, upsertKnowledgePack, aiPerceptionSummarize, aiDirectorDecideActions, aiMasterPropose, aiMasterValidate, aiMasterShadowTest, aiMasterPromote } from '../../api'
import { canWrite } from '../../lib/auth'

export default function BiblePage(){
  const [tab,setTab]=useState<'bible'|'knowledge'|'magi'|'master'>('bible')
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
      else setItems([])
    }catch(e:any){ setError(e?.message||'load_failed') }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ refresh() },[tab])

  function newDoc(){
    const base = tab==='bible'? { title:'새 바이블 유닛', version:'v1', content:{} } : { bible_version:'v1', version:'v1', summary:{} }
    setDraft(JSON.stringify(base,null,2))
  }

  async function save(){
    if(!canWrite('scenarios')) return
    setLoading(true); setError('')
    try{
      const parsed = JSON.parse(draft||'{}')
      const saved = tab==='bible'? await upsertBibleUnit(parsed) : await upsertKnowledgePack(parsed)
      setOut(saved); await refresh()
    }catch(e:any){ setError(e?.message||'save_failed') }
    finally{ setLoading(false) }
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
