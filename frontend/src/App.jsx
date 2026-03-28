import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import LogEntry from './pages/LogEntry'
import Trends from './pages/Trends'
import RiskReport from './pages/RiskReport'
import Layout from './components/Layout'

function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="log" element={<LogEntry />} />
            <Route path="trends" element={<Trends />} />
            <Route path="risk" element={<RiskReport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
