// import { Routes, Route } from 'react-router-dom';
// import ProtectedRoute from './components/ProtectedRoute';

// import Dashboard from './pages/Dashboard';
// import UploadFiles from './pages/UploadFiles';
// import BulkUserUpload from './pages/BulkUserUpload';
// import ManageUsers from './pages/ManageUsers';
// import CandidateFiles from './pages/CandidateFiles';
// import Login from './pages/Login';

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/login" element={<Login />} />

//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute>
//             <Dashboard />
//           </ProtectedRoute>
//         }
//       >
//         {/* Candidate */}
//         <Route
//           path="upload"
//           element={
//             <ProtectedRoute allowedRoles={['Candidate']}>
//               <UploadFiles />
//             </ProtectedRoute>
//           }
//         />

//         {/* Staff + SuperAdmin */}
//         <Route
//           path="candidate-files"
//           element={
//             <ProtectedRoute allowedRoles={['Staff', 'SuperAdmin']}>
//               <CandidateFiles />
//             </ProtectedRoute>
//           }
//         />

//         {/* SuperAdmin only */}
//         <Route
//           path="bulk-upload"
//           element={
//             <ProtectedRoute allowedRoles={['SuperAdmin']}>
//               <BulkUserUpload />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="users"
//           element={
//             <ProtectedRoute allowedRoles={['SuperAdmin']}>
//               <ManageUsers />
//             </ProtectedRoute>
//           }
//         />
//       </Route>
//     </Routes>
//   );
// }

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ManageUsers from './pages/ManageUsers.jsx'
import BulkUpload from './pages/BulkuserUpload.jsx'
import CandidateFiles from './pages/CandidateFiles.jsx'
import PrintFiles from './pages/PrintFiles.jsx'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Redirect root → dashboard if logged in, else login */}
      <Route path="/" element={
        user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      }/>

      {/* All authenticated routes share Layout */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="/manage-users" element={
        <ProtectedRoute roles={['SuperAdmin', 'Staff']}>
          <Layout><ManageUsers /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="/bulk-upload" element={
        <ProtectedRoute roles={['SuperAdmin', 'Staff']}>
          <Layout><BulkUpload /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="/my-files" element={
        <ProtectedRoute roles={['Candidate']}>
          <Layout><CandidateFiles /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="/print-files" element={
        <ProtectedRoute roles={['SuperAdmin', 'Staff']}>
          <Layout><PrintFiles /></Layout>
        </ProtectedRoute>
      }/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}