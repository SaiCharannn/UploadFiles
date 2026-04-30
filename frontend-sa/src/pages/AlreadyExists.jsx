import React from 'react'

export default function AlreadyExists() {
  return (
    <div className="sa-page">
      <div className="sa-card sa-exists-card">
        <div className="sa-exists-icon">⚠</div>
        <h2>SuperAdmin Already Exists</h2>
        <p>This setup utility has already been used.</p>
        <p>Please log in to the main application.</p>
        <a href="http://localhost:5173" className="sa-btn sa-btn-secondary">Go to App →</a>
      </div>
    </div>
  )
}