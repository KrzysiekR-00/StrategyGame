import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedLayout } from './components/ProtectedLayout'
import { PublicLayout } from './components/PublicLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SettlementDetailsPage } from './pages/SettlementDetailsPage'
import { SettlementsPage } from './pages/SettlementsPage'
import './App.css'

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/protected" replace /> : <RegisterPage />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/protected" replace /> : <LoginPage />}
        />
      </Route>

      <Route
        path="/protected"
        element={isAuthenticated ? <ProtectedLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<SettlementsPage />} />
        <Route path="settlements" element={<SettlementsPage />} />
        <Route path="settlements/:settlementId" element={<SettlementDetailsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
