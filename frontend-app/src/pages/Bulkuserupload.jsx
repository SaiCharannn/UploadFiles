import React, { useState, useEffect, useCallback } from 'react'
import { bulkUpload, getBulkHistory } from '../api/users.js'
import { useAuth } from '../context/AuthContext.jsx'

// ── Template generator (client-side, no library needed) ──────────
// Builds a minimal CSV that users can open in Excel
function downloadTemplate(isSA) {
  const roleNote = isSA ? 'Staff or Candidate' : 'Candidate'
  const rows = [
    ['SlNo', 'UserID', 'Name', 'Role', 'Password', 'Mobile', 'Lab', 'Action'],
    ['1', 'C001', 'Sample Name', roleNote === 'Candidate only' ? 'Candidate' : 'Candidate', 'Pass@123', '9876543210', 'Lab-A', 'ADD'],
    ['2', 'C002', 'Another Name', 'Candidate', 'Pass@456', '9876543211', 'Lab-A', 'ADD'],
  ]
  if (isSA) {
    rows.push(['3', 'S001', 'Staff Name', 'Staff', 'Staff@123', '9876543212', '', 'ADD'])
  }
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'bulk_upload_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function BulkUpload() {
  const { user }   = useAuth()
  const isSA       = user?.role === 'SuperAdmin'

  // Upload state
  const [file,    setFile]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [err,     setErr]     = useState('')

  // History state
  const [history,      setHistory]      = useState([])
  const [histLoading,  setHistLoading]  = useState(true)
  const [expandedBatch, setExpandedBatch] = useState(null)

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const res = await getBulkHistory()
      setHistory(res.data)
    } catch { /* silently fail */ }
    finally { setHistLoading(false) }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleFile = e => {
    setFile(e.target.files[0] || null)
    setResult(null)
    setErr('')
  }

  const handleSubmit = async () => {
    if (!file) { setErr('Please select an Excel or CSV file.'); return }
    const fd = new FormData()
    fd.append('file', file)
    setLoading(true)
    try {
      const res = await bulkUpload(fd)
      setResult(res.data)
      setFile(null)
      document.getElementById('bulk-file-input').value = ''
      loadHistory()   // refresh batch history after upload
    } catch (e) {
      setErr(e.response?.data?.error || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  const toggleBatch = id =>
    setExpandedBatch(prev => prev === id ? null : id)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bulk User Upload</h1>
          <p className="page-sub">Upload Excel/CSV to create or modify users in batch</p>
        </div>
        <button className="btn-template" onClick={() => downloadTemplate(isSA)}>
          ⬇ Download Template
        </button>
      </div>

      {/* ── Top row: Format reference + Upload card ── */}
      <div className="bulk-layout">

        {/* Format card */}
        <div className="card">
          <h3>📋 Excel / CSV File Format</h3>
          <p className="card-sub" style={{ marginBottom: '0.75rem' }}>
            Row 1 = header. Data starts from row 2.
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Col</th><th>Field</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {[
                  ['A', 'Sl No',    'Sequential number'],
                  ['B', 'UserID',   'Unique ID — required'],
                  ['C', 'Name',     'Full name'],
                  ['D', 'Role',     isSA ? 'Staff or Candidate' : 'Candidate only'],
                  ['E', 'Password', 'Initial password'],
                  ['F', 'Mobile',   'Mobile number'],
                  ['G', 'Lab',      'Lab / center name'],
                  ['H', 'Action',   'ADD / MOD / DEL / INACT / ACT'],
                ].map(([col, val, note]) => (
                  <tr key={col}>
                    <td><code>{col}</code></td>
                    <td style={{ fontWeight: 600 }}>{val}</td>
                    <td className="text-muted">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="action-guide">
            <p className="action-guide-title">Action values:</p>
            {[
              ['ADD',   'Create new user'],
              ['MOD',   'Update name / lab / password'],
              ['DEL',   'Permanently delete user'],
              ['INACT', 'Deactivate (cannot login)'],
              ['ACT',   'Re-activate deactivated user'],
            ].map(([a, d]) => (
              <div key={a} className="action-guide-row">
                <code>{a}</code><span>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload card */}
        <div className="card">
          <h3>⬆ Upload File</h3>
          <p className="card-sub" style={{ marginBottom: '1rem' }}>
            Accepted: .xlsx, .xls, .csv · Uploads are processed row by row
          </p>

          {err && <div className="alert alert-error">{err}</div>}

          <div
            className="file-drop"
            onClick={() => document.getElementById('bulk-file-input').click()}
          >
            {file
              ? <><span className="file-icon">📊</span><span>{file.name}</span></>
              : <><span className="file-icon">+</span><span>Click to select file</span></>
            }
            <input
              id="bulk-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || !file}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {loading ? 'Processing…' : 'Upload & Process'}
          </button>

          {/* Instant result panel */}
          {result && (
            <div className="instant-result">
              <div className="result-summary">
                <div className="result-stat">
                  <span className="stat-num">{result.total}</span>
                  <span>Total</span>
                </div>
                <div className="result-stat success">
                  <span className="stat-num">{result.success}</span>
                  <span>Success</span>
                </div>
                <div className="result-stat danger">
                  <span className="stat-num">{result.fail}</span>
                  <span>Failed</span>
                </div>
              </div>

              {result.detail?.length > 0 && (
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Row</th><th>User ID</th><th>Action</th>
                        <th>Status</th><th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.detail.map((d, i) => (
                        <tr key={i}>
                          <td>{d.row}</td>
                          <td><code>{d.user_id || '—'}</code></td>
                          <td>{d.action || '—'}</td>
                          <td>
                            <span className={`status-badge ${d.status === 'success' ? 'status-active' : 'status-locked'}`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="text-muted">{d.message || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Batch History Table ── */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="batch-history-header">
          <div>
            <h3>🗂 Upload Batch History</h3>
            <p className="card-sub">
              Every upload is saved as a batch — click a row to see per-user details
            </p>
          </div>
          <button className="btn-outline btn-sm-action" onClick={loadHistory}>↻ Refresh</button>
        </div>

        {histLoading ? (
          <div className="loading-row">Loading history…</div>
        ) : history.length === 0 ? (
          <div className="loading-row">No uploads yet.</div>
        ) : (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Batch ID</th>
                  <th>Filename</th>
                  {isSA && <th>Uploaded By</th>}
                  <th>Date &amp; Time</th>
                  <th>Total</th>
                  <th>✓ Success</th>
                  <th>✗ Failed</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log, idx) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className={`batch-row ${expandedBatch === log.id ? 'batch-row-expanded' : ''}`}
                      onClick={() => toggleBatch(log.id)}
                    >
                      <td className="text-muted">{idx + 1}</td>
                      <td><code>BATCH-{String(log.id).padStart(4, '0')}</code></td>
                      <td className="file-name-cell" title={log.filename}>{log.filename}</td>
                      {isSA && (
                        <td>
                          <span className="uploader-chip">
                            {log.uploaded_by} · {log.uploader_name}
                          </span>
                        </td>
                      )}
                      <td className="text-muted">{fmtDate(log.uploaded_at)}</td>
                      <td><strong>{log.total_rows}</strong></td>
                      <td>
                        <span className="batch-stat batch-success">{log.success_count}</span>
                      </td>
                      <td>
                        <span className={`batch-stat ${log.fail_count > 0 ? 'batch-fail' : 'batch-zero'}`}>
                          {log.fail_count}
                        </span>
                      </td>
                      <td>
                        <span className="expand-btn">
                          {expandedBatch === log.id ? '▲ Hide' : '▼ View'}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded per-row detail */}
                    {expandedBatch === log.id && log.result_detail?.length > 0 && (
                      <tr className="batch-detail-row">
                        <td colSpan={isSA ? 9 : 8} style={{ padding: 0 }}>
                          <div className="batch-detail-wrap">
                            <table className="data-table batch-detail-table">
                              <thead>
                                <tr>
                                  <th>Row</th><th>User ID</th><th>Action</th>
                                  <th>Status</th><th>Message</th>
                                </tr>
                              </thead>
                              <tbody>
                                {log.result_detail.map((d, i) => (
                                  <tr key={i} className={d.status === 'error' ? 'row-error' : ''}>
                                    <td>{d.row}</td>
                                    <td><code>{d.user_id || '—'}</code></td>
                                    <td>{d.action || '—'}</td>
                                    <td>
                                      <span className={`status-badge ${d.status === 'success' ? 'status-active' : 'status-locked'}`}>
                                        {d.status}
                                      </span>
                                    </td>
                                    <td className="text-muted">{d.message || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
