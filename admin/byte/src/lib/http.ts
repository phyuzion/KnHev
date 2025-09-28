import { getApiBase, getIdToken } from './config'

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = getIdToken();
  if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;
  // dev bypass header to match server DEV_AUTH_BYPASS
  if (!headers['Authorization']) headers['x-user-id'] = headers['x-user-id'] || 'dev-admin';
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
