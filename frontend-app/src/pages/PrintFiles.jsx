import React, { useState, useEffect, useCallback } from 'react'
import { getLabs, getCandidatesByLab, getCandidateFiles, markPrinted, getDownloadUrl } from '../api/files.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

const TYPE_META = {
  Word:  { icon: '📝', cls: 'type-word',  label: 'Word'  },
  Excel: { icon: '📊', cls: 'type-excel', label: 'Excel' },
  PPT:   { icon: '📑', cls: 'type-ppt',   label: 'PPT'   },
}

export default function PrintFiles() {
  const [labs,        setLabs]        = useState([])
  const [selLab,      setSelLab]      = useState('')
  const [candidates,  setCandidates]  = useState([])
  const [selCand,     setSelCand]     = useState(null)   // full candidate object
  const [files,       setFiles]       = useState([])
  const [candLoading, setCandLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [msg,         setMsg]         = useState('')
  const [err,         setErr]         = useState('')

  // Load labs on mount
  useEffect(() => {
    getLabs()
      .then(r => setLabs(r.data))
      .catch(() => setErr('Failed to load labs.'))
  }, [])

  // Load candidates when lab changes
  const handleLabChange = async lab => {
    setSelLab(lab)
    setSelCand(null)
    setFiles([])
    setCandidates([])
    if (!lab) return
    setCandLoading(true)
    try {
      const res = await getCandidatesByLab(lab)
      setCandidates(res.data)
    } catch { setErr('Failed to load candidates.') }
    finally { setCandLoading(false) }
  }

  // Load files when candidate is clicked — auto, no button needed
  const handleCandClick = useCallback(async cand => {
    setSelCand(cand)
    setFiles([])
    setFileLoading(true)
    setMsg('')
    setErr('')
    try {
      const res = await getCandidateFiles(cand.user_id)
      setFiles(res.data)
    } catch { setErr('Failed to load files.') }
    finally { setFileLoading(false) }
  }, [])

  const handlePrint = async (file) => {
    setErr('')
    try {
      const res = await getDownloadUrl(file.id)
      window.open(res.data.url, '_blank')
      await markPrinted(file.id)
      setMsg(`Marked as printed: ${file.original_name}`)
      // Refresh files
      const updated = await getCandidateFiles(selCand.user_id)
      setFiles(updated.data)
      // Refresh candidate list to update printed count
      const candRes = await getCandidatesByLab(selLab)
      setCandidates(candRes.data)
      // Update selCand counts
      const fresh = candRes.data.find(c => c.user_id === selCand.user_id)
      if (fresh) setSelCand(fresh)
    } catch (e) { setErr(e.response?.data?.error || 'Action failed.') }
  }

  // Candidate upload status pill
  const candStatus = c => {
    if (c.total_files === 0)                         return { label: 'No uploads',   cls: 'cs-none' }
    if (c.printed_files === c.total_files)           return { label: 'All printed',  cls: 'cs-done' }
    if (c.printed_files > 0)                         return { label: 'Partial',      cls: 'cs-part' }
    return                                                  { label: `${c.total_files} uploaded`, cls: 'cs-up' }
  }

  return (
    <div className="page pf-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Print Files</h1>
          <p className="page-sub">Select a lab to browse candidates and print files</p>
        </div>

        {/* Lab selector */}
        <div className="pf-lab-select">
          <label className="pf-lab-label">Lab</label>
          <select
            className="select-input pf-lab-dropdown"
            value={selLab}
            onChange={e => handleLabChange(e.target.value)}
          >
            <option value="">— Choose Lab —</option>
            {labs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}
      {err && <div className="alert alert-error"   onClick={() => setErr('')}>{err} ✕</div>}

      {!selLab && (
        <div className="pf-empty-state">
          <span className="pf-empty-icon">🏫</span>
          <p>Select a lab above to see candidates</p>
        </div>
      )}

      {selLab && (
        <div className="pf-body">

          {/* ── Left: Candidate List ── */}
          <div className="pf-left">
            <div className="pf-panel-head">
              <span>Candidates</span>
              <span className="pf-count-chip">{candidates.length}</span>
            </div>

            {candLoading && <div className="pf-loading">Loading…</div>}

            {!candLoading && candidates.length === 0 && (
              <div className="pf-loading">No candidates in this lab.</div>
            )}

            <div className="pf-cand-list">
              {candidates.map(c => {
                const st    = candStatus(c)
                const isActive = selCand?.user_id === c.user_id
                return (
                  <div
                    key={c.user_id}
                    className={`pf-cand-card ${isActive ? 'pf-cand-active' : ''}`}
                    onClick={() => handleCandClick(c)}
                  >
                    <div className="pf-cand-top">
                      <div className="pf-cand-info">
                        <span className="pf-cand-id">{c.user_id}</span>
                        <span className="pf-cand-name">{c.name}</span>
                      </div>
                      <span className={`pf-cand-status ${st.cls}`}>{st.label}</span>
                    </div>

                    {/* File count mini-bar — always visible */}
                    <div className="pf-cand-bar">
                      <div className="pf-mini-stats">
                        <span className="pf-mini-stat">
                          <span className="pf-mini-dot dot-total" />
                          {c.total_files} uploaded
                        </span>
                        <span className="pf-mini-stat">
                          <span className="pf-mini-dot dot-printed" />
                          {c.printed_files} printed
                        </span>
                      </div>
                      {/* Progress bar */}
                      {c.total_files > 0 && (
                        <div className="pf-progress-track">
                          <div
                            className="pf-progress-fill"
                            style={{ width: `${(c.printed_files / c.total_files) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right: File Cards ── */}
          <div className="pf-right">
            {!selCand && (
              <div className="pf-empty-state pf-pick-hint">
                <span className="pf-empty-icon">👈</span>
                <p>Click a candidate to view their files</p>
              </div>
            )}

            {selCand && (
              <>
                <div className="pf-panel-head">
                  <div>
                    <span className="pf-right-name">{selCand.name}</span>
                    <code className="pf-right-id">{selCand.user_id}</code>
                  </div>
                  <span className="pf-file-count">
                    {selCand.total_files} file{selCand.total_files !== 1 ? 's' : ''} ·{' '}
                    {selCand.printed_files} printed
                  </span>
                </div>

                {fileLoading && <div className="pf-loading">Loading files…</div>}

                {!fileLoading && files.length === 0 && (
                  <div className="pf-no-files">
                    <span style={{ fontSize: '2rem' }}>📭</span>
                    <p>No files uploaded yet.</p>
                  </div>
                )}

                {!fileLoading && files.length > 0 && (
                  <div className="pf-file-cards">
                    {files.map(f => {
                      const meta    = TYPE_META[f.file_type] || TYPE_META.Word
                      const printed = f.status === 'Printed'
                      return (
                        <div key={f.id} className={`pf-file-card ${printed ? 'pf-file-printed' : ''}`}>
                          <div className="pf-file-card-top">
                            <span className={`pf-file-type-badge ${meta.cls}`}>
                              {meta.icon} {meta.label}
                            </span>
                            <span className={`status-badge ${printed ? 'status-printed' : 'status-active'}`}>
                              {f.status}
                            </span>
                          </div>

                          <div className="pf-file-name" title={f.original_name}>
                            {f.original_name}
                          </div>

                          <div className="pf-file-meta">
                            <span>{fmt(f.file_size)}</span>
                            <span>·</span>
                            <span>Uploaded: {fmtDate(f.uploaded_at)}</span>
                          </div>

                          {printed && (
                            <div className="pf-print-info">
                              ✓ Printed by <strong>{f.printed_by}</strong> at {fmtDate(f.printed_at)}
                            </div>
                          )}

                          <button
                            className={`pf-print-btn ${printed ? 'pf-print-btn-done' : 'pf-print-btn-go'}`}
                            onClick={() => handlePrint(f)}
                          >
                            {printed ? '↗ Reprint' : '🖨 Open & Print'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
