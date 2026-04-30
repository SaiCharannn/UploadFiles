import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('access') || null)
  const [loading, setLoading] = useState(true)

  // Attach token to every request
  useEffect(() => {
    const id = axios.interceptors.request.use(cfg => {
      const t = localStorage.getItem('access')
      if (t) cfg.headers.Authorization = `Bearer ${t}`
      return cfg
    })
    return () => axios.interceptors.request.eject(id)
  }, [])

  // On mount, verify token / fetch me
  useEffect(() => {
    const t = localStorage.getItem('access')
    if (!t) { setLoading(false); return }
    axios.get(`${API}/auth/me/`)
      .then(r => setUser(r.data))
      .catch(() => { localStorage.removeItem('access'); localStorage.removeItem('refresh') })
      .finally(() => setLoading(false))
  }, [])

  const login = async (user_id, password) => {
    const res = await axios.post(`${API}/auth/login/`, { user_id, password })
    localStorage.setItem('access',  res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
    setToken(res.data.access)
    setUser({ user_id: res.data.user_id, name: res.data.name, role: res.data.role, lab: res.data.lab })
    return res.data.role
  }

  const logout = async () => {
    const refresh = localStorage.getItem('refresh')
    try { await axios.post(`${API}/auth/logout/`, { refresh }) } catch (_) {}
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)