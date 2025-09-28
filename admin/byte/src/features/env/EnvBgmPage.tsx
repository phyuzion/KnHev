import { useState } from 'react'
import { envGetPreset, bgmPick } from '../../api'

export default function EnvBgmPage(){
  const [need,setNeed]=useState<'calm'|'sleep'|'focus'|'mood_lift'|'grounding'>('calm')
  const [reg,setReg]=useState<'downregulate'|'stabilize'|'upregulate'>('stabilize')
  const [timePhase,setTimePhase]=useState<'dawn'|'day'|'dusk'|'night'>('day')
  const [weather,setWeather]=useState<'clear'|'cloudy'|'rain'|'snow'>('clear')
  const [preset,setPreset]=useState<any>(null)
  const [track,setTrack]=useState<string>('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')

  async function pick(){
    setLoading(true);setError('');setPreset(null);setTrack('')
    try{
      const p = await envGetPreset({ time: timePhase, weather, state:{ need, regulation: reg } })
      setPreset(p)
      const t = await bgmPick({ policy:{ need, timePhase, weather, regulation: reg } })
      setTrack(t.trackId)
    }catch(e:any){ setError(e?.message||'failed') }
    finally{ setLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Env & BGM</h1>
        <div className="text-sm text-neutral-500">{loading?'Loading…':error? <span className="text-red-600">{error}</span>:''}</div>
      </div>
      <div className="bg-white border rounded p-3 space-y-2 text-sm">
        <div className="grid grid-cols-4 gap-2">
          <select className="border rounded px-2 py-1" value={need} onChange={e=>setNeed(e.target.value as any)}>
            {['calm','sleep','focus','mood_lift','grounding'].map(o=>(<option key={o} value={o}>{o}</option>))}
          </select>
          <select className="border rounded px-2 py-1" value={reg} onChange={e=>setReg(e.target.value as any)}>
            {['downregulate','stabilize','upregulate'].map(o=>(<option key={o} value={o}>{o}</option>))}
          </select>
          <select className="border rounded px-2 py-1" value={timePhase} onChange={e=>setTimePhase(e.target.value as any)}>
            {['dawn','day','dusk','night'].map(o=>(<option key={o} value={o}>{o}</option>))}
          </select>
          <select className="border rounded px-2 py-1" value={weather} onChange={e=>setWeather(e.target.value as any)}>
            {['clear','cloudy','rain','snow'].map(o=>(<option key={o} value={o}>{o}</option>))}
          </select>
        </div>
        <button className="px-3 py-1.5 rounded bg-neutral-900 text-white" onClick={pick}>Pick</button>
        {preset && <pre className="bg-neutral-50 border rounded p-2 overflow-auto text-xs">{JSON.stringify(preset,null,2)}</pre>}
        {track && <div>TrackId: <span className="text-neutral-700">{track}</span></div>}
      </div>
    </div>
  )
}
