import { useState } from 'react'
import type { FormEvent } from 'react'

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    if (password !== confirmPassword) {
      setError('Hasła muszą być takie same.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, confirmPassword }),
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
      setConfirmPassword('')
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

        <label>
          <span>Powtórz hasło</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
