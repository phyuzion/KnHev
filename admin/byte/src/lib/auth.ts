export type Role = 'admin' | 'operator' | 'reviewer'

export function getRoles(): Role[] {
  try {
    const raw = localStorage.getItem('roles')
    if (!raw || !raw.trim()) return ['admin']
    return raw.split(',').map(s => s.trim()).filter(Boolean) as Role[]
  } catch {
    return ['admin']
  }
}

export function hasRole(role: Role): boolean {
  return getRoles().includes(role)
}

type Resource = 'scenarios'|'curriculum'|'users'|'assets'|'env'|'storage'|'realtime'|'ai'

// Simple policy matrix; server must enforce real guards
export function canWrite(resource: Resource): boolean {
  const roles = getRoles()
  if (roles.includes('admin')) return true
  if (roles.includes('operator')) {
    return ['scenarios','curriculum','users','assets','env','storage','realtime','ai'].includes(resource)
  }
  // reviewer: read-only
  return false
}


