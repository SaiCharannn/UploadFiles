// import { Link, Outlet } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function Dashboard() {
//   const { user, logout } = useAuth();

//   // 🔥 Role-based menus
//   const menusByRole = {
//     SuperAdmin: [
//       { path: 'bulk-upload', label: '📤 Bulk User Upload' },
//       { path: 'users', label: '👥 Manage Users' },
//       { path: 'candidate-files', label: '📂 Candidate Files' },
//     ],
//     Staff: [
//       { path: 'candidate-files', label: '📂 Candidate Files' },
//     ],
//     Candidate: [
//       { path: 'upload', label: '📁 Upload Files' },
//     ]
//   };

//   const menus = menusByRole[user?.role] || [];

//   return (
//     <div style={{ display: 'flex', height: '100vh' }}>
//       {/* Sidebar */}
//       <div style={{ width: 250, background: '#1e293b', color: '#fff', padding: 20 }}>
//         <h3 style={{ marginBottom: 20 }}>UploadFiles</h3>

//         {menus.map((item) => (
//           <div key={item.path} style={{ marginBottom: 10 }}>
//             <Link
//               to={`/dashboard/${item.path}`}
//               style={{ color: '#fff', textDecoration: 'none' }}
//             >
//               {item.label}
//             </Link>
//           </div>
//         ))}

//         <div style={{ marginTop: 30 }}>
//           <p>{user?.name}</p>
//           <p style={{ fontSize: 12 }}>{user?.role}</p>

//           <button onClick={logout} style={{ marginTop: 10 }}>
//             Sign out
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div style={{ flex: 1, padding: 20 }}>
//         <Outlet />
//       </div>
//     </div>
//   );
// }

// const s = {
//   shell:     {display:'flex',minHeight:'100vh',fontFamily:'system-ui,sans-serif'},
//   sidebar:   {width:228,background:'#1e293b',display:'flex',flexDirection:'column',flexShrink:0},
//   brand:     {padding:'22px 20px 18px',borderBottom:'1px solid #334155'},
//   brandTitle:{margin:0,fontSize:17,fontWeight:800,color:'#fff'},
//   brandSub:  {margin:'2px 0 0',fontSize:10,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em'},
//   nav:       {flex:1,padding:'14px 10px',display:'flex',flexDirection:'column',gap:3},
//   navLink:   {display:'block',padding:'9px 14px',borderRadius:7,fontSize:13,fontWeight:500,color:'#94a3b8',textDecoration:'none'},
//   active:    {background:'#334155',color:'#fff'},
//   footer:    {padding:'14px 16px',borderTop:'1px solid #334155'},
//   userRow:   {display:'flex',alignItems:'center',gap:8,marginBottom:12},
//   dot:       {width:8,height:8,borderRadius:'50%',flexShrink:0},
//   userName:  {margin:0,fontSize:13,fontWeight:600,color:'#f1f5f9'},
//   userMeta:  {margin:'2px 0 0',fontSize:11,color:'#64748b'},
//   logoutBtn: {width:'100%',padding:'8px 0',background:'#dc2626',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer'},
//   main:      {flex:1,background:'#f1f5f9',overflow:'auto'},
//   home:      {padding:'40px 36px'},
//   homeTitle: {margin:'0 0 8px',fontSize:22,fontWeight:700,color:'#1e293b'},
//   homeSub:   {margin:'0 0 16px',color:'#64748b',fontSize:14},
//   tip:       {margin:0,fontSize:14,color:'#475569',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'12px 16px'},
// };

import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const cards = {
    SuperAdmin: [
      { title: 'Manage Users',  sub: 'Create, edit, deactivate Staff & Candidates', icon: '👥', path: '/manage-users' },
      { title: 'Bulk Upload',   sub: 'Upload Excel to create multiple users at once', icon: '⬆', path: '/bulk-upload' },
      { title: 'Print Files',   sub: 'Browse and print candidate submissions',        icon: '🖨', path: '/print-files' },
    ],
    Staff: [
      { title: 'Candidates',    sub: 'Manage candidate accounts',                   icon: '👥', path: '/manage-users' },
      { title: 'Bulk Upload',   sub: 'Bulk-create candidate accounts via Excel',     icon: '⬆', path: '/bulk-upload' },
      { title: 'Print Files',   sub: 'Browse and print candidate submissions',       icon: '🖨', path: '/print-files' },
    ],
    Candidate: [
      { title: 'Upload Files',  sub: 'Submit your Word, Excel, and PPT files',      icon: '📤', path: '/my-files' },
    ],
  }

  const roleCards = cards[user?.role] || []

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name}</h1>
          <p className="page-sub">{user?.role} · {user?.lab || 'No lab assigned'}</p>
        </div>
        <div className={`role-badge role-${user?.role?.toLowerCase()}`}>{user?.role}</div>
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

      {user?.role === 'Candidate' && (
        <div className="info-box">
          <h3>📋 Exam Instructions</h3>
          <ul>
            <li>Upload <strong>one Word (.doc/.docx)</strong> file</li>
            <li>Upload <strong>one Excel (.xls/.xlsx)</strong> file</li>
            <li>Upload <strong>one PowerPoint (.ppt/.pptx)</strong> file</li>
            <li>Maximum file size: <strong>20 MB</strong> per file</li>
            <li>You can re-upload a file if needed</li>
          </ul>
        </div>
      )}
    </div>
  )
}