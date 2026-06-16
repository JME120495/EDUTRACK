import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Layout from './components/Shared/Layout';
import LoginPage from './pages/LoginPage';
import DirectorDashboard from './pages/Director/Dashboard';
import StudentsPage from './pages/Director/StudentsPage';
import ClassesPage from './pages/Director/ClassesPage';
import TeachersPage from './pages/Director/TeachersPage';
import TimetablePage from './pages/Director/TimetablePage';
import GradeEntryPage from './pages/Teacher/GradeEntryPage';
import AbsencesPage from './pages/Teacher/AbsencesPage';
import BulletinsPage from './pages/Director/BulletinsPage';
import PaymentsPage from './pages/Director/PaymentsPage';
import SettingsPage from './pages/Director/SettingsPage';
import ParentPortal from './pages/Parent/ParentPortal';

function HomeRedirect() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PARENT') return <Navigate to="/parent" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/grades" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Route guard to enforce role restrictions
function RoleRoute({ roles, children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    if (user.role === 'PARENT') return <Navigate to="/parent" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/grades" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<RoleRoute roles={['DIRECTOR']}><DirectorDashboard /></RoleRoute>} />
          <Route path="/students" element={<RoleRoute roles={['DIRECTOR']}><StudentsPage /></RoleRoute>} />
          <Route path="/classes" element={<RoleRoute roles={['DIRECTOR']}><ClassesPage /></RoleRoute>} />
          <Route path="/teachers" element={<RoleRoute roles={['DIRECTOR']}><TeachersPage /></RoleRoute>} />
          <Route path="/timetable" element={<RoleRoute roles={['DIRECTOR']}><TimetablePage /></RoleRoute>} />
          <Route path="/grades" element={<RoleRoute roles={['DIRECTOR', 'TEACHER']}><GradeEntryPage /></RoleRoute>} />
          <Route path="/absences" element={<RoleRoute roles={['DIRECTOR', 'TEACHER']}><AbsencesPage /></RoleRoute>} />
          <Route path="/bulletins" element={<RoleRoute roles={['DIRECTOR', 'TEACHER']}><BulletinsPage /></RoleRoute>} />
          <Route path="/payments" element={<RoleRoute roles={['DIRECTOR']}><PaymentsPage /></RoleRoute>} />
          <Route path="/settings" element={<RoleRoute roles={['DIRECTOR']}><SettingsPage /></RoleRoute>} />
          <Route path="/parent" element={<RoleRoute roles={['PARENT']}><ParentPortal /></RoleRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
