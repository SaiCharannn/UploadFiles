import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

/* ── Professional SVG eye icons — no emoji ── */
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export default function Login() {
  const { login }         = useAuth()
  const { theme, toggle } = useTheme()
  const navigate          = useNavigate()
  const [form,    setForm]    = useState({ user_id: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
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
      <button className="login-theme-toggle" onClick={toggle}>
        {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
      </button>

      {/* ── Left branding panel ── */}
      <div className="login-left">
        <div className="login-brand">
          <span className="brand-big">IIA<b>P</b></span>
          <h2>Exam Upload System</h2>
          <p>Indian Institute of Astrophysics<br />Candidate File Submission Portal</p>
          <div className="powered-by">
            <span className="powered-label">Powered by</span>
            <span className="powered-name">Nivansys Technologies</span>
            <span className="powered-city">Bangalore</span>
          </div>
        </div>
        <div className="login-deco" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="deco-ring" style={{ '--i': i }} />
          ))}
        </div>
      </div>

      {/* ── Right sign-in panel ── */}
      <div className="login-right">
        <div className="login-card">
          <h1>Sign In</h1>
          <p className="login-sub">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="form-error">{error}</div>}

            {/* User ID — no trailing icon, full width */}
            <div className="form-field">
              <label htmlFor="user_id">User ID</label>
              <input
                id="user_id"
                name="user_id"
                type="text"
                value={form.user_id}
                onChange={handleChange}
                placeholder="Your User ID"
                autoComplete="username"
                style={{ width: '100%', paddingRight: '1rem' }}
              />
            </div>

            {/* Password — eye toggle uses same visual width as User ID */}
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="input-pw-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  /* Right padding matches the eye-button width (2.5rem) so
                     the visible text area is the same width as the UserID field */
                  style={{ width: '100%', paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  className="pw-eye-btn"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.75rem' }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}