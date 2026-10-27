import { getStoredToken } from '../auth/tokenStorage'

type RequestOptions = RequestInit & {
  auth?: boolean
  onUnauthorized?: () => void
}

async function parseJsonSafely(response: Response) {
  try {
    const text = await response.text()
    if (!text) {
      return null
    }

    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, onUnauthorized, headers, ...rest } = options
  const requestHeaders = new Headers(headers)

  if (auth) {
    const token = getStoredToken()
    if (!token) {
      onUnauthorized?.()
      throw new Error('Brak sesji. Zaloguj się ponownie.')
    }

    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  })

  const data = await parseJsonSafely(response)

  if (response.status === 401 || response.status === 403) {
    onUnauthorized?.()
    throw new Error(data?.message ?? 'Sesja wygasła. Zaloguj się ponownie.')
  }

  if (!response.ok) {
    throw new Error(data?.message ?? 'Wystąpił nieoczekiwany błąd.')
  }

  return (data ?? undefined) as T
}
