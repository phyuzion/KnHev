import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastItem = { id: number; type: 'success'|'error'|'info'; message: string }

const ToastCtx = createContext<{ notify: (t: Omit<ToastItem,'id'>) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const notify = useCallback((t: Omit<ToastItem,'id'>) => {
    const id = Date.now() + Math.random()
    setItems(prev => [...prev, { id, ...t }])
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 2500)
  }, [])
  const value = useMemo(()=>({ notify }), [notify])
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-4 space-y-2 z-50">
        {items.map(i => (
          <div key={i.id} className={`px-3 py-2 rounded shadow text-sm text-white ${i.type==='success'?'bg-green-600':i.type==='error'?'bg-red-600':'bg-neutral-800'}`}>{i.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('ToastProvider missing')
  return ctx
}


