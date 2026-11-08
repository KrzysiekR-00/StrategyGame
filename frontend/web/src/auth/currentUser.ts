import { apiRequest } from '../api/client'

export type CurrentUser = {
  id: string
  username: string
}

type CachedCurrentUser = CurrentUser & {
  cachedAt: number
}

const CACHE_KEY = 'currentUserCache'
const CACHE_TTL_MS = 5 * 60 * 1000

function isCacheFresh(user: CachedCurrentUser | null): boolean {
  if (!user) {
    return false
  }

  return Date.now() - user.cachedAt < CACHE_TTL_MS
}

export function getCachedCurrentUser(): CurrentUser | null {
  const raw = sessionStorage.getItem(CACHE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as CachedCurrentUser | null
    if (!parsed || !parsed.id || !parsed.username) {
      return null
    }

    return isCacheFresh(parsed) ? { id: parsed.id, username: parsed.username } : null
  } catch {
    return null
  }
}

export function setCachedCurrentUser(user: CurrentUser): void {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...user, cachedAt: Date.now() }))
}

export function clearCachedCurrentUser(): void {
  sessionStorage.removeItem(CACHE_KEY)
}

export async function fetchCurrentUser(onUnauthorized?: () => void): Promise<CurrentUser> {
  const cachedUser = getCachedCurrentUser()
  if (cachedUser) {
    return cachedUser
  }

  const user = await apiRequest<CurrentUser>('/api/user/me', {
    method: 'GET',
    auth: true,
    onUnauthorized,
  })

  setCachedCurrentUser(user)
  return user
}
