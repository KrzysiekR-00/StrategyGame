import { useState } from 'react'
import type { FormEvent } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [apiResponse, setApiResponse] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<number | null>(null)

  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [loginMessage, setLoginMessage] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)

  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  async function callGreeting() {
    try {
      const res = await fetch('/api/test/greeting')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApiResponse(data?.message ?? JSON.stringify(data))
    } catch (err) {
      setApiResponse(String(err))
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegistrationMessage(null)
    setRegistrationError(null)

    if (registerUsername.trim().length < 3) {
      setRegistrationError('Login musi mieć co najmniej 3 znaki.')
      return
    }

    if (registerPassword.length < 8) {
      setRegistrationError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }

    setIsRegistering(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: registerUsername.trim(), password: registerPassword }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const errors = data?.errors
          ? Object.values(data.errors).flat().join(' ')
          : data?.title ?? 'Nie udało się zarejestrować użytkownika.'
        throw new Error(String(errors))
      }

      setRegistrationMessage(data?.message ?? 'Rejestracja zakończona pomyślnie.')
      setRegisterUsername('')
      setRegisterPassword('')
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsRegistering(false)
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginMessage(null)
    setLoginError(null)

    if (loginUsername.trim().length < 3) {
      setLoginError('Login musi mieć co najmniej 3 znaki.')
      return
    }

    if (loginPassword.length < 8) {
      setLoginError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }

    setIsLoggingIn(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message = data?.message ?? 'Nieprawidłowy login lub hasło.'
        throw new Error(String(message))
      }

      if (data?.token) {
        localStorage.setItem('authToken', data.token)
      }

      setLoginMessage(data?.message ?? 'Zalogowano pomyślnie.')
      setLoginUsername('')
      setLoginPassword('')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function createTestRecord() {
    try {
      const res = await fetch('/api/testdb/create')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setCreatedId(data?.id ?? null)
    } catch (err) {
      setApiResponse(String(err))
    }
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={callGreeting}>
            Call API: Greeting
          </button>
          <button style={{ marginLeft: 8 }} type="button" onClick={createTestRecord}>
            Create test record
          </button>
          {apiResponse && (
            <div style={{ marginTop: 8 }}>
              <strong>API:</strong> <span>{apiResponse}</span>
            </div>
          )}
          {createdId !== null && (
            <div style={{ marginTop: 8 }}>
              <strong>Created record id:</strong> <span>{createdId}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 24 }}>
          <form onSubmit={register} style={{ minWidth: 260 }}>
            <h2>Rejestracja</h2>
            <div>
              <label htmlFor="register-username">Login</label>
              <input
                id="register-username"
                type="text"
                value={registerUsername}
                onChange={(event) => setRegisterUsername(event.target.value)}
                minLength={3}
                maxLength={30}
                required
                autoComplete="username"
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <label htmlFor="register-password">Hasło</label>
              <input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                minLength={8}
                maxLength={100}
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={isRegistering} style={{ marginTop: 8 }}>
              {isRegistering ? 'Rejestracja...' : 'Zarejestruj'}
            </button>
            {registrationError && <p role="alert">{registrationError}</p>}
            {registrationMessage && <p role="status">{registrationMessage}</p>}
          </form>

          <form onSubmit={login} style={{ minWidth: 260 }}>
            <h2>Logowanie</h2>
            <div>
              <label htmlFor="login-username">Login</label>
              <input
                id="login-username"
                type="text"
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                minLength={3}
                maxLength={30}
                required
                autoComplete="username"
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <label htmlFor="login-password">Hasło</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                minLength={8}
                maxLength={100}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={isLoggingIn} style={{ marginTop: 8 }}>
              {isLoggingIn ? 'Logowanie...' : 'Zaloguj'}
            </button>
            {loginError && <p role="alert">{loginError}</p>}
            {loginMessage && <p role="status">{loginMessage}</p>}
          </form>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
