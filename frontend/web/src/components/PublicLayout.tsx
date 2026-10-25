import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <nav className="nav" aria-label="Menu główne">
          <Link to="/">Strona główna</Link>
          <Link to="/register">Rejestracja</Link>
          <Link to="/login">Logowanie</Link>
        </nav>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
