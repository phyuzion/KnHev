import { useEffect, useState } from 'react'
import { toWsUrl } from '../../lib/config'

export default function RealtimePage() {
  const [messages, setMessages] = useState<string[]>([])
  const [status, setStatus] = useState<'connecting'|'open'|'closed'|'error'>('connecting')
  const [channel, setChannel] = useState<'master'|'scheduler'>('master')

  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      const path = channel === 'master' ? '/ws/master.proposals' : '/ws/scheduler.jobs'
      ws = new WebSocket(toWsUrl(path))
      ws.onopen = () => setStatus('open')
      ws.onclose = () => setStatus('closed')
      ws.onerror = () => setStatus('error')
      ws.onmessage = (ev) => setMessages(prev => [String(ev.data), ...prev].slice(0, 200))
    } catch {
      setStatus('error')
    }
    return () => { try { ws?.close() } catch {} }
  }, [channel])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Realtime</h1>
        <div className="flex items-center gap-2 text-sm">
          <select className="border rounded px-2 py-1" value={channel} onChange={e=>setChannel(e.target.value as any)}>
            <option value="master">master.proposals</option>
            <option value="scheduler">scheduler.jobs</option>
          </select>
          <div className="text-neutral-500">{status}</div>
        </div>
      </div>
      <div className="bg-white border rounded p-3 text-sm max-h-[520px] overflow-auto">
        {messages.map((m,i)=>(<div key={i} className="border-b py-1 font-mono whitespace-pre-wrap">{m}</div>))}
        {!messages.length && <div className="text-neutral-500">No messages yet.</div>}
      </div>
    </div>
  )
}
