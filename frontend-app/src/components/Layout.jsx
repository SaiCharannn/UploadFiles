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
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo">IIA<b>P</b></span>
          {!collapsed && <span className="brand-text">UploadFiles</span>}
          <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
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
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
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
  )
}
