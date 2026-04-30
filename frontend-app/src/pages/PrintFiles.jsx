import React, { useState, useEffect } from 'react'
import { getLabs, getCandidatesByLab, getCandidateFiles, markPrinted, getDownloadUrl } from '../api/files.js'

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}

export default function PrintFiles() {
  const [labs,       setLabs]       = useState([])
  const [selLab,     setSelLab]     = useState('')
  const [candidates, setCandidates] = useState([])
  const [selCand,    setSelCand]    = useState('')
  const [files,      setFiles]      = useState([])
  const [loading,    setLoading]    = useState(false)
  const [msg,        setMsg]        = useState('')
  const [err,        setErr]        = useState('')

  useEffect(() => {
    getLabs().then(r => setLabs(r.data)).catch(() => setErr('Failed to load labs.'))
  }, [])

  const handleLabChange = async lab => {
    setSelLab(lab)
    setSelCand('')
    setFiles([])
    if (!lab) { setCandidates([]); return }
    try {
      const res = await getCandidatesByLab(lab)
      setCandidates(res.data)
    } catch { setErr('Failed to load candidates.') }
  }

  const handleCandChange = async uid => {
    setSelCand(uid)
    if (!uid) { setFiles([]); return }
    setLoading(true)
    try {
      const res = await getCandidateFiles(uid)
      setFiles(res.data)
    } catch { setErr('Failed to load files.') }
    finally { setLoading(false) }
  }

  const handlePrint = async (id, originalName) => {
    try {
      // Get file URL and open
      const res = await getDownloadUrl(id)
      window.open(res.data.url, '_blank')
      // Mark as printed
      await markPrinted(id)
      setMsg(`Marked as printed: ${originalName}`)
      const updated = await getCandidateFiles(selCand)
      setFiles(updated.data)
    } catch (e) { setErr(e.response?.data?.error || 'Action failed.') }
  }

  const TYPE_COLOR = { Word: 'type-word', Excel: 'type-excel', PPT: 'type-ppt' }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Print Files</h1>
          <p className="page-sub">Browse candidate submissions by lab</p>
        </div>
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}
      {err && <div className="alert alert-error"   onClick={() => setErr('')}>{err} ✕</div>}

      <div className="print-toolbar">
        <div className="form-field" style={{ flex: 1 }}>
          <label>Select Lab</label>
          <select className="select-input" value={selLab} onChange={e => handleLabChange(e.target.value)}>
            <option value="">— Choose Lab —</option>
            {labs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {candidates.length > 0 && (
          <div className="form-field" style={{ flex: 1 }}>
            <label>Select Candidate</label>
            <select className="select-input" value={selCand} onChange={e => handleCandChange(e.target.value)}>
              <option value="">— Choose Candidate —</option>
              {candidates.map(c => (
                <option key={c.user_id} value={c.user_id}>{c.user_id} — {c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selCand && (
        loading ? <div className="loading-row">Loading files…</div> : (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3>Files for <code>{selCand}</code></h3>
            {files.length === 0
              ? <p className="text-muted" style={{ marginTop: '1rem' }}>No files uploaded yet.</p>
              : (
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th><th>File Name</th><th>Type</th><th>Size</th>
                        <th>Uploaded</th><th>Status</th><th>Print Status</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((f, i) => (
                        <tr key={f.id}>
                          <td>{i + 1}</td>
                          <td className="file-name-cell">{f.original_name}</td>
                          <td><span className={`type-badge ${TYPE_COLOR[f.file_type]}`}>{f.file_type}</span></td>
                          <td>{fmt(f.file_size)}</td>
                          <td>{new Date(f.uploaded_at).toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${f.status === 'Printed' ? 'status-printed' : 'status-active'}`}>
                              {f.status}
                            </span>
                          </td>
                          <td>
                            {f.status === 'Printed'
                              ? <span className="text-muted">✓ {f.printed_by} · {new Date(f.printed_at).toLocaleTimeString()}</span>
                              : <span className="text-muted">—</span>
                            }
                          </td>
                          <td>
                            <button
                              className={`btn-sm ${f.status === 'Printed' ? 'btn-outline' : 'btn-primary'}`}
                              onClick={() => handlePrint(f.id, f.original_name)}
                            >
                              {f.status === 'Printed' ? '↗ Reopen' : '🖨 Print'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )
      )}
    </div>
  )
}