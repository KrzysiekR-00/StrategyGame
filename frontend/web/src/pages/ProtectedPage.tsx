import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredToken, getStoredToken } from '../auth/tokenStorage'

type ProtectedPageProps = {
  onLogout: () => void
}

export function ProtectedPage({ onLogout }: ProtectedPageProps) {
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

  function handleLogoutClick() {
    clearStoredToken()
    onLogout()
    navigate('/login', { replace: true })
  }

  return (
    <section className="card form-card protected-card">
      <div className="page-header">
        <h2>Dodaj testowy rekord</h2>
        <button type="button" className="button secondary" onClick={handleLogoutClick}>
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
