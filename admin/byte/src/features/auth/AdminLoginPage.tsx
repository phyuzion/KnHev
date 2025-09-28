import { useState } from 'react'
import { adminLogin } from '../../api'
import { setIdToken } from '../../lib/config'

export default function AdminLoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('1111')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true); setError('')
    try {
      const r = await adminLogin({ username, password })
      setIdToken(r.token)
      onLoggedIn()
    } catch (e:any) {
      setError(e?.message || 'login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50">
      <div className="w-[360px] bg-white border rounded p-6 space-y-4 shadow-sm">
        <div className="text-lg font-semibold">Admin Login</div>
        <div className="space-y-2">
          <input className="w-full border rounded px-3 py-2" placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="w-full px-3 py-2 bg-neutral-900 text-white rounded disabled:opacity-50" onClick={submit} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        <div className="text-xs text-neutral-500">Default: admin / 1111</div>
      </div>
    </div>
  )
}


