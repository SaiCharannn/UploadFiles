import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const NAV = {
  SuperAdmin: [
    { to: '/dashboard',    label: 'Dashboard',    icon: '⊞' },
    { to: '/manage-users', label: 'Manage Users', icon: '👥' },
    { to: '/bulk-upload',  label: 'Bulk Upload',  icon: '⬆' },
    { to: '/print-files',  label: 'Print Files',  icon: '🖨' },
  ],
  Staff: [
    { to: '/dashboard',    label: 'Dashboard',    icon: '⊞' },
    { to: '/manage-users', label: 'Candidates',   icon: '👥' },
    { to: '/bulk-upload',  label: 'Bulk Upload',  icon: '⬆' },
    { to: '/print-files',  label: 'Print Files',  icon: '🖨' },
  ],
  Candidate: [
    { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { to: '/my-files',  label: 'My Files',  icon: '📁' },
  ],
}

export default function Layout({ children }) {
  const { user, logout }  = useAuth()
  const { theme, toggle } = useTheme()
  const navigate           = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const links = NAV[user?.role] || []

  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>

      {/* ── Top header bar — full width, sits above sidebar + main ── */}
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-header-logo">IIA<b>P</b></span>
          <div className="app-header-divider" />
          <div className="app-header-titles">
            <span className="app-header-exam">IIAP Exam</span>
            <span className="app-header-powered">
              Powered by <strong>Nivansys Technologies</strong>
            </span>
          </div>
        </div>
        <div className="app-header-right">
          <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
            {user?.role}
          </span>
          <span className="app-header-user">{user?.name}</span>
        </div>
      </header>

      {/* ── Body: sidebar + main content side by side ── */}
      <div className="app-body">
        <aside className="sidebar">
          {/* Collapse toggle — no logo, header already has IIAP */}
          <div className="sidebar-collapse-bar">
            {!collapsed && <span className="sidebar-collapse-label">Menu</span>}
            <button
              className="sidebar-toggle"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '▶' : '◀'}
            </button>
          </div>

          <nav className="sidebar-nav">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{l.icon}</span>
                {!collapsed && <span className="nav-label">{l.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            {!collapsed && (
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
                {user?.lab && <div className="user-lab">{user.lab}</div>}
              </div>
            )}

            <button
              className="theme-toggle-btn"
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="theme-icon">{theme === 'dark' ? '☀' : '🌙'}</span>
              {!collapsed && (
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              )}
            </button>

            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <span>⏻</span>
              {!collapsed && ' Logout'}
            </button>
          </div>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>

    </div>
  )
}
