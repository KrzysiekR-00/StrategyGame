import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { clearCachedCurrentUser, fetchCurrentUser, getCachedCurrentUser } from '../auth/currentUser'
import { clearStoredToken } from '../auth/tokenStorage'

type ProtectedLayoutProps = {
  onLogout: () => void
}

type PlayerResource = {
  resourceCode: string
  resourceName: string
  quantity: number
}

export function ProtectedLayout({ onLogout }: ProtectedLayoutProps) {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(() => getCachedCurrentUser()?.username ?? null)
  const [resources, setResources] = useState<PlayerResource[]>([])
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

    async function loadResources() {
      try {
        const nextResources = await apiRequest<PlayerResource[]>('/api/resource/me', {
          method: 'GET',
          auth: true,
          onUnauthorized: handleUnauthorized,
        })

        if (isMounted) {
          setResources(nextResources)
        }
      } catch {
        if (isMounted) {
          setResources([])
        }
      }
    }

    if (!username) {
      void loadCurrentUser()
    } else {
      setIsLoadingUser(false)
    }

    void loadResources()

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

      <div className="resource-bar" aria-label="Zasoby gracza">
        {resources.length === 0 ? (
          <span className="resource-empty">Ładowanie zasobów...</span>
        ) : (
          resources.map((resource) => (
            <div key={resource.resourceCode} className="resource-pill">
              <span className="resource-name">{resource.resourceName}</span>
              <span className="resource-value">{resource.quantity}</span>
            </div>
          ))
        )}
      </div>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
