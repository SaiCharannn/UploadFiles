import React, { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function CreateSuperAdmin() {
  const [form,    setForm]    = useState({ user_id: '', name: '', password: '', confirm_password: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiErr,  setApiErr]  = useState('')
  const [showPwd, setShowPwd] = useState({ password: false, confirm_password: false })

  const validate = () => {
    const e = {}
    if (!form.user_id.trim()) e.user_id = 'User ID is required.'
    if (!form.name.trim())    e.name    = 'Name is required.'
    const pwdRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*])[A-Za-z\d@#$%&*]{8,20}$/
    if (!pwdRe.test(form.password)) e.password = 'Min 8 chars, 1 uppercase, 1 number, 1 special (@#$%&*).'
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.'
    return e
  }

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: '' }))
    setApiErr('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      await axios.post(`${API}/superadmin/create/`, form)
      setSuccess(true)
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const toggleShow = field =>
    setShowPwd(s => ({ ...s, [field]: !s[field] }))

  if (success) return (
    <div className="sa-page">
      <div className="sa-card sa-success-card">
        <div className="sa-success-icon">✓</div>
        <h2>SuperAdmin Created!</h2>
        <p>You can now log in to the main application.</p>
        <a href="http://localhost:3002" className="sa-btn sa-btn-primary">Go to App →</a>
      </div>
    </div>
  )

  const fields = [
    { id: 'user_id',          label: 'User ID',          type: 'text',     placeholder: 'e.g. ADMIN001',          isPwd: false },
    { id: 'name',             label: 'Full Name',         type: 'text',     placeholder: 'Your full name',          isPwd: false },
    { id: 'password',         label: 'Password',          type: 'password', placeholder: '8-20 chars, A-Z, 0-9, @#$%&*', isPwd: true },
    { id: 'confirm_password', label: 'Confirm Password',  type: 'password', placeholder: 'Re-enter password',       isPwd: true },
  ]

  return (
    <div className="sa-page">
      <div className="sa-card">
        <div className="sa-header">
          <div className="sa-logo">IIA<span>P</span></div>
          <h1>Create SuperAdmin</h1>
          <p className="sa-subtitle">One-time setup for UploadFiles System</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {apiErr && <div className="sa-api-error">{apiErr}</div>}

          {fields.map(f => (
            <div className="sa-field" key={f.id}>
              <label htmlFor={f.id}>{f.label}</label>
              {f.isPwd ? (
                <div className="sa-pw-wrap">
                  <input
                    id={f.id} name={f.id}
                    type={showPwd[f.id] ? 'text' : 'password'}
                    placeholder={f.placeholder}
                    value={form[f.id]}
                    onChange={handleChange}
                    className={errors[f.id] ? 'sa-input-err' : ''}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="sa-eye-btn"
                    onClick={() => toggleShow(f.id)}
                    tabIndex={-1}
                    aria-label={showPwd[f.id] ? 'Hide' : 'Show'}
                  >
                    {showPwd[f.id] ? '🙈' : '👁'}
                  </button>
                </div>
              ) : (
                <input
                  id={f.id} name={f.id} type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.id]}
                  onChange={handleChange}
                  className={errors[f.id] ? 'sa-input-err' : ''}
                  autoComplete="off"
                />
              )}
              {errors[f.id] && <span className="sa-err-msg">{errors[f.id]}</span>}
            </div>
          ))}

          <button type="submit" className="sa-btn sa-btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create SuperAdmin'}
          </button>
        </form>

        <div className="sa-hint">
          <strong>Password rules:</strong> 8–20 characters · 1 uppercase · 1 number · 1 special from <code>@ # $ % &amp; *</code>
        </div>
      </div>
    </div>
  )
}
