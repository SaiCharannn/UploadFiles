import React, { useState, useEffect, useCallback } from 'react'
import {
  getLabs, getCandidatesByLab, getCandidateFiles,
  markPrinted, getDownloadUrl, deleteFile
} from '../api/files.js'

function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024/1024).toFixed(1)} MB`
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
  })
}

const TYPE_META = {
  Word:  { icon:'📝', cls:'type-word',  label:'Word'  },
  Excel: { icon:'📊', cls:'type-excel', label:'Excel' },
  PPT:   { icon:'📑', cls:'type-ppt',   label:'PPT'   },
}

/**
 * Open file in new tab (browser handles display/print).
 * After opening, we mark it printed on the server.
 */
async function openAndPrint(fileId, getDownloadUrlFn, markPrintedFn) {
  const res = await getDownloadUrlFn(fileId)
  const url = res.data.url
  window.open(url, '_blank', 'noopener')
  await markPrintedFn(fileId)
}

export default function PrintFiles() {
  const [labs,         setLabs]         = useState([])
  const [selLab,       setSelLab]       = useState('')
  const [candidates,   setCandidates]   = useState([])
  const [selCand,      setSelCand]      = useState(null)
  const [files,        setFiles]        = useState([])
  const [candLoading,  setCandLoading]  = useState(false)
  const [fileLoading,  setFileLoading]  = useState(false)
  const [printingId,   setPrintingId]   = useState(null)
  const [printingAll,  setPrintingAll]  = useState(false)
  const [deletingId,   setDeletingId]   = useState(null)
  const [confirmDel,   setConfirmDel]   = useState(null)
  const [msg,          setMsg]          = useState('')
  const [err,          setErr]          = useState('')

  // Load labs once
  useEffect(() => {
    getLabs().then(r => setLabs(r.data)).catch(() => setErr('Failed to load labs.'))
  }, [])

  // Refresh both file list and candidate counts
  const refreshAll = useCallback(async (lab, userId) => {
    const [fr, cr] = await Promise.all([
      getCandidateFiles(userId),
      getCandidatesByLab(lab),
    ])
    setFiles(fr.data)
    setCandidates(cr.data)
    const fresh = cr.data.find(c => c.user_id === userId)
    if (fresh) setSelCand(fresh)
  }, [])

  const handleLabChange = async lab => {
    setSelLab(lab); setSelCand(null); setFiles([])
    setCandidates([]); setMsg(''); setErr('')
    if (!lab) return
    setCandLoading(true)
    try { const r = await getCandidatesByLab(lab); setCandidates(r.data) }
    catch { setErr('Failed to load candidates.') }
    finally { setCandLoading(false) }
  }

  const handleCandClick = useCallback(async cand => {
    setSelCand(cand); setFiles([]); setFileLoading(true)
    setMsg(''); setErr(''); setConfirmDel(null)
    try { const r = await getCandidateFiles(cand.user_id); setFiles(r.data) }
    catch { setErr('Failed to load files.') }
    finally { setFileLoading(false) }
  }, [])

  // ── Print single file ──────────────────────────────────────
  const handlePrint = async f => {
    setErr(''); setMsg('')
    setPrintingId(f.id)
    try {
      await openAndPrint(f.id, getDownloadUrl, markPrinted)
      setMsg(`Opened: ${f.original_name} — mark as printed done.`)
      await refreshAll(selLab, selCand.user_id)
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not open file.')
    } finally { setPrintingId(null) }
  }

  // ── Print ALL unprinted files one by one ──────────────────
  const handlePrintAll = async () => {
    const queue = files.filter(f => f.status !== 'Printed')
    if (!queue.length) { setMsg('All files are already printed.'); return }
    setPrintingAll(true); setErr(''); setMsg('')
    for (const f of queue) {
      try {
        await openAndPrint(f.id, getDownloadUrl, markPrinted)
        // Small delay between tabs so browser doesn't block popups
        await new Promise(r => setTimeout(r, 600))
      } catch {
        setErr(`Failed to open: ${f.original_name}`)
        break
      }
    }
    await refreshAll(selLab, selCand.user_id)
    setMsg(`Done — ${queue.length} file(s) opened in new tabs.`)
    setPrintingAll(false)
  }

  // ── Delete ────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!confirmDel) return
    const f = confirmDel
    setConfirmDel(null); setDeletingId(f.id); setErr('')
    try {
      await deleteFile(f.id)
      setMsg(`Removed: ${f.original_name}`)
      await refreshAll(selLab, selCand.user_id)
    } catch (e) {
      setErr(e.response?.data?.error || 'Delete failed.')
    } finally { setDeletingId(null) }
  }

  // Candidate status pill
  const candStatus = c => {
    if (c.total_files === 0)                return { label: 'No uploads',  cls: 'cs-none' }
    if (c.printed_files === c.total_files)  return { label: 'All printed', cls: 'cs-done' }
    if (c.printed_files > 0)               return { label: 'Partial',     cls: 'cs-part' }
    return                                         { label: `${c.total_files} uploaded`, cls: 'cs-up' }
  }

  const allPrinted = files.length > 0 && files.every(f => f.status === 'Printed')

  return (
    <div className="page pf-page">

      {/* ── Delete modal ── */}
      {confirmDel && (
        <div className="pf-modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div className="pf-modal-icon">🗑</div>
            <h3 className="pf-modal-title">Delete File?</h3>
            <p className="pf-modal-body">
              <strong>{confirmDel.original_name}</strong> will be permanently removed.
            </p>
            <div className="pf-modal-actions">
              <button className="pf-modal-btn pf-modal-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="pf-modal-btn pf-modal-confirm" onClick={handleDeleteConfirm}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Print Files</h1>
          <p className="page-sub">Select a lab · click a candidate · open and print files</p>
        </div>
        <div className="pf-lab-select">
          <label className="pf-lab-label">Lab</label>
          <select className="select-input pf-lab-dropdown" value={selLab}
            onChange={e => handleLabChange(e.target.value)}>
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

          {/* ── Left: candidates ── */}
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
                const st = candStatus(c)
                const active = selCand?.user_id === c.user_id
                return (
                  <div key={c.user_id}
                    className={`pf-cand-card ${active ? 'pf-cand-active' : ''}`}
                    onClick={() => handleCandClick(c)}>
                    <div className="pf-cand-top">
                      <div className="pf-cand-info">
                        <span className="pf-cand-id">{c.user_id}</span>
                        <span className="pf-cand-name">{c.name}</span>
                      </div>
                      <span className={`pf-cand-status ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="pf-cand-bar">
                      <div className="pf-mini-stats">
                        <span className="pf-mini-stat">
                          <span className="pf-mini-dot dot-total"/>
                          {c.total_files} uploaded
                        </span>
                        <span className="pf-mini-stat">
                          <span className="pf-mini-dot dot-printed"/>
                          {c.printed_files} printed
                        </span>
                      </div>
                      {c.total_files > 0 && (
                        <div className="pf-progress-track">
                          <div className="pf-progress-fill"
                            style={{ width:`${(c.printed_files/c.total_files)*100}%` }}/>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right: file cards ── */}
          <div className="pf-right">
            {!selCand && (
              <div className="pf-empty-state pf-pick-hint">
                <span className="pf-empty-icon">👈</span>
                <p>Click a candidate to view their files</p>
              </div>
            )}

            {selCand && (
              <>
                <div className="pf-panel-head pf-right-head">
                  <div className="pf-right-identity">
                    <span className="pf-right-name">{selCand.name}</span>
                    <code className="pf-right-id">{selCand.user_id}</code>
                  </div>
                  <div className="pf-right-actions">
                    <span className="pf-file-count">
                      {selCand.total_files} file{selCand.total_files !== 1 ? 's' : ''} · {selCand.printed_files} printed
                    </span>
                    {/* Print All button */}
                    <button
                      className={`pf-print-all-btn ${allPrinted ? 'pf-print-all-done' : 'pf-print-all-go'}`}
                      onClick={handlePrintAll}
                      disabled={printingAll || fileLoading || allPrinted}
                      title={allPrinted ? 'All files already printed' : 'Open all unprinted files in new tabs'}
                    >
                      {printingAll
                        ? <><span className="pf-spinner"/>Opening…</>
                        : allPrinted ? '✓ All Printed' : '🖨 Print All'
                      }
                    </button>
                  </div>
                </div>

                {fileLoading && <div className="pf-loading">Loading files…</div>}

                {!fileLoading && files.length === 0 && (
                  <div className="pf-no-files">
                    <span style={{fontSize:'2.5rem'}}>📭</span>
                    <p>No files uploaded yet.</p>
                  </div>
                )}

                {!fileLoading && files.length > 0 && (
                  <div className="pf-file-cards">
                    {files.map(f => {
                      const meta     = TYPE_META[f.file_type] || TYPE_META.Word
                      const printed  = f.status === 'Printed'
                      const isPrinting = printingId === f.id
                      const isDeleting = deletingId === f.id

                      return (
                        <div key={f.id}
                          className={`pf-file-card ${printed ? 'pf-file-printed' : ''} ${isDeleting ? 'pf-file-deleting' : ''}`}>

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
                            <span className="pf-meta-dot">·</span>
                            <span>{fmtDate(f.uploaded_at)}</span>
                          </div>

                          {printed && (
                            <div className="pf-print-info">
                              ✓ {f.printed_by} · {fmtDate(f.printed_at)}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="pf-file-actions">
                            {/* Open & Print / Reopen */}
                            <button
                              className={`pf-action-btn ${printed ? 'pf-print-btn-done' : 'pf-print-btn-go'}`}
                              onClick={() => handlePrint(f)}
                              disabled={isPrinting || printingAll || isDeleting}
                              title={printed ? 'Open file again' : 'Open file in new tab and mark printed'}
                            >
                              {isPrinting
                                ? <><span className="pf-spinner pf-spinner-sm"/>Opening…</>
                                : printed ? '↗ Reopen' : '🖨 Open & Print'
                              }
                            </button>

                            {/* Delete */}
                            <button
                              className="pf-action-btn pf-delete-btn"
                              onClick={() => setConfirmDel(f)}
                              disabled={isDeleting || isPrinting || printingAll}
                              title="Remove this file"
                            >
                              {isDeleting
                                ? <><span className="pf-spinner pf-spinner-sm pf-spinner-red"/>Deleting…</>
                                : '🗑'
                              }
                            </button>
                          </div>
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