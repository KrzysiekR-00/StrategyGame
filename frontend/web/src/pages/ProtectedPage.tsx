import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { clearStoredToken } from '../auth/tokenStorage'

type ProtectedPageProps = {
  onLogout: () => void
}

type TestRecordItem = {
  id: number
  text: string
  createdByUserId: string
  createdByUsername: string
  createdAt: string
}

export function ProtectedPage({ onLogout }: ProtectedPageProps) {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(true)
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [records, setRecords] = useState<TestRecordItem[]>([])

  function redirectToLogin() {
    clearStoredToken()
    onLogout()
    navigate('/login', { replace: true })
  }

  async function loadRecords() {
    try {
      const data = await apiRequest<{ items?: Partial<TestRecordItem>[] }>('/api/testdb/me', {
        method: 'GET',
        auth: true,
        onUnauthorized: redirectToLogin,
      })

      const nextRecords = Array.isArray(data?.items)
        ? data.items.map((record: Partial<TestRecordItem>) => ({
            id: Number(record.id ?? 0),
            text: String(record.text ?? ''),
            createdByUserId: String(record.createdByUserId ?? ''),
            createdByUsername: String(record.createdByUsername ?? ''),
            createdAt: String(record.createdAt ?? ''),
          }))
        : []

      setRecords(nextRecords)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsLoadingRecords(false)
    }
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (text.trim().length < 1) {
      setError('Tekst nie może być pusty.')
      return
    }

    setIsSubmitting(true)

    try {
      const data = await apiRequest<{ id?: number; message?: string }>('/api/testdb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
        auth: true,
        onUnauthorized: redirectToLogin,
      })

      setCreatedId(data?.id ?? null)
      setMessage(data?.message ?? 'Rekord dodany pomyślnie.')
      setText('')
      await loadRecords()
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

      <section className="card list-card">
        <h2>Moje rekordy</h2>

        {isLoadingRecords ? (
          <p className="empty-state">Ładowanie rekordów...</p>
        ) : records.length === 0 ? (
          <p className="empty-state">Nie masz jeszcze żadnych rekordów.</p>
        ) : (
          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tekst</th>
                  <th>Utworzył</th>
                  <th>Data utworzenia</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td className="record-text">{record.text}</td>
                    <td>{record.createdByUsername || record.createdByUserId}</td>
                    <td>{formatDate(record.createdAt)}</td>
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
