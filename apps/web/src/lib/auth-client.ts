// Client-side auth utilities
export interface User {
  id: number
  email: string
  username: string
  name: string
  avatarUrl: string | null
  role: 'user' | 'admin'
  createdAt: Date
}

const USER_STORAGE_KEY = 'megdb_user'

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export function parseStoredUser(v: unknown): User | null {
  if (!isRecord(v)) return null
  if (typeof v.id !== 'number' || typeof v.email !== 'string' || typeof v.username !== 'string')
    return null
  if (typeof v.name !== 'string') return null
  if (v.role !== 'user' && v.role !== 'admin') return null
  if (v.avatarUrl !== null && typeof v.avatarUrl !== 'string') return null
  if (!(v.createdAt instanceof Date) && typeof v.createdAt !== 'string') return null
  const createdAt = v.createdAt instanceof Date ? v.createdAt : new Date(String(v.createdAt))
  if (Number.isNaN(createdAt.getTime())) return null
  return {
    id: v.id,
    email: v.email,
    username: v.username,
    name: v.name,
    avatarUrl: v.avatarUrl === null ? null : v.avatarUrl,
    role: v.role,
    createdAt,
  }
}

export function saveUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(USER_STORAGE_KEY)
  if (!stored) return null

  try {
    const parsed: unknown = JSON.parse(stored)
    return parseStoredUser(parsed)
  } catch {
    return null
  }
}

export function clearUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}

