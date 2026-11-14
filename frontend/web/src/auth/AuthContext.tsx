import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { clearCachedCurrentUser } from './currentUser'
import { clearStoredToken, getStoredToken, setStoredToken } from './tokenStorage'

type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())

  const login = useCallback((nextToken: string) => {
    setStoredToken(nextToken)
    setToken(nextToken)
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    clearCachedCurrentUser()
    setToken(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [login, logout, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
