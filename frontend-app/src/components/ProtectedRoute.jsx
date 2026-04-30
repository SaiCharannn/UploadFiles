// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function ProtectedRoute({ children, allowedRoles }) {
//   const { user, loading } = useAuth();

//   if (loading) return null;

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

  
//   if (allowedRoles && !allowedRoles.includes(user.role)) {
//     // redirect based on role
//     if (user.role === 'Candidate') {
//       return <Navigate to="/dashboard/upload" replace />;
//     } else if (user.role === 'Staff') {
//       return <Navigate to="/dashboard/candidate-files" replace />;
//     } else {
//       return <Navigate to="/dashboard/users" replace />;
//     }
//   }

//   return children;
// }

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading"><span className="dot"/><span className="dot"/><span className="dot"/></div>
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}