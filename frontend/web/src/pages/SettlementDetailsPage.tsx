import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { clearStoredToken } from '../auth/tokenStorage'

type BuildingDefinition = {
  code: string
  name: string
}

type BuiltBuilding = {
  id: number
  buildingType: string
  name: string
  builtAt: string
}

type SettlementDetails = {
  id: number
  name: string
  foundedAt: string
  level: number
  maxSlots: number
  occupiedSlots: number
  availableSlots: number
  buildings: BuiltBuilding[]
}

export function SettlementDetailsPage() {
  const { settlementId } = useParams()
  const navigate = useNavigate()
  const [settlement, setSettlement] = useState<SettlementDetails | null>(null)
  const [definitions, setDefinitions] = useState<BuildingDefinition[]>([])
  const [selectedBuildingType, setSelectedBuildingType] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function redirectToLogin() {
    clearStoredToken()
    navigate('/login', { replace: true })
  }

  async function loadSettlement() {
    if (!settlementId) {
      setError('Brak identyfikatora osady.')
      setIsLoading(false)
      return
    }

    try {
      const [settlementData, definitionsData] = await Promise.all([
        apiRequest<SettlementDetails>(`/api/settlement/${encodeURIComponent(settlementId)}`, {
          method: 'GET',
          auth: true,
          onUnauthorized: redirectToLogin,
        }),
        apiRequest<BuildingDefinition[]>('/api/building/definitions', {
          method: 'GET',
          auth: true,
          onUnauthorized: redirectToLogin,
        }),
      ])

      setSettlement(settlementData)
      setDefinitions(definitionsData)
      setSelectedBuildingType(definitionsData[0]?.code ?? '')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettlement()
  }, [settlementId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!settlementId || !selectedBuildingType) {
      setError('Wybierz typ budynku.')
      return
    }

    setIsSubmitting(true)

    try {
      const data = await apiRequest<{ message?: string; availableSlots?: number }>(`/api/building`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settlementId: Number(settlementId),
          buildingType: selectedBuildingType,
        }),
        auth: true,
        onUnauthorized: redirectToLogin,
      })

      setMessage(data?.message ?? 'Budynk został wybudowany.')
      await loadSettlement()
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

  const hasAvailableSlots = (settlement?.availableSlots ?? 0) > 0

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
        <>
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
            <p>
              <strong>Sloty:</strong> {settlement.occupiedSlots}/{settlement.maxSlots} ({settlement.availableSlots} wolnych)
            </p>
          </div>

          <div className="building-section">
            <h3>Budynki w osadzie</h3>

            {settlement.buildings.length === 0 ? (
              <p className="empty-state">W tej osadzie nie ma jeszcze żadnych budynków.</p>
            ) : (
              <ul className="building-list">
                {settlement.buildings.map((building) => (
                  <li key={building.id} className="building-item">
                    <span>{building.name}</span>
                    <small>{formatDate(building.builtAt)}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleSubmit} className="auth-form building-form">
            <label>
              <span>Typ budynku</span>
              <select
                value={selectedBuildingType}
                onChange={(event) => setSelectedBuildingType(event.target.value)}
                disabled={!hasAvailableSlots || definitions.length === 0}
              >
                {definitions.length === 0 ? (
                  <option value="">Brak dostępnych budynków</option>
                ) : (
                  definitions.map((building) => (
                    <option key={building.code} value={building.code}>
                      {building.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <button type="submit" className="button primary" disabled={isSubmitting || !hasAvailableSlots || definitions.length === 0}>
              {isSubmitting ? 'Budowanie...' : 'Wybuduj budynek'}
            </button>
          </form>

          {message && <p className="alert success" role="status">{message}</p>}
          {!hasAvailableSlots && <p className="alert error">Brak wolnych slotów w tej osadzie.</p>}
        </>
      ) : (
        <p className="empty-state">Nie znaleziono osady.</p>
      )}
    </section>
  )
}
