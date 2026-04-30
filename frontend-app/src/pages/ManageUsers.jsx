// import { useState, useEffect, useCallback } from 'react';
// import { getUsers, unlockUser, resetPassword } from '../api/users';

// const PWD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*])[A-Za-z\d@#$%&*]{8,20}$/;

// function StatusBadge({ status }) {
//   const m = {
//     ACTIVE:{bg:'#dcfce7',c:'#166534'},
//     INACTIVE:{bg:'#f1f5f9',c:'#475569'},
//     LOCKED:{bg:'#fee2e2',c:'#991b1b'}
//   };
//   const t = m[status]||m.INACTIVE;
//   return <span style={{display:'inline-block',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:t.bg,color:t.c}}>{status}</span>;
// }

// export default function ManageUsers() {
//   const [tab, setTab] = useState('Admin'); // 👈 Admin tab shows Staff + SuperAdmin
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [actionUid, setActionUid] = useState(null);
//   const [newPwd, setNewPwd] = useState('');
//   const [pwdError, setPwdError] = useState('');
//   const [working, setWorking] = useState(false);
//   const [msg, setMsg] = useState('');

//   const load = useCallback(async (role) => {
//     setLoading(true);
//     try {
//       let data = [];

//       if (role === 'Admin') {
//         // 👇 Combine Staff + SuperAdmin
//         const staff = await getUsers('Staff');
//         const superAdmins = await getUsers('SuperAdmin');
//         data = [...staff, ...superAdmins];
//       } else {
//         data = await getUsers(role);
//       }

//       setUsers(data);
//     } catch(e) {
//       setMsg(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { load(tab); }, [tab, load]);

//   const handleUnlock = async (uid) => {
//     setWorking(true);
//     try {
//       await unlockUser(uid);
//       setUsers(prev=>prev.map(u=>u.user_id===uid?{...u,user_status:'ACTIVE',failed_attempts:0}:u));
//       setMsg(`${uid} unlocked.`); setTimeout(()=>setMsg(''),3000);
//     } catch(e) {
//       setMsg(e.message);
//     } finally {
//       setWorking(false);
//       setActionUid(null);
//     }
//   };

//   const handleResetPwd = async (uid) => {
//     if (!PWD_RE.test(newPwd)) {
//       setPwdError('Invalid format: 8-20 chars, 1 upper, 1 number, 1 special (@#$%&*)');
//       return;
//     }
//     setWorking(true);
//     try {
//       await resetPassword(uid, newPwd);
//       setMsg(`Password reset for ${uid}.`);
//       setTimeout(()=>setMsg(''),3000);
//       setActionUid(null);
//       setNewPwd('');
//     } catch(e) {
//       setPwdError(e.message);
//     } finally {
//       setWorking(false);
//     }
//   };

//   const filtered = users.filter(u =>
//     u.user_id.toLowerCase().includes(search.toLowerCase()) ||
//     u.name.toLowerCase().includes(search.toLowerCase()) ||
//     (u.lab||'').toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div style={s.page}>
//       <div style={s.header}>
//         <h2 style={s.title}>Manage Users</h2>

//         <div style={s.tabs}>
//           {['Admin','Candidate'].map(r=>(
//             <button
//               key={r}
//               onClick={()=>{setTab(r);setSearch('');}}
//               style={{...s.tab,...(tab===r?s.tabActive:{})}}
//             >
//               {r === 'Admin' ? '👤 Staff & SuperAdmin' : '🎓 Candidates'}
//             </button>
//           ))}
//         </div>
//       </div>

//       {msg && <div style={s.msgBanner}>{msg}</div>}

//       <div style={s.toolbar}>
//         <input
//           value={search}
//           onChange={e=>setSearch(e.target.value)}
//           placeholder="Search by ID, name, or lab…"
//           style={s.searchInput}
//         />
//         <span style={s.count}>
//           {filtered.length} {tab === 'Admin' ? 'Users' : tab}{filtered.length!==1?'s':''}
//         </span>
//       </div>

//       {loading ? (
//         <p style={s.hint}>Loading…</p>
//       ) : filtered.length === 0 ? (
//         <p style={s.hint}>No {tab === 'Admin' ? 'users' : tab.toLowerCase()}s found.</p>
//       ) : (
//         <div style={s.tableWrap}>
//           <table style={s.tbl}>
//             <thead>
//               <tr>
//                 {['User ID','Name','Lab','Status','Actions'].map(h=>(
//                   <th key={h} style={s.th}>{h}</th>
//                 ))}
//               </tr>
//             </thead>

//             <tbody>
//               {filtered.map(u=>(
//                 <tr key={u.user_id} style={s.tr}>
//                   <td style={{...s.td,fontWeight:600,color:'#1e40af'}}>{u.user_id}</td>
//                   <td style={s.td}>{u.name}</td>
//                   <td style={{...s.td,color:'#64748b'}}>{u.lab||'—'}</td>
//                   <td style={s.td}><StatusBadge status={u.user_status}/></td>

//                   <td style={s.td}>
//                     <div style={s.btnRow}>
//                       {u.user_status==='LOCKED' && (
//                         <button
//                           disabled={working}
//                           onClick={()=>handleUnlock(u.user_id)}
//                           style={s.unlockBtn}
//                         >
//                           🔓 Unlock
//                         </button>
//                       )}

//                       <button
//                         onClick={()=>{
//                           setActionUid(u.user_id===actionUid?null:u.user_id);
//                           setNewPwd('');
//                           setPwdError('');
//                         }}
//                         style={s.resetBtn}
//                       >
//                         🔑 Reset Pwd
//                       </button>
//                     </div>

//                     {actionUid===u.user_id && (
//                       <div style={s.pwdBox}>
//                         <input
//                           type="password"
//                           value={newPwd}
//                           onChange={e=>{
//                             setNewPwd(e.target.value);
//                             setPwdError('');
//                           }}
//                           placeholder="New password"
//                           style={s.pwdInput}
//                           maxLength={20}
//                         />

//                         {pwdError && <p style={s.errText}>{pwdError}</p>}

//                         <div style={s.btnRow}>
//                           <button
//                             onClick={()=>handleResetPwd(u.user_id)}
//                             disabled={working}
//                             style={s.confirmBtn}
//                           >
//                             {working?'Saving…':'Confirm'}
//                           </button>

//                           <button
//                             onClick={()=>setActionUid(null)}
//                             style={s.cancelBtn}
//                           >
//                             Cancel
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </td>

//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// const s = {
//   page:       {padding:'24px 20px'},
//   header:     {display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:20},
//   title:      {margin:0,fontSize:22,fontWeight:700,color:'#1e293b'},
//   tabs:       {display:'flex',gap:8},
//   tab:        {padding:'8px 18px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',fontSize:13,fontWeight:600,cursor:'pointer',color:'#64748b'},
//   tabActive:  {background:'#1d4ed8',color:'#fff',border:'1px solid #1d4ed8'},
//   toolbar:    {display:'flex',alignItems:'center',gap:12,marginBottom:16},
//   searchInput:{flex:1,padding:'8px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:14,outline:'none'},
//   count:      {fontSize:13,color:'#94a3b8',whiteSpace:'nowrap'},
//   msgBanner:  {background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#166534',borderRadius:8,padding:'10px 16px',marginBottom:14,fontSize:13},
//   hint:       {color:'#94a3b8',fontSize:14,textAlign:'center',padding:'40px 0'},
//   tableWrap:  {background:'#fff',borderRadius:10,boxShadow:'0 1px 8px rgba(0,0,0,.07)',overflowX:'auto'},
//   tbl:        {width:'100%',borderCollapse:'collapse'},
//   th:         {padding:'10px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.05em',borderBottom:'1px solid #e2e8f0',background:'#f8fafc'},
//   tr:         {borderBottom:'1px solid #f1f5f9'},
//   td:         {padding:'12px 16px',fontSize:13,color:'#1e293b',verticalAlign:'top'},
//   btnRow:     {display:'flex',gap:8,flexWrap:'wrap'},
//   unlockBtn:  {padding:'5px 12px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'},
//   resetBtn:   {padding:'5px 12px',background:'#eff6ff',color:'#1d4ed8',border:'1px solid #bfdbfe',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'},
//   confirmBtn: {padding:'6px 14px',background:'#1d4ed8',color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:600},
//   cancelBtn:  {padding:'6px 14px',background:'#f1f5f9',color:'#374151',border:'1px solid #e2e8f0',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:600},
//   pwdBox:     {marginTop:10,padding:'12px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'},
//   pwdInput:   {width:'100%',padding:'8px 10px',border:'1px solid #d1d5db',borderRadius:7,fontSize:13,boxSizing:'border-box',marginBottom:8,outline:'none'},
//   errText:    {color:'#dc2626',fontSize:12,marginBottom:8},
// };


import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getUsers, unlockUser, resetPwd } from '../api/users.js'

export default function ManageUsers() {
  const { user }   = useAuth()
  const isSA       = user?.role === 'SuperAdmin'

  const [users,    setUsers]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [filter,   setFilter]  = useState({ role: isSA ? '' : 'Candidate', search: '' })
  const [modal,    setModal]   = useState(null)  // { type: 'reset'|'unlock', uid, name }
  const [newPwd,   setNewPwd]  = useState('')
  const [msg,      setMsg]     = useState('')
  const [err,      setErr]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.role) params.role = filter.role
      const res = await getUsers(params)
      setUsers(res.data)
    } catch { setErr('Failed to load users.') }
    finally   { setLoading(false) }
  }, [filter.role])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u =>
    u.user_id.toLowerCase().includes(filter.search.toLowerCase()) ||
    u.name.toLowerCase().includes(filter.search.toLowerCase())
  )

  const handleUnlock = async () => {
    try {
      await unlockUser(modal.uid)
      setMsg(`${modal.uid} unlocked successfully.`)
      setModal(null)
      load()
    } catch (e) { setErr(e.response?.data?.error || 'Failed.') }
  }

  const handleReset = async () => {
    if (!newPwd) { setErr('Enter a new password.'); return }
    try {
      await resetPwd(modal.uid, newPwd)
      setMsg(`Password reset for ${modal.uid}.`)
      setModal(null)
      setNewPwd('')
    } catch (e) { setErr(e.response?.data?.error || 'Failed.') }
  }

  const statusClass = s => ({ ACTIVE: 'status-active', LOCKED: 'status-locked', INACTIVE: 'status-inactive' }[s] || '')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isSA ? 'Manage Users' : 'Candidates'}</h1>
          <p className="page-sub">{filtered.length} user(s) shown</p>
        </div>
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg('')}>{msg} ✕</div>}
      {err && <div className="alert alert-error"   onClick={() => setErr('')}>{err} ✕</div>}

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by ID or name…"
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
        />
        {isSA && (
          <select className="select-input" value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
            <option value="">All Roles</option>
            <option value="Staff">Staff</option>
            <option value="Candidate">Candidate</option>
          </select>
        )}
        <button className="btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? <div className="loading-row">Loading…</div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th><th>Name</th><th>Role</th>
                <th>Lab</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan="6" className="empty-row">No users found.</td></tr>
                : filtered.map(u => (
                  <tr key={u.user_id}>
                    <td><code>{u.user_id}</code></td>
                    <td>{u.name}</td>
                    <td><span className={`role-badge role-${u.role.toLowerCase()}`}>{u.role}</span></td>
                    <td>{u.lab || '—'}</td>
                    <td><span className={`status-badge ${statusClass(u.user_status)}`}>{u.user_status}</span></td>
                    <td className="action-cell">
                      {u.user_status === 'LOCKED' && (
                        <button className="btn-sm btn-success" onClick={() => { setModal({ type: 'unlock', uid: u.user_id, name: u.name }); setErr('') }}>
                          Unlock
                        </button>
                      )}
                      <button className="btn-sm btn-warning" onClick={() => { setModal({ type: 'reset', uid: u.user_id, name: u.name }); setErr(''); setNewPwd('') }}>
                        Reset Pwd
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>{modal.type === 'unlock' ? 'Unlock Account' : 'Reset Password'}</h3>
            <p>User: <strong>{modal.uid}</strong> — {modal.name}</p>
            {err && <div className="modal-err">{err}</div>}
            {modal.type === 'reset' && (
              <input
                className="modal-input"
                type="password"
                placeholder="New password"
                value={newPwd}
                onChange={e => { setNewPwd(e.target.value); setErr('') }}
              />
            )}
            <div className="modal-actions">
              <button className="btn-primary" onClick={modal.type === 'unlock' ? handleUnlock : handleReset}>
                Confirm
              </button>
              <button className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}