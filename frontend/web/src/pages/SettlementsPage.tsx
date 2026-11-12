import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { clearStoredToken } from '../auth/tokenStorage'

type SettlementItem = {
  id: number
  name: string
  foundedAt: string
  level: number
}

export function SettlementsPage() {
  const navigate = useNavigate()
  const [settlements, setSettlements] = useState<SettlementItem[]>([])
  const [name, setName] = useState('Osada 1')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function redirectToLogin() {
    clearStoredToken()
    navigate('/login', { replace: true })
  }

  async function loadSettlements() {
    try {
      const data = await apiRequest<{ items?: SettlementItem[] }>('/api/settlement/me', {
        method: 'GET',
        auth: true,
        onUnauthorized: redirectToLogin,
      })

      setSettlements(Array.isArray(data?.items) ? data.items : [])
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettlements()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const trimmedName = name.trim()
    setIsSubmitting(true)

    try {
      const data = await apiRequest<{ message?: string }>('/api/settlement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName || 'Osada 1',
          level: 1,
        }),
        auth: true,
        onUnauthorized: redirectToLogin,
      })

      setMessage(data?.message ?? 'Osada została utworzona.')
      setName('Osada 1')
      await loadSettlements()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatDate(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString('pl-PL', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  return (
    <>
      <section className="card form-card settlement-card">
        <div className="page-header">
          <h2>Nowa osada</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Nazwa osady</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="Osada 1"
            />
          </label>

          <button type="submit" disabled={isSubmitting} className="button primary">
            {isSubmitting ? 'Tworzenie...' : 'Utwórz osadę'}
          </button>
        </form>

        {error && <p className="alert error" role="alert">{error}</p>}
        {message && <p className="alert success" role="status">{message}</p>}
      </section>

      <section className="card list-card">
        <h2>Moje osady</h2>

        {isLoading ? (
          <p className="empty-state">Ładowanie osad...</p>
        ) : settlements.length === 0 ? (
          <p className="empty-state">Nie masz jeszcze żadnych osad.</p>
        ) : (
          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Poziom</th>
                  <th>Data założenia</th>
                  <th>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td>{settlement.name}</td>
                    <td>{settlement.level}</td>
                    <td>{formatDate(settlement.foundedAt)}</td>
                    <td>
                      <Link to={`/protected/settlements/${settlement.id}`} className="button secondary compact-button">
                        Podgląd
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
