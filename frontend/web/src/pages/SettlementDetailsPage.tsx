import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { clearStoredToken } from '../auth/tokenStorage'

type SettlementDetails = {
  id: number
  name: string
  foundedAt: string
  level: number
}

export function SettlementDetailsPage() {
  const { settlementId } = useParams()
  const navigate = useNavigate()
  const [settlement, setSettlement] = useState<SettlementDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function redirectToLogin() {
    clearStoredToken()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    async function loadSettlement() {
      if (!settlementId) {
        setError('Brak identyfikatora osady.')
        setIsLoading(false)
        return
      }

      try {
        const data = await apiRequest<SettlementDetails>(`/api/settlement/${encodeURIComponent(settlementId)}`, {
          method: 'GET',
          auth: true,
          onUnauthorized: redirectToLogin,
        })

        setSettlement(data)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettlement()
  }, [settlementId])

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
    <section className="card list-card">
      <div className="page-header">
        <h2>Podgląd osady</h2>
        <Link to="/protected/settlements" className="button secondary">
          Wróć do osad
        </Link>
      </div>

      {isLoading ? (
        <p className="empty-state">Ładowanie danych osady...</p>
      ) : error ? (
        <p className="alert error" role="alert">{error}</p>
      ) : settlement ? (
        <div className="settlement-details">
          <p>
            <strong>Nazwa:</strong> {settlement.name}
          </p>
          <p>
            <strong>Poziom:</strong> {settlement.level}
          </p>
          <p>
            <strong>Data założenia:</strong> {formatDate(settlement.foundedAt)}
          </p>
        </div>
      ) : (
        <p className="empty-state">Nie znaleziono osady.</p>
      )}
    </section>
  )
}
