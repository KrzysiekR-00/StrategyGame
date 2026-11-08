import { useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { clearStoredToken, getStoredToken } from './auth/tokenStorage'
import { ProtectedLayout } from './components/ProtectedLayout'
import { PublicLayout } from './components/PublicLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProtectedPage } from './pages/ProtectedPage'
import { RegisterPage } from './pages/RegisterPage'
import { SettlementsPage } from './pages/SettlementsPage'
import './App.css'

function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken())

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken)
  }

  const handleLogout = () => {
    clearStoredToken()
    setToken(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/protected" replace /> : <RegisterPage />}
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/protected" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
            }
          />
        </Route>

        <Route
          path="/protected"
          element={isAuthenticated ? <ProtectedLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<ProtectedPage />} />
          <Route path="settlements" element={<SettlementsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
