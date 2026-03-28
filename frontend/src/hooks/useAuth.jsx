import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('biosync_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('biosync_token', data.access_token)
    localStorage.setItem('biosync_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (email, name, password) => {
    const { data } = await authAPI.register({ email, name, password })
    localStorage.setItem('biosync_token', data.access_token)
    localStorage.setItem('biosync_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('biosync_token')
    localStorage.removeItem('biosync_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
