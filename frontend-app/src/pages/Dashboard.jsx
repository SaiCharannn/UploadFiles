import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const cards = {
    SuperAdmin: [
      { title: 'Manage Users', sub: 'Create, edit, deactivate Staff & Candidates', icon: '👥', path: '/manage-users' },
      { title: 'Bulk Upload',  sub: 'Upload Excel to create multiple users at once', icon: '⬆', path: '/bulk-upload' },
      { title: 'Print Files',  sub: 'Browse and print candidate submissions',        icon: '🖨', path: '/print-files' },
    ],
    Staff: [
      { title: 'Candidates',  sub: 'Manage candidate accounts',                icon: '👥', path: '/manage-users' },
      { title: 'Bulk Upload', sub: 'Bulk-create candidate accounts via Excel',  icon: '⬆', path: '/bulk-upload' },
      { title: 'Print Files', sub: 'Browse and print candidate submissions',    icon: '🖨', path: '/print-files' },
    ],
    Candidate: [
      { title: 'Upload Files', sub: 'Submit your Word, Excel, and PPT files', icon: '📤', path: '/my-files' },
    ],
  }

  const roleCards  = cards[user?.role] || []
  const isCandidate = user?.role === 'Candidate'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: 'var(--text)' }}>
            Welcome, {user?.name}
          </h1>
          <p className="page-sub" style={{ color: 'var(--muted)' }}>
            {user?.role}{user?.lab ? ` · ${user.lab}` : ''}
          </p>
        </div>
        <div className={`role-badge role-${user?.role?.toLowerCase()}`}>
          {user?.role}
        </div>
      </div>

      <div className="dash-grid">
        {roleCards.map(c => (
          <button
            key={c.path}
            className="dash-card"
            onClick={() => navigate(c.path)}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <span className="dash-icon">{c.icon}</span>
            <h3 style={{ color: 'var(--text)' }}>{c.title}</h3>
            <p style={{ color: 'var(--muted)' }}>{c.sub}</p>
          </button>
        ))}
      </div>

      {isCandidate && (
        <div
          className="info-box"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          <h3 style={{ color: 'var(--text)' }}>📋 Exam Instructions</h3>
          <ul>
            <li style={{ color: 'var(--text)' }}>
              Upload <strong style={{ color: 'var(--accent2, var(--accent))' }}>one Word (.doc/.docx)</strong> file
            </li>
            <li style={{ color: 'var(--text)' }}>
              Upload <strong style={{ color: 'var(--accent2, var(--accent))' }}>one Excel (.xls/.xlsx)</strong> file
            </li>
            <li style={{ color: 'var(--text)' }}>
              Upload <strong style={{ color: 'var(--accent2, var(--accent))' }}>one PowerPoint (.ppt/.pptx)</strong> file
            </li>
            <li style={{ color: 'var(--text)' }}>
              Maximum file size: <strong style={{ color: 'var(--accent2, var(--accent))' }}>20 MB</strong> per file
            </li>
            <li style={{ color: 'var(--text)' }}>
              You can re-upload a file if needed (until it is printed)
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}