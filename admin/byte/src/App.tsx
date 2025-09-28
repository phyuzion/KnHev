import './index.css'
import { useState } from 'react'
import { getApiBase, setApiBase } from './api'
import { getIdToken } from './lib/config'
import AdminLoginPage from './features/auth/AdminLoginPage'
import ScenariosPage from './features/scenarios/ScenariosPage'
import CurriculumPage from './features/curriculum/CurriculumPage'
import UsersPage from './features/users/UsersPage'
import StoragePage from './features/storage/StoragePage'
import RealtimePage from './features/realtime/RealtimePage'
import AIConsolePage from './features/ai/AIConsolePage'
import OrchestrationLabPage from './features/ai/OrchestrationLabPage'
import Assets3DPage from './features/assets/Assets3DPage'
import EnvBgmPage from './features/env/EnvBgmPage'
import BiblePage from './features/bible/BiblePage'

type Tab = 'scenarios' | 'curriculum' | 'users' | 'assets' | 'env' | 'storage' | 'realtime' | 'ai' | 'bible' | 'lab'

function App() {
  const [tab, setTab] = useState<Tab>('scenarios')
  const [token, setToken] = useState<string | null>(getIdToken())
  const [apiBaseInput, setApiBaseInput] = useState<string>(getApiBase())

  function applyApiBase() { setApiBase(apiBaseInput) }

  if (!token) {
    return <AdminLoginPage onLoggedIn={()=>setToken(getIdToken())} />
  }

  return (
    <div className="min-h-screen">
      <header className="h-16 border-b bg-white/80 backdrop-blur sticky top-0 z-10 flex items-center px-6 justify-between">
        <div className="font-semibold">KnHev Admin</div>
        <div className="text-sm text-neutral-500 flex items-center gap-3">
          <input className="border rounded px-2 py-1 w-[280px]" placeholder="http://127.0.0.1:3001" value={apiBaseInput} onChange={e=>setApiBaseInput(e.target.value)} />
          <button className="px-2 py-1 border rounded" onClick={applyApiBase}>Set API</button>
        </div>
      </header>
      <div className="grid grid-cols-[300px_minmax(700px,1fr)_380px] gap-0 min-h-[calc(100vh-4rem)]">
        <aside className="border-r bg-white p-4 overflow-y-auto">
          <nav className="space-y-2 text-sm">
            <div className="font-semibold text-neutral-700 mb-2">Navigation</div>
            <ul className="space-y-1">
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='scenarios'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('scenarios')}>Scenarios</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='curriculum'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('curriculum')}>Curriculum</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='bible'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('bible')}>Bible/Knowledge/MAGI</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='users'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('users')}>Users</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='assets'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('assets')}>Assets3D</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='env'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('env')}>Env & BGM</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='storage'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('storage')}>Storage</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='realtime'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('realtime')}>Realtime</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='ai'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('ai')}>AI Console</button></li>
              <li><button className={`w-full text-left block px-2 py-1 rounded ${tab==='lab'?'bg-neutral-900 text-white':'hover:bg-neutral-100'}`} onClick={()=>setTab('lab')}>Orchestration Lab</button></li>
            </ul>
          </nav>
        </aside>
        <main className="overflow-y-auto">
          {tab==='scenarios' ? <ScenariosPage /> :
           tab==='curriculum' ? <CurriculumPage /> :
           tab==='bible' ? <BiblePage /> :
           tab==='users' ? <UsersPage /> :
           tab==='assets' ? <Assets3DPage /> :
           tab==='env' ? <EnvBgmPage /> :
           tab==='storage' ? <StoragePage /> :
           tab==='realtime' ? <RealtimePage /> :
           tab==='ai' ? <AIConsolePage /> :
           <OrchestrationLabPage />}
        </main>
        <section className="border-l bg-white p-4 overflow-y-auto">
          <div className="font-semibold text-neutral-700 mb-2">Inspector</div>
          <div className="text-sm text-neutral-500">Feature-specific inspector panels will appear in future steps.</div>
        </section>
      </div>
    </div>
  )
}

export default App
