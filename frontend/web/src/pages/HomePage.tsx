import { Link } from 'react-router-dom'

export function HomePage() {
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
