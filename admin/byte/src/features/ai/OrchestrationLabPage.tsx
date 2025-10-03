import { useEffect, useMemo, useRef, useState } from 'react'
import { aiOrchestratorChat, listUsers, listSessions, listDialogueTurns, getSessionSummary, proposeRuleFromDialogue, ensureSession } from '../../api'
import { toWsUrl } from '../../lib/config'

type LogItem = { ts: string; text: string }

export default function OrchestrationLabPage() {
  const [sessionId, setSessionId] = useState('session-lab')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [users, setUsers] = useState<Array<{ _id: string; display_name?: string }>>([])
  const [text, setText] = useState('요즘 잠이 잘 안 와…')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const [userPane, setUserPane] = useState<LogItem[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [summary, setSummary] = useState<any | null>(null)
  const [stagesPane, setStagesPane] = useState<LogItem[]>([])
  const [intentPane, setIntentPane] = useState<LogItem[]>([])
  const [bridgePane, setBridgePane] = useState<LogItem[]>([])
  const [masterPane, setMasterPane] = useState<LogItem[]>([])
  const lastIntentRef = useRef<any>(null)
  const ts = () => new Date().toISOString()

  function push(list: LogItem[], text: string): LogItem[] {
    return [{ ts: ts(), text }, ...list].slice(0, 300)
  }

  const seenRef = useRef<Set<string>>(new Set())
  function pushUnique(setter: (updater: (prev: LogItem[]) => LogItem[]) => void, key: string, line: string) {
    const seen = seenRef.current
    if (seen.has(key)) return
    seen.add(key)
    setter(prev => push(prev, line))
  }

  async function loadUsers() {
    try {
      const r = await listUsers(100)
      setUsers(r.items as any)
    } catch {
      // ignore
    }
  }

  async function loadSessionsAndHistory(userId: string) {
    if (!userId) { setSessions([]); setSelectedSessionId(''); setUserPane([]); setSummary(null); return }
    try {
      const s = await listSessions(userId, 20)
      setSessions(s.items || [])
      const first = s.items?.[0]?._id || s.items?.[0]?.id
      if (first) {
        setSelectedSessionId(first)
        const turns = await listDialogueTurns(first, 200)
        const summaryDoc = await getSessionSummary(first).catch(()=>null)
        setSummary(summaryDoc || null)
        const msgs: LogItem[] = (turns.items || []).map((t:any)=>({ ts: t.created_at || '', text: `${t.role?.toUpperCase?.() || t.role}: ${t.text}` }))
        setUserPane(msgs.reverse())
      } else {
        setUserPane([]); setSummary(null)
      }
    } catch {}
  }

  useEffect(() => { loadUsers() }, [])
  useEffect(() => { loadSessionsAndHistory(selectedUserId) }, [selectedUserId])

  // ensure single persistent session when user is selected
  useEffect(() => {
    (async () => {
      try {
        if (!selectedUserId) return;
        const ensured = await ensureSession(selectedUserId);
        if (ensured?._id) {
          setSelectedSessionId(prev => prev || ensured._id)
        }
      } catch {}
    })();
  }, [selectedUserId])

  useEffect(() => {
    let ws1: WebSocket | null = null
    let ws2: WebSocket | null = null
    try {
      ws1 = new WebSocket(toWsUrl('/ws/ai.events'))
      ws1.onmessage = (ev) => {
        const raw = String(ev.data)
        let parsed: any = null
        try { parsed = JSON.parse(raw) } catch {}
        const evt = parsed?.event || parsed
        const activeSessionId = selectedSessionId || sessionId
        // Filter by session/user if present
        if (evt && evt.session_id && evt.session_id !== activeSessionId) return
        if (evt && selectedUserId && evt.user_id && evt.user_id !== selectedUserId) return
        // Always keep a full stream copy in Stages
        setStagesPane(prev => push(prev, parsed ? JSON.stringify(parsed) : raw))
        if (!evt) return
        // Route to specialized panes
        if (evt.type === 'bridge.analysis') {
          const text = evt.payload?.text ?? raw
          pushUnique(setBridgePane, `bridge:${evt.trace_id || ''}:${activeSessionId}:${text}`, text)
        } else if (evt.type === 'master.review') {
          const notes = evt.payload?.notes ?? raw
          pushUnique(setMasterPane, `master:${evt.trace_id || ''}:${activeSessionId}:${notes}`, notes)
        } else if (evt.type === 'director.intent') {
          lastIntentRef.current = evt.payload
        } else if (evt.type === 'user_turn.saved') {
          const ut = evt.payload?.text ?? ''
          if (ut) {
            const key = `user:${evt.trace_id || ''}:${activeSessionId}:${ut}`
            pushUnique(setUserPane, key, `USER: ${ut}`)
          }
        } else if (evt.type === 'llm.reply') {
          const intent = lastIntentRef.current
          const actionStr = intent ? `액션: ${intent.intent} (${intent.expr}/${intent.anim})` : '액션: (없음)'
          const answer = evt.payload?.text ?? ''
          const question = evt.payload?.next_question
          const line = `AI → ${actionStr}\n답변: ${answer}${question ? `\n질문: ${question}` : ''}`
          const key = `ai:${evt.trace_id || ''}:${activeSessionId}:${answer}::${question || ''}`
          pushUnique(setUserPane, key, line)
        }
      }
    } catch {}
    try {
      ws2 = new WebSocket(toWsUrl('/ws/dialogue.intents'))
      ws2.onmessage = (ev) => {
        const raw = String(ev.data)
        let parsed: any = null
        try { parsed = JSON.parse(raw) } catch {}
        setIntentPane(prev => push(prev, parsed ? JSON.stringify(parsed) : raw))
        const evt = parsed?.event || parsed
        if (evt && evt.intent) {
          lastIntentRef.current = evt.intent
        }
      }
    } catch {}
    return () => { try { ws1?.close() } catch {}; try { ws2?.close() } catch {} }
  }, [sessionId, selectedUserId])

  async function send() {
    setSending(true); setError('')
    try {
      const sid = selectedSessionId || sessionId
      await aiOrchestratorChat({ sessionId: sid, text: text, asUserId: selectedUserId || undefined })
    } catch (e:any) { setError(e?.message || 'failed') }
    finally { setSending(false) }
  }

  async function proposeRule() {
    setSending(true); setError('')
    try {
      const sid = selectedSessionId || sessionId
      const uid = selectedUserId || undefined
      const res = await proposeRuleFromDialogue({ sessionId: sid, userId: uid, limit: 50 })
      setStagesPane(prev => [{ ts: new Date().toISOString(), text: `RULE PROPOSAL: ${JSON.stringify(res.proposal)}` }, ...prev])
    } catch (e:any) { setError(e?.message || 'failed') }
    finally { setSending(false) }
  }

  const header = useMemo(() => (
      <div className="flex items-center justify-between gap-4">
      <div className="font-semibold">Orchestration Lab</div>
      <div className="flex items-center gap-2 text-sm">
        <input className="border rounded px-2 py-1 w-[220px]" placeholder="session id" value={sessionId} onChange={e=>setSessionId(e.target.value)} />
          <select className="border rounded px-2 py-1 w-[220px]" value={selectedUserId} onChange={e=>{
            const uid = e.target.value
            setSelectedUserId(uid)
            const u = users.find(x=>x._id===uid) as any
            if (u?.current_session_id) setSelectedSessionId(u.current_session_id)
          }}>
            <option value="">(select user)</option>
            {users.map(u=>(<option key={u._id} value={u._id}>{u.display_name || u._id}</option>))}
          </select>
          <button className="px-2 py-1 border rounded" onClick={loadUsers}>Refresh</button>
        <button className="px-2.5 py-1.5 bg-neutral-900 text-white rounded" onClick={send} disabled={sending}>Send</button>
        <button className="px-2.5 py-1.5 bg-blue-600 text-white rounded" onClick={proposeRule} disabled={sending}>Propose Rule</button>
        <div className="text-neutral-500">{sending?'Sending…':error? <span className="text-red-600">{error}</span>:''}</div>
      </div>
    </div>
  ), [sessionId, sending, error])

  return (
    <div className="p-6 space-y-4">
      {header}
      <div className="grid grid-cols-3 gap-3">
        {/* Row 1 */}
        <div className="bg-white border rounded p-3 space-y-2 row-start-1 col-start-1">
          <div className="font-medium text-sm flex items-center justify-between">
            <span>채팅 (User ↔ Orchestrator)</span>
            <span className="text-xs text-neutral-500">/trpc/ai.orchestrator.chat</span>
          </div>
          <div className="flex items-center gap-2">
            <select className="border rounded px-2 py-1 w-[220px]" value={selectedUserId} onChange={e=>setSelectedUserId(e.target.value)}>
              <option value="">(select user)</option>
              {users.map(u=>(<option key={u._id} value={u._id}>{u.display_name || u._id}</option>))}
            </select>
            <select className="border rounded px-2 py-1 w-[220px]" value={selectedSessionId} onChange={e=>setSelectedSessionId(e.target.value)}>
              <option value="">(latest or manual: {sessionId})</option>
              {sessions.map((s:any)=>(<option key={s._id || s.id} value={s._id || s.id}>{(s.t_start||'').slice(0,19).replace('T',' ')}</option>))}
            </select>
          </div>
          {summary && <div className="text-xs p-2 bg-neutral-50 border rounded">요약: {summary.summary_text}</div>}
          <div className="text-sm h-[280px] overflow-auto border rounded p-2 bg-neutral-50">
            {userPane.map((m,i)=>(<div key={i} className="py-1 whitespace-pre-wrap">{m.text}</div>))}
            {!userPane.length && <div className="text-neutral-500">No messages.</div>}
          </div>
          <div className="flex items-center gap-2">
            <input className="flex-1 border rounded px-3 py-2" placeholder="메시지를 입력하세요" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); send() } }} />
            <button className="px-3 py-2 bg-neutral-900 text-white rounded disabled:opacity-50" onClick={send} disabled={sending || !selectedUserId}>Send</button>
          </div>
        </div>
        <div className="bg-white border rounded p-3 space-y-2 row-start-1 col-start-2">
          <div className="font-medium text-sm">브릿지 분석 (Perception/Coach)</div>
          <div className="text-xs text-neutral-500">ai.events: bridge.analysis</div>
          <div className="text-sm max-h-[360px] overflow-auto">
            {bridgePane.map((m,i)=>(<div key={i} className="border-b py-1 whitespace-pre-wrap">{m.ts} {m.text}</div>))}
            {!bridgePane.length && <div className="text-neutral-500">No bridge notes.</div>}
          </div>
        </div>
        <div className="bg-white border rounded p-3 space-y-2 row-start-1 col-start-3">
          <div className="font-medium text-sm">마스터 검토</div>
          <div className="text-xs text-neutral-500">ai.events: master.review</div>
          <div className="text-sm max-h-[360px] overflow-auto">
            {masterPane.map((m,i)=>(<div key={i} className="border-b py-1 whitespace-pre-wrap">{m.ts} {m.text}</div>))}
            {!masterPane.length && <div className="text-neutral-500">No master notes.</div>}
          </div>
        </div>

        {/* Row 2 */}
        <div className="bg-white border rounded p-3 space-y-2 row-start-2 col-start-2">
          <div className="font-medium text-sm">Stages</div>
          <div className="text-xs text-neutral-500">/ws/ai.events</div>
          <div className="text-sm max-h-[360px] overflow-auto">
            {stagesPane.map((m,i)=>(<div key={i} className="border-b py-1 font-mono whitespace-pre-wrap">{m.ts} {m.text}</div>))}
            {!stagesPane.length && <div className="text-neutral-500">No stage events yet.</div>}
          </div>
        </div>
        <div className="bg-white border rounded p-3 space-y-2 row-start-2 col-start-3">
          <div className="font-medium text-sm">Intents</div>
          <div className="text-xs text-neutral-500">/ws/dialogue.intents</div>
          <div className="text-sm max-h-[360px] overflow-auto">
            {intentPane.map((m,i)=>(<div key={i} className="border-b py-1 font-mono whitespace-pre-wrap">{m.ts} {m.text}</div>))}
            {!intentPane.length && <div className="text-neutral-500">No intents yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}


