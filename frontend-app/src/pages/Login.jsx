import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Login() {
  const { login }         = useAuth()
  const { theme, toggle } = useTheme()
  const navigate          = useNavigate()
  const [form,    setForm]    = useState({ user_id: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.user_id || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      await login(form.user_id, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Theme toggle top-right */}
      <button className="login-theme-toggle" onClick={toggle}>
        {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
      </button>

      <div className="login-left">
        <div className="login-brand">
          <span className="brand-big">IIA<b>P</b></span>
          <h2>Exam Upload System</h2>
          <p>Indian Institute of Astrophysics<br />Candidate File Submission Portal</p>
        </div>
        <div className="login-deco" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="deco-ring" style={{ '--i': i }} />
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h1>Sign In</h1>
          <p className="login-sub">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="form-error">{error}</div>}

            <div className="form-field">
              <label htmlFor="user_id">User ID</label>
              <input
                id="user_id" name="user_id" type="text"
                value={form.user_id} onChange={handleChange}
                placeholder="Your User ID" autoComplete="username"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                value={form.password} onChange={handleChange}
                placeholder="••••••••" autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
