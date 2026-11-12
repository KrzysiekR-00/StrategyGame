import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { clearStoredToken } from '../auth/tokenStorage'

type ResourceInfo = {
  resourceCode: string
  quantity: number
}

type BuildingDefinition = {
  code: string
  name: string
  inputResources: ResourceInfo[]
  outputResources: ResourceInfo[]
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
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSettlement()
  }, [settlementId])

  async function handleBuild(buildingType: string) {
    if (!settlementId) {
      setError('Brak identyfikatora osady.')
      return
    }

    setMessage(null)
    setError(null)
    setIsSubmitting(true)

    try {
      const data = await apiRequest<{ message?: string }>(`/api/building`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settlementId: Number(settlementId),
          buildingType,
        }),
        auth: true,
        onUnauthorized: redirectToLogin,
      })

      setMessage(data?.message ?? 'Budynek został wybudowany.')
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

  function formatResourceList(resources: ResourceInfo[] | undefined) {
    if (!resources || resources.length === 0) {
      return 'Brak'
    }

    return resources
      .map((resource) => `${resource.quantity} ${resource.resourceCode}`)
      .join(', ')
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

          <div className="building-construction-panel">
            <h3>Budowanie</h3>

            {definitions.length === 0 ? (
              <p className="empty-state">Brak dostępnych budynków do wybudowania.</p>
            ) : (
              <div className="building-cards">
                {definitions.map((building) => {
                  const isDisabled = isSubmitting || !hasAvailableSlots

                  return (
                    <div key={building.code} className="building-card">
                      <div className="building-card-header">
                        <h4>{building.name}</h4>
                      </div>

                      <div className="building-card-meta">
                        <p>
                          <strong>Konsumuje:</strong> {formatResourceList(building.inputResources)}
                        </p>
                        <p>
                          <strong>Produkuje:</strong> {formatResourceList(building.outputResources)}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="button primary"
                        onClick={() => void handleBuild(building.code)}
                        disabled={isDisabled}
                      >
                        {isSubmitting ? 'Budowanie...' : 'Wybuduj'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {message && <p className="alert success" role="status">{message}</p>}
          {!hasAvailableSlots && <p className="alert error">Brak wolnych slotów w tej osadzie.</p>}
        </>
      ) : (
        <p className="empty-state">Nie znaleziono osady.</p>
      )}
    </section>
  )
}
