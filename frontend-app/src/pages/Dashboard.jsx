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
          <h1 className="page-title">Welcome, {user?.name}</h1>
          <p className="page-sub">
            {user?.role}{user?.lab ? ` · ${user.lab}` : ''}
          </p>
        </div>
        <div className={`role-badge role-${user?.role?.toLowerCase()}`}>
          {user?.role}
        </div>
      </div>

      <div className="dash-grid">
        {roleCards.map(c => (
          <button key={c.path} className="dash-card" onClick={() => navigate(c.path)}>
            <span className="dash-icon">{c.icon}</span>
            <h3>{c.title}</h3>
            <p>{c.sub}</p>
          </button>
        ))}
      </div>

      {isCandidate && (
        <div className="info-box">
          <h3>📋 Exam Instructions</h3>
          <ul>
            <li>Upload <strong>one Word (.doc/.docx)</strong> file</li>
            <li>Upload <strong>one Excel (.xls/.xlsx)</strong> file</li>
            <li>Upload <strong>one PowerPoint (.ppt/.pptx)</strong> file</li>
            <li>Maximum file size: <strong>20 MB</strong> per file</li>
            <li>You can re-upload a file if needed (until it is printed)</li>
          </ul>
        </div>
      )}
    </div>
  )
}
