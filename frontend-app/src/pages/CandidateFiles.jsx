import React, { useState, useEffect, useCallback } from 'react'
import { getMyFiles, uploadFile, deleteFile } from '../api/files.js'
import { useAuth } from '../context/AuthContext.jsx'

const TYPE_MAP = {
  '.doc': 'Word', '.docx': 'Word',
  '.xls': 'Excel', '.xlsx': 'Excel',
  '.ppt': 'PPT', '.pptx': 'PPT',
}

const TYPE_ICON  = { Word: '📝', Excel: '📊', PPT: '📑' }
const TYPE_COLOR = { Word: 'type-word', Excel: 'type-excel', PPT: 'type-ppt' }

function fmt(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function CandidateFiles() {
  const { user }     = useAuth()
  const [files,      setFiles]     = useState([])
  const [loading,    setLoading]   = useState(true)
  const [uploading,  setUploading] = useState(false)
  const [selFile,    setSelFile]   = useState(null)
  const [fileType,   setFileType]  = useState('')
  const [err,        setErr]       = useState('')
  const [msg,        setMsg]       = useState('')

  /* ── data fetching ── */
  const load = useCallback(async () => {
    try {
      const res = await getMyFiles()
      setFiles(res.data)
    } catch {
      setErr('Failed to load files.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 120_000)
    return () => clearInterval(timer)
  }, [load])

  /* ── file selection ── */
  const handleSelect = e => {
    const f = e.target.files[0]
    if (!f) return
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    setSelFile(f)
    setFileType(TYPE_MAP[ext] || '')
    setErr('')
  }

  /* ── upload ── */
  const handleUpload = async () => {
    if (!selFile) { setErr('No file selected.'); return }

    const ext  = selFile.name.slice(selFile.name.lastIndexOf('.')).toLowerCase()
    const type = TYPE_MAP[ext]
    if (!type) { setErr('Unsupported file type.'); return }

    // Client-side guard: warn if a Printed file of the same type exists
    const alreadyPrinted = files.some(
      f => f.file_type === type && f.status === 'Printed'
    )
    if (alreadyPrinted) {
      setErr(
        `Your ${type} file has already been printed. You cannot upload a new one.`
      )
      return
    }

    const fd = new FormData()
    fd.append('file', selFile)
    fd.append('file_type', type)

    setUploading(true)
    try {
      await uploadFile(fd)
      setMsg('File uploaded successfully!')
      setSelFile(null)
      document.getElementById('file-input').value = ''
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  /* ── delete ── */
  const handleDelete = async id => {
    if (!confirm('Remove this file?')) return
    try {
      await deleteFile(id)
      setMsg('File removed.')
      load()
    } catch (e) {
      setErr(e.response?.data?.error || 'Delete failed.')
    }
  }

  /* ── helpers ── */
  const byType = t => files.filter(f => f.file_type === t)

  /* ── render ── */
  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Files</h1>
          <p className="page-sub">{user?.user_id} · {user?.lab || 'No lab'}</p>
        </div>
        <button className="btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {/* Alerts */}
      {msg && (
        <div className="alert alert-success" onClick={() => setMsg('')}>
          {msg} ✕
        </div>
      )}
      {err && (
        <div className="alert alert-error" onClick={() => setErr('')}>
          {err} ✕
        </div>
      )}

      {/* Upload panel */}
      <div className="card upload-panel">
        <h3>📤 Upload a File</h3>
        <p className="card-sub">
          Accepted: .doc, .docx, .xls, .xlsx, .ppt, .pptx · Max 20 MB
        </p>

        <div className="upload-row">
          <div
            className="file-drop"
            onClick={() => document.getElementById('file-input').click()}
            style={{ flex: 1 }}
          >
            {selFile ? (
              <>
                <span className={`type-badge ${TYPE_COLOR[fileType]}`}>
                  {fileType}
                </span>
                {' '}{selFile.name}{' '}
                <span className="text-muted">({fmt(selFile.size)})</span>
              </>
            ) : (
              <><span className="file-icon">📎</span> Click to choose file</>
            )}
            <input
              id="file-input"
              type="file"
              accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx"
              style={{ display: 'none' }}
              onChange={handleSelect}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={uploading || !selFile}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {/* File lists */}
      {loading ? (
        <div className="loading-row">Loading files…</div>
      ) : (
        <div className="files-grid">
          {['Word', 'Excel', 'PPT'].map(type => (
            <div className="card" key={type}>
              <h3 className={`file-type-head ${TYPE_COLOR[type]}`}>
                {TYPE_ICON[type]} {type} Files
              </h3>

              {byType(type).length === 0 ? (
                <p className="text-muted empty-type">
                  No {type} files uploaded yet.
                </p>
              ) : (
                byType(type).map(f => {
                  const isPrinted = f.status === 'Printed'

                  return (
                    <div className="file-row" key={f.id}>
                      <div className="file-info">
                        <div className="file-name">{f.original_name}</div>
                        <div className="file-meta">
                          {fmt(f.file_size)}
                          {' · '}
                          {new Date(f.uploaded_at).toLocaleString()}
                          {' · '}
                          <span
                            className={`status-badge ${
                              isPrinted ? 'status-printed' : 'status-active'
                            }`}
                          >
                            {f.status}
                          </span>
                        </div>
                      </div>

                      {/* Delete / Lock button */}
                      <button
                        className={`btn-sm ${isPrinted ? 'btn-locked' : 'btn-danger'}`}
                        onClick={() => !isPrinted && handleDelete(f.id)}
                        disabled={isPrinted}
                        title={isPrinted ? 'Already printed — cannot remove' : 'Remove'}
                        aria-disabled={isPrinted}
                      >
                        {isPrinted ? '🔒' : '✕'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}