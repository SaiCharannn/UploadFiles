import React, { useState, useEffect, useCallback } from 'react'
import { getMyFiles, uploadFile, deleteFile } from '../api/files.js'
import { useAuth } from '../context/AuthContext.jsx'

const TYPE_MAP   = { '.doc':'Word','.docx':'Word','.xls':'Excel','.xlsx':'Excel','.ppt':'PPT','.pptx':'PPT' }
const TYPE_ICON  = { Word:'📝', Excel:'📊', PPT:'📑' }
const TYPE_COLOR = { Word:'type-word', Excel:'type-excel', PPT:'type-ppt' }

function fmt(bytes) {
  if (!bytes || bytes < 1024) return `${bytes||0} B`
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  })
}

export default function CandidateFiles() {
  const { user } = useAuth()

  const [files,       setFiles]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [selFile,     setSelFile]     = useState(null)
  const [fileType,    setFileType]    = useState('')
  const [err,         setErr]         = useState('')
  const [msg,         setMsg]         = useState('')
  // Modal state
  const [confirmDel,  setConfirmDel]  = useState(null)   // file object
  const [deletingId,  setDeletingId]  = useState(null)   // id being deleted

  const load = useCallback(async () => {
    try {
      const res = await getMyFiles()
      setFiles(res.data)
    } catch { setErr('Failed to load files.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 120_000)
    return () => clearInterval(t)
  }, [load])

  const handleSelect = e => {
    const f = e.target.files[0]
    if (!f) return
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    setSelFile(f)
    setFileType(TYPE_MAP[ext] || '')
    setErr('')
  }

  const handleUpload = async () => {
    if (!selFile) { setErr('No file selected.'); return }
    const ext  = selFile.name.slice(selFile.name.lastIndexOf('.')).toLowerCase()
    const type = TYPE_MAP[ext]
    if (!type) { setErr('Unsupported file type.'); return }
    const fd = new FormData()
    fd.append('file', selFile)
    fd.append('file_type', type)
    setUploading(true)
    try {
      await uploadFile(fd)
      setMsg('File uploaded successfully!')
      setSelFile(null)
      document.getElementById('cf-file-input').value = ''
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Upload failed.')
    } finally { setUploading(false) }
  }

  // Step 1: show modal
  const handleDeleteClick = f => {
    if (f.status === 'Printed') {
      setErr('This file has been printed by the examiner and cannot be removed.')
      return
    }
    setConfirmDel(f)
  }

  // Step 2: execute delete
  const handleDeleteConfirm = async () => {
    if (!confirmDel) return
    const f = confirmDel
    setConfirmDel(null)
    setDeletingId(f.id)
    setErr('')
    try {
      await deleteFile(f.id)
      setMsg(`Removed: ${f.original_name}`)
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Delete failed.')
    } finally { setDeletingId(null) }
  }

  const byType = t => files.filter(f => f.file_type === t)

  return (
    <div className="page">

      {/* ── Delete confirmation modal ── */}
      {confirmDel && (
        <div className="cf-modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="cf-modal" onClick={e => e.stopPropagation()}>
            <div className="cf-modal-icon">🗑</div>
            <h3 className="cf-modal-title">Remove File?</h3>
            <p className="cf-modal-body">
              <strong>{confirmDel.original_name}</strong> will be permanently removed.
              You can upload a new file after this.
            </p>
            <div className="cf-modal-actions">
              <button className="cf-modal-btn cf-modal-cancel" onClick={() => setConfirmDel(null)}>
                Cancel
              </button>
              <button className="cf-modal-btn cf-modal-confirm" onClick={handleDeleteConfirm}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Files</h1>
          <p className="page-sub">{user?.user_id} · {user?.lab || 'No lab'}</p>
        </div>
        <button className="btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}
      {err && <div className="alert alert-error"   onClick={() => setErr('')}>{err} ✕</div>}

      {/* ── Upload panel ── */}
      <div className="card upload-panel">
        <h3>📤 Upload a File</h3>
        <p className="card-sub">Accepted: .doc .docx .xls .xlsx .ppt .pptx · Max 20 MB</p>
        <div className="upload-row">
          <div className="file-drop"
            onClick={() => document.getElementById('cf-file-input').click()}
            style={{ flex: 1 }}
          >
            {selFile
              ? <><span className={`type-badge ${TYPE_COLOR[fileType]}`}>{fileType}</span>
                  {selFile.name}
                  <span className="text-muted"> ({fmt(selFile.size)})</span></>
              : <><span className="file-icon">📎</span> Click to choose file</>
            }
            <input
              id="cf-file-input" type="file"
              accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx"
              style={{ display: 'none' }}
              onChange={handleSelect}
            />
          </div>
          <button className="btn-primary" onClick={handleUpload} disabled={uploading || !selFile}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {/* ── File cards by type ── */}
      {loading
        ? <div className="loading-row">Loading files…</div>
        : (
          <div className="files-grid">
            {['Word', 'Excel', 'PPT'].map(type => (
              <div className="card cf-type-card" key={type}>
                <div className={`cf-type-header cf-type-header-${type.toLowerCase()}`}>
                  <span className="cf-type-icon">{TYPE_ICON[type]}</span>
                  <span className="cf-type-label">{type} Files</span>
                  <span className="cf-type-count">{byType(type).length}</span>
                </div>

                {byType(type).length === 0
                  ? <p className="cf-empty">No {type} files uploaded yet.</p>
                  : byType(type).map(f => {
                    const printed   = f.status === 'Printed'
                    const isDeleting = deletingId === f.id
                    return (
                      <div
                        key={f.id}
                        className={`cf-file-row ${printed ? 'cf-file-row-printed' : ''} ${isDeleting ? 'cf-file-row-deleting' : ''}`}
                      >
                        <div className="cf-file-info">
                          <div className="cf-file-name" title={f.original_name}>
                            {f.original_name}
                            {printed && <span className="cf-lock-icon" title="Printed — locked">🔒</span>}
                          </div>
                          <div className="cf-file-meta">
                            <span>{fmt(f.file_size)}</span>
                            <span className="cf-meta-dot">·</span>
                            <span>{fmtDate(f.uploaded_at)}</span>
                            <span className="cf-meta-dot">·</span>
                            <span className={`status-badge ${printed ? 'status-printed' : 'status-active'}`}>
                              {f.status}
                            </span>
                          </div>
                          {printed && (
                            <div className="cf-printed-note">
                              Printed by {f.printed_by} · Cannot be changed
                            </div>
                          )}
                        </div>

                        <button
                          className={`cf-delete-btn ${printed ? 'cf-delete-btn-locked' : ''}`}
                          onClick={() => handleDeleteClick(f)}
                          disabled={isDeleting || printed}
                          title={printed ? 'Cannot remove — already printed' : 'Remove this file'}
                        >
                          {isDeleting
                            ? <span className="cf-spinner" />
                            : printed ? '🔒' : '✕'
                          }
                        </button>
                      </div>
                    )
                  })
                }
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}