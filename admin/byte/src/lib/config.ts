const MODE = (import.meta as any).env?.MODE as 'development'|'production'|'test' | undefined
const ENV_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined
const ENV_BASE_DEV = (import.meta as any).env?.VITE_API_BASE_DEV as string | undefined
const ENV_BASE_PROD = (import.meta as any).env?.VITE_API_BASE_PROD as string | undefined

function resolveEnvApiBase(): string {
  if (ENV_BASE) return ENV_BASE
  if (MODE === 'development' && ENV_BASE_DEV) return ENV_BASE_DEV
  if (MODE === 'production' && ENV_BASE_PROD) return ENV_BASE_PROD
  return 'http://127.0.0.1:3001'
}

let apiBase: string =
  (typeof localStorage !== 'undefined' && localStorage.getItem('apiBase')) ||
  resolveEnvApiBase();

export function getApiBase(): string { return apiBase }
export function setApiBase(v: string) {
  apiBase = v;
  try { localStorage.setItem('apiBase', v); } catch {}
}

export function getIdToken(): string | null {
  try { return localStorage.getItem('idToken'); } catch { return null }
}
export function setIdToken(token: string | null) {
  try {
    if (token) localStorage.setItem('idToken', token);
    else localStorage.removeItem('idToken');
  } catch {}
}

export function getEnvApiBase(): string { return resolveEnvApiBase() }

export function toWsUrl(path: string): string {
  const base = getApiBase().replace(/\/$/, '')
  const wsBase = base.startsWith('https') ? base.replace('https', 'wss') : base.replace('http', 'ws')
  return `${wsBase}${path.startsWith('/') ? path : `/${path}`}`
}

