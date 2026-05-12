import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import axios from 'axios'

interface Admin {
  id: string
  username: string
  name?: string
  role: string
}

interface AuthContextType {
  admin: Admin | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken')
    const savedAdmin = localStorage.getItem('admin')
    if (savedToken && savedAdmin) {
      setToken(savedToken)
      setAdmin(JSON.parse(savedAdmin))
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await axios.post('/api/auth/login', { username, password })
    const { token: newToken, admin: newAdmin } = res.data
    setToken(newToken)
    setAdmin(newAdmin)
    localStorage.setItem('adminToken', newToken)
    localStorage.setItem('admin', JSON.stringify(newAdmin))
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const logout = () => {
    setToken(null)
    setAdmin(null)
    localStorage.removeItem('adminToken')
    localStorage.removeItem('admin')
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}