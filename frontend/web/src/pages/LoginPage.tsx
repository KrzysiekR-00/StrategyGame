import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { setStoredToken } from '../auth/tokenStorage'

type LoginPageProps = {
  onLoginSuccess: (token: string) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
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
        const serverMessage = data?.message ?? 'Nieprawidłowy login lub hasło.'
        throw new Error(String(serverMessage))
      }

      if (data?.token) {
        setStoredToken(data.token)
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
