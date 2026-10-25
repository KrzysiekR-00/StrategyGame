import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import './App.css'

function getStoredToken() {
  return localStorage.getItem('authToken')
}

function clearStoredToken() {
  localStorage.removeItem('authToken')
}

function PublicLayout() {
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

function HomePage() {
  return (
    <section className="card">
      <h1>StrategyGame</h1>
      <p className="lead">Witaj w aplikacji. Zarejestruj się albo zaloguj, aby przejść dalej.</p>
      <div className="button-row">
        <Link className="button primary" to="/register">
          Rejestracja
        </Link>
        <Link className="button secondary" to="/login">
          Logowanie
        </Link>
      </div>
    </section>
  )
}

function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (username.trim().length < 3) {
      setError('Login musi mieć co najmniej 3 znaki.')
      return
    }

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const errors = data?.errors
          ? Object.values(data.errors).flat().join(' ')
          : data?.title ?? 'Nie udało się zarejestrować użytkownika.'
        throw new Error(String(errors))
      }

      setMessage(data?.message ?? 'Rejestracja zakończona pomyślnie.')
      setUsername('')
      setPassword('')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card form-card">
      <h2>Rejestracja</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          <span>Login</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            maxLength={30}
            required
            autoComplete="username"
          />
        </label>

        <label>
          <span>Hasło</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={100}
            required
            autoComplete="new-password"
          />
        </label>

        <button type="submit" disabled={isSubmitting} className="button primary">
          {isSubmitting ? 'Rejestracja...' : 'Zarejestruj'}
        </button>
      </form>

      {error && <p className="alert error" role="alert">{error}</p>}
      {message && <p className="alert success" role="status">{message}</p>}
    </section>
  )
}

function LoginPage({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (username.trim().length < 3) {
      setError('Login musi mieć co najmniej 3 znaki.')
      return
    }

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message = data?.message ?? 'Nieprawidłowy login lub hasło.'
        throw new Error(String(message))
      }

      if (data?.token) {
        onLoginSuccess(data.token)
      }

      setMessage(data?.message ?? 'Zalogowano pomyślnie.')
      setUsername('')
      setPassword('')
      navigate('/protected', { replace: true })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card form-card">
      <h2>Logowanie</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          <span>Login</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            maxLength={30}
            required
            autoComplete="username"
          />
        </label>

        <label>
          <span>Hasło</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={100}
            required
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={isSubmitting} className="button primary">
          {isSubmitting ? 'Logowanie...' : 'Zaloguj'}
        </button>
      </form>

      {error && <p className="alert error" role="alert">{error}</p>}
      {message && <p className="alert success" role="status">{message}</p>}
    </section>
  )
}

function ProtectedPage({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<number | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const token = getStoredToken()
    if (!token) {
      onLogout()
      navigate('/login', { replace: true })
      return
    }

    if (text.trim().length < 1) {
      setError('Tekst nie może być pusty.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/testdb/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      const data = await response.json().catch(() => null)

      if (response.status === 401 || response.status === 403) {
        clearStoredToken()
        onLogout()
        navigate('/login', { replace: true })
        throw new Error('Sesja wygasła. Zaloguj się ponownie.')
      }

      if (!response.ok) {
        throw new Error(data?.message ?? 'Nie udało się dodać rekordu.')
      }

      setCreatedId(data?.id ?? null)
      setMessage(data?.message ?? 'Rekord dodany pomyślnie.')
      setText('')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card form-card protected-card">
      <div className="page-header">
        <h2>Dodaj testowy rekord</h2>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            clearStoredToken()
            onLogout()
            navigate('/login', { replace: true })
          }}
        >
          Wyloguj
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          <span>Tekst</span>
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={500}
            required
            placeholder="Wpisz tekst rekordu"
          />
        </label>

        <button type="submit" disabled={isSubmitting} className="button primary">
          {isSubmitting ? 'Dodawanie...' : 'Dodaj rekord'}
        </button>
      </form>

      {error && <p className="alert error" role="alert">{error}</p>}
      {message && <p className="alert success" role="status">{message}</p>}
      {createdId !== null && <p className="created-id">Utworzono rekord o id: {createdId}</p>}
    </section>
  )
}

function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken())

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('authToken', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    clearStoredToken()
    setToken(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/protected" replace /> : <RegisterPage />}
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/protected" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
            }
          />
        </Route>

        <Route
          path="/protected"
          element={isAuthenticated ? <ProtectedPage onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
