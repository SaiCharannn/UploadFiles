// import { useState } from 'react';
// import { createSuperAdmin } from '../api/auth';

// const PWD_REGEX    = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*])[A-Za-z\d@#$%&*]{8,20}$/;
// const REGULAR_APP  = import.meta.env.VITE_REGULAR_APP_URL;

// export default function CreateSuperAdmin() {
//   const [form,     setForm]     = useState({ name: '', password: '', confirm: '' });
//   const [errors,   setErrors]   = useState({});
//   const [apiError, setApiError] = useState('');
//   const [loading,  setLoading]  = useState(false);
//   const [success,  setSuccess]  = useState(false);

//   const validate = () => {
//     const e = {};
//     if (!form.name.trim())             e.name    = 'Name is required.';
//     if (form.name.length > 100)        e.name    = 'Name is too long.';
//     if (!PWD_REGEX.test(form.password))
//       e.password = 'Min 8, max 20 chars. Needs 1 uppercase, 1 number, 1 special char (@#$%&*).';
//     if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
//     return e;
//   };

//   const handleChange = (field) => (e) => {
//     setForm(f => ({ ...f, [field]: e.target.value }));
//     setErrors(err => ({ ...err, [field]: '' }));
//     setApiError('');
//   };

//   const handleSubmit = async () => {
//     const e = validate();
//     if (Object.keys(e).length) { setErrors(e); return; }
//     setLoading(true);
//     try {
//       await createSuperAdmin(form.name.trim(), form.password);
//       setSuccess(true);
//       setTimeout(() => { window.location.href = REGULAR_APP; }, 3000);
//     } catch (err) {
//       setApiError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (success) return (
//     <div style={styles.center}>
//       <div style={styles.successBox}>
//         <p style={{ color: '#16a34a', fontSize: 18, fontWeight: 600, margin: 0 }}>✅ Super Admin created!</p>
//         <p style={{ color: '#555', marginTop: 8 }}>
//           Your login credentials:<br />
//           <strong>User ID:</strong> SuperAdmin<br />
//           <strong>Password:</strong> the password you just set
//         </p>
//         <p style={{ color: '#888', fontSize: 13 }}>Redirecting to main app in 3 seconds…</p>
//       </div>
//     </div>
//   );

//   return (
//     <div style={styles.page}>
//       <div style={styles.card}>
//         <h2 style={styles.title}>Create Super Admin</h2>
//         <p style={styles.hint}>
//           After creation, you'll log in with:<br />
//           <strong>User ID:</strong> <code>SuperAdmin</code> &nbsp;·&nbsp; <strong>Password:</strong> what you set below
//         </p>

//         <Field label="Full Name" error={errors.name}>
//           <input type="text" value={form.name} onChange={handleChange('name')}
//             maxLength={100} placeholder="e.g. John Smith" style={styles.input} />
//         </Field>

//         <Field label="Password" error={errors.password}>
//           <input type="password" value={form.password} onChange={handleChange('password')}
//             maxLength={20} placeholder="Min 8 chars, 1 upper, 1 num, 1 special" style={styles.input} />
//         </Field>

//         <Field label="Confirm Password" error={errors.confirm}>
//           <input type="password" value={form.confirm} onChange={handleChange('confirm')}
//             maxLength={20} placeholder="Re-enter password" style={styles.input} />
//         </Field>

//         {apiError && <p style={styles.apiError}>{apiError}</p>}

//         <button onClick={handleSubmit} disabled={loading} style={styles.btn}>
//           {loading ? 'Creating…' : 'Create Super Admin'}
//         </button>
//       </div>
//     </div>
//   );
// }

// function Field({ label, error, children }) {
//   return (
//     <div style={{ marginBottom: 16 }}>
//       <label style={styles.label}>{label}</label>
//       {children}
//       {error && <p style={styles.error}>{error}</p>}
//     </div>
//   );
// }

// const styles = {
//   page:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' },
//   card:       { background: '#fff', padding: '2.5rem 2rem', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,.10)', width: '100%', maxWidth: 420 },
//   title:      { margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#1e293b' },
//   hint:       { fontSize: 13, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', marginBottom: 20, lineHeight: 1.7 },
//   label:      { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 },
//   input:      { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
//   error:      { color: '#dc2626', fontSize: 12, marginTop: 4 },
//   apiError:   { color: '#dc2626', fontSize: 13, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', marginBottom: 12 },
//   btn:        { width: '100%', padding: '11px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
//   center:     { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' },
//   successBox: { background: '#fff', padding: '2rem', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,.10)', maxWidth: 380, textAlign: 'center' },
// };


import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function CreateSuperAdmin() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ user_id: '', name: '', password: '', confirm_password: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiErr,  setApiErr]  = useState('')

  const validate = () => {
    const e = {}
    if (!form.user_id.trim())           e.user_id = 'User ID is required.'
    if (!form.name.trim())              e.name    = 'Name is required.'
    const pwdRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*])[A-Za-z\d@#$%&*]{8,20}$/
    if (!pwdRe.test(form.password))     e.password = 'Min 8 chars, 1 uppercase, 1 number, 1 special (@#$%&*).'
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

          {[
            { id: 'user_id', label: 'User ID', type: 'text', placeholder: 'e.g. ADMIN001' },
            { id: 'name',    label: 'Full Name', type: 'text', placeholder: 'Your full name' },
            { id: 'password', label: 'Password', type: 'password', placeholder: '8-20 chars, A-Z, 0-9, @#$%&*' },
            { id: 'confirm_password', label: 'Confirm Password', type: 'password', placeholder: 'Re-enter password' },
          ].map(f => (
            <div className="sa-field" key={f.id}>
              <label htmlFor={f.id}>{f.label}</label>
              <input
                id={f.id} name={f.id} type={f.type}
                placeholder={f.placeholder}
                value={form[f.id]}
                onChange={handleChange}
                className={errors[f.id] ? 'sa-input-err' : ''}
                autoComplete="off"
              />
              {errors[f.id] && <span className="sa-err-msg">{errors[f.id]}</span>}
            </div>
          ))}

          <button type="submit" className="sa-btn sa-btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create SuperAdmin'}
          </button>
        </form>

        <div className="sa-hint">
          <strong>Password rules:</strong> 8–20 characters · 1 uppercase · 1 number · 1 special character from <code>@ # $ % &amp; *</code>
        </div>
      </div>
    </div>
  )
}