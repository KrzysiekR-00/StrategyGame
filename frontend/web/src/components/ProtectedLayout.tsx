import { Link, Outlet } from 'react-router-dom'

type ProtectedLayoutProps = {
  onLogout: () => void
}

export function ProtectedLayout({ onLogout }: ProtectedLayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <nav className="nav" aria-label="Menu chronione">
          <Link to="/protected">Test</Link>
          <button type="button" className="button secondary" onClick={onLogout}>
            Wyloguj
          </button>
        </nav>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
