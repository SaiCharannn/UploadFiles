import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import CreateSuperAdmin from './pages/CreateSuperAdmin.jsx'
import AlreadyExists from './pages/AlreadyExists.jsx'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [exists,  setExists]  = useState(false)
  const [theme,   setTheme]   = useState(() => localStorage.getItem('uf_theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('uf_theme', theme)
  }, [theme])

  useEffect(() => {
    axios.get(`${API}/superadmin/check/`)
      .then(r => setExists(r.data.exists))
      .catch(() => setExists(false))
      .finally(() => setLoading(false))
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  if (loading) return (
    <div className="sa-splash">
      <span className="sa-splash-dot" />
      <span className="sa-splash-dot" />
      <span className="sa-splash-dot" />
    </div>
  )

  return (
    <>
      <button className="sa-theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
      </button>
      <Routes>
        <Route path="/"       element={exists ? <Navigate to="/exists" /> : <CreateSuperAdmin />} />
        <Route path="/exists" element={<AlreadyExists />} />
      </Routes>
    </>
  )
}
