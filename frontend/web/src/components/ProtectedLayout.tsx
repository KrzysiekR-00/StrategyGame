import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { clearCachedCurrentUser, fetchCurrentUser, getCachedCurrentUser } from '../auth/currentUser'
import { clearStoredToken } from '../auth/tokenStorage'

type ProtectedLayoutProps = {
  onLogout: () => void
}

export function ProtectedLayout({ onLogout }: ProtectedLayoutProps) {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(() => getCachedCurrentUser()?.username ?? null)
  const [isLoadingUser, setIsLoadingUser] = useState(!username)

  useEffect(() => {
    let isMounted = true

    const handleUnauthorized = () => {
      clearCachedCurrentUser()
      clearStoredToken()
      onLogout()
      navigate('/login', { replace: true })
    }

    async function loadCurrentUser() {
      try {
        const user = await fetchCurrentUser(handleUnauthorized)
        if (isMounted) {
          setUsername(user.username)
        }
      } catch {
        if (isMounted) {
          setUsername(null)
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false)
        }
      }
    }

    if (!username) {
      void loadCurrentUser()
    } else {
      setIsLoadingUser(false)
    }

    return () => {
      isMounted = false
    }
  }, [navigate, onLogout, username])

  const userLabel = isLoadingUser ? 'Ładowanie...' : username ? `Zalogowany: ${username}` : 'Użytkownik'

  return (
    <div className="app-shell">
      <header className="topbar">
        <nav className="nav" aria-label="Menu chronione">
          <Link to="/protected">Strona chroniona</Link>
          <Link to="/protected/settlements">Osady</Link>
          <span className="user-badge">{userLabel}</span>
          <div className="nav-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                clearCachedCurrentUser()
                clearStoredToken()
                onLogout()
                navigate('/login', { replace: true })
              }}
            >
              Wyloguj
            </button>
          </div>
        </nav>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
