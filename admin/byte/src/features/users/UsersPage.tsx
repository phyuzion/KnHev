import { useEffect, useState } from 'react'
import { getUserProfile, upsertUserProfile, getUserSettings, upsertUserSettings, listUserDevices, upsertUserDevice, listUsers, type UserProfile, type UserSettings, type UserDevice } from '../../api'
import { useToast } from '../../components/Toast'
import { canWrite } from '../../lib/auth'

export default function UsersPage() {
  const { notify } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [draftProfile, setDraftProfile] = useState('')
  const [draftSettings, setDraftSettings] = useState('')
  const [draftDevice, setDraftDevice] = useState('{"device_id":"dev_local"}')
  const [quickDeviceId, setQuickDeviceId] = useState('')
  const [quickPlatform, setQuickPlatform] = useState('')
  const [quickModel, setQuickModel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<Array<{ _id: string; display_name?: string; locale?: string; avatar_url?: string; updated_at?: string }>>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newUserId, setNewUserId] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')

  async function refresh() {
    setLoading(true); setError('')
    try {
      const [p, s, d, us] = await Promise.all([
        getUserProfile().catch(()=>null as any),
        getUserSettings().catch(()=>null as any),
        listUserDevices().catch(()=>({ items: [] })),
        listUsers(100).catch(()=>({ items: [] })),
      ])
      if (p) { setProfile(p); setDraftProfile(JSON.stringify(p, null, 2)) }
      if (s) { setSettings(s); setDraftSettings(JSON.stringify(s, null, 2)) }
      setDevices(d.items || [])
      setUsers(us.items || [])
    } catch (e: any) { setError(e?.message || 'load_failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  async function saveProfile() {
    setLoading(true); setError('')
    try { const saved = await upsertUserProfile(JSON.parse(draftProfile||'{}')); setProfile(saved) }
    catch (e:any){ setError(e?.message||'save_failed') }
    finally{ setLoading(false) }
  }
  async function saveSettings() {
    setLoading(true); setError('')
    try { const saved = await upsertUserSettings(JSON.parse(draftSettings||'{}')); setSettings(saved) }
    catch (e:any){ setError(e?.message||'save_failed') }
    finally{ setLoading(false) }
  }
  async function saveDevice() {
    setLoading(true); setError('')
    try { const saved = await upsertUserDevice(JSON.parse(draftDevice||'{}')); setDevices(prev=>[saved, ...prev]); notify({ type:'success', message:'Device saved' }) }
    catch (e:any){ setError(e?.message||'save_failed') }
    finally{ setLoading(false) }
  }

  async function quickAddDevice() {
    if (!quickDeviceId) { setError('device_id required'); return }
    setLoading(true); setError('')
    try {
      const saved = await upsertUserDevice({ device_id: quickDeviceId, platform: quickPlatform || undefined, model: quickModel || undefined })
      setDevices(prev=>[saved, ...prev]);
      setQuickDeviceId(''); setQuickPlatform(''); setQuickModel('');
      notify({ type:'success', message:'Device added' })
    } catch (e:any) { setError(e?.message||'save_failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <div className="text-sm text-neutral-500">{loading?'Loading…':error? <span className="text-red-600">{error}</span>:''}</div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <section className="bg-white border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Users</div>
            <button className="px-2 py-1 text-sm border rounded" onClick={()=>setShowCreate(true)}>Create</button>
          </div>
          <div className="text-sm border rounded p-2 max-h-[420px] overflow-auto">
            {users.map(u => (
              <div key={u._id} className="border-b py-1 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-200" />
                <div className="flex-1">
                  <div className="font-medium text-neutral-800">{u.display_name || u._id}</div>
                  <div className="text-xs text-neutral-500">{u.locale||'ko'} · {u.updated_at?.slice(0,19).replace('T',' ')}</div>
                </div>
              </div>
            ))}
            {!users.length && <div className="text-neutral-500">No users.</div>}
          </div>
        </section>
        <section className="bg-white border rounded p-3">
          <div className="font-medium mb-2">Profile</div>
          <textarea className="w-full h-[220px] font-mono text-sm p-2 border rounded" value={draftProfile} onChange={e=>setDraftProfile(e.target.value)} />
          <div className="mt-2 text-right">{canWrite('users') && <button className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm" onClick={saveProfile}>Save</button>}</div>
        </section>
        <section className="bg-white border rounded p-3">
          <div className="font-medium mb-2">Settings</div>
          <textarea className="w-full h-[220px] font-mono text-sm p-2 border rounded" value={draftSettings} onChange={e=>setDraftSettings(e.target.value)} />
          <div className="mt-2 text-right">{canWrite('users') && <button className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm" onClick={saveSettings}>Save</button>}</div>
        </section>
        <section className="bg-white border rounded p-3">
          <div className="font-medium mb-2">Devices</div>
          <div className="text-sm border rounded p-2 mb-2 max-h-[180px] overflow-auto">
            {devices.map(d => (<div key={d._id||d.device_id} className="border-b py-1"><span className="text-neutral-700">{d.device_id}</span> <span className="text-neutral-400">{d.platform||''}</span></div>))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="device_id" value={quickDeviceId} onChange={e=>setQuickDeviceId(e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="platform" value={quickPlatform} onChange={e=>setQuickPlatform(e.target.value)} />
            <input className="border rounded px-2 py-1 text-sm" placeholder="model" value={quickModel} onChange={e=>setQuickModel(e.target.value)} />
          </div>
          <div className="mb-3 text-right">{canWrite('users') && <button className="px-3 py-1.5 rounded border text-sm" onClick={quickAddDevice}>Quick Add</button>}</div>
          <textarea className="w-full h-[120px] font-mono text-sm p-2 border rounded" value={draftDevice} onChange={e=>setDraftDevice(e.target.value)} />
          <div className="mt-2 text-right">{canWrite('users') && <button className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm" onClick={saveDevice}>Upsert Device</button>}</div>
        </section>
      </div>
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white w-[420px] rounded shadow border p-4 space-y-3">
            <div className="font-semibold">Create User</div>
            <div className="grid gap-2">
              <input className="border rounded px-2 py-1" placeholder="user id (email or uid)" value={newUserId} onChange={e=>setNewUserId(e.target.value)} />
              <input className="border rounded px-2 py-1" placeholder="display name" value={newDisplayName} onChange={e=>setNewDisplayName(e.target.value)} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button className="px-3 py-1.5 text-sm" onClick={()=>setShowCreate(false)}>Cancel</button>
              <button className="px-3 py-1.5 bg-neutral-900 text-white rounded text-sm" onClick={async()=>{
                try {
                  await upsertUserProfile({ userId: newUserId, display_name: newDisplayName })
                  setShowCreate(false); setNewUserId(''); setNewDisplayName('');
                  refresh()
                } catch (e:any) { setError(e?.message||'create_failed') }
              }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
