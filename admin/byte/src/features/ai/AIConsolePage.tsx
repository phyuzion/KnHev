import { useEffect, useState } from 'react'
import { aiReplyGenerate, aiOrchestratorChat } from '../../api'
import { toWsUrl } from '../../lib/config'

export default function AIConsolePage() {
  const [text, setText] = useState('안녕? 오늘 하루 어땠어?')
  const [resp, setResp] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState<string>('session-demo')
  const [mode, setMode] = useState<'reply'|'orchestrator'>('orchestrator')
  const [intents, setIntents] = useState<string[]>([])
  const [wsStatus, setWsStatus] = useState<'connecting'|'open'|'closed'|'error'>('connecting')

  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(toWsUrl('/ws/dialogue.intents'))
      ws.onopen = () => setWsStatus('open')
      ws.onclose = () => setWsStatus('closed')
      ws.onerror = () => setWsStatus('error')
      ws.onmessage = (ev) => setIntents(prev => [String(ev.data), ...prev].slice(0, 120))
    } catch {
      setWsStatus('error')
    }
    return () => { try { ws?.close() } catch {} }
  }, [])

  async function send() {
    setLoading(true); setError(''); setResp('')
    try {
      if (mode === 'reply') {
        const r = await aiReplyGenerate({ text, style: 'short', locale: 'ko' })
        setResp(r.text)
      } else {
        const r = await aiOrchestratorChat({ sessionId, text })
        setResp(`${r.text}\n\n(intent=${JSON.stringify(r.intent)})`)
      }
    } catch (e:any) { setError(e?.message || 'failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">AI Console</h1>
        <div className="flex items-center gap-2 text-sm">
          <select className="border rounded px-2 py-1" value={mode} onChange={e=>setMode(e.target.value as any)}>
            <option value="orchestrator">orchestrator.chat</option>
            <option value="reply">ai.reply.generate</option>
          </select>
          <input className="border rounded px-2 py-1 w-[200px]" placeholder="session id" value={sessionId} onChange={e=>setSessionId(e.target.value)} />
          <div className="text-neutral-500">ws: {wsStatus}</div>
          <div className="text-sm text-neutral-500">{loading?'Loading…':error? <span className="text-red-600">{error}</span>:''}</div>
        </div>
      </div>
      <div className="bg-white border rounded p-3 space-y-3">
        <textarea className="w-full h-[120px] border rounded p-2" value={text} onChange={e=>setText(e.target.value)} />
        <button className="px-3 py-1.5 rounded bg-neutral-900 text-white text-sm" onClick={send}>Send</button>
        {resp && <div className="text-sm whitespace-pre-wrap border-t pt-2">{resp}</div>}
      </div>
      <div className="bg-white border rounded p-3 space-y-2">
        <div className="font-medium text-sm">Realtime Intents</div>
        <div className="text-xs text-neutral-500">/ws/dialogue.intents</div>
        <div className="text-sm max-h-[200px] overflow-auto">
          {intents.map((m,i)=>(<div key={i} className="border-b py-1 font-mono whitespace-pre-wrap">{m}</div>))}
          {!intents.length && <div className="text-neutral-500">No intents yet.</div>}
        </div>
      </div>
    </div>
  )
}
