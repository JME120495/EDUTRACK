import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Layout from './components/Shared/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/Public/RegisterPage';
import ForgotPasswordPage from './pages/Public/ForgotPasswordPage';
import LandingPage from './pages/Public/LandingPage';
import DirectorDashboard from './pages/Director/Dashboard';
import StudentsPage from './pages/Director/StudentsPage';
import ClassesPage from './pages/Director/ClassesPage';
import TeachersPage from './pages/Director/TeachersPage';
import TimetablePage from './pages/Director/TimetablePage';
import GradeEntryPage from './pages/Teacher/GradeEntryPage';
import AbsencesPage from './pages/Teacher/AbsencesPage';
import BulletinsPage from './pages/Director/BulletinsPage';
import PaymentsPage from './pages/Director/PaymentsPage';
import PayrollPage from './pages/Director/PayrollPage';
import SettingsPage from './pages/Director/SettingsPage';
import ParentPortal from './pages/Parent/ParentPortal';
import TeacherPayrollPage from './pages/Teacher/TeacherPayrollPage';
import HRPage from './pages/Director/HRPage';
import DocumentsPage from './pages/Director/DocumentsPage';
import CenseurDashboard from './pages/Censeur/CenseurDashboard';
import IntendantDashboard from './pages/Intendant/IntendantDashboard';
import AdminStaffPage from './pages/Director/AdminStaffPage';
import SupportStaffPage from './pages/Director/SupportStaffPage';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import LibraryPage from './pages/Director/LibraryPage';
import StudentPortal from './pages/Student/StudentPortal';
import MessagesPage from './pages/Shared/MessagesPage';
import PricingPage from './pages/Public/PricingPage';
import BillingPage from './pages/Director/BillingPage';

function HomeRedirect() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PARENT') return <Navigate to="/parent" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'CENSEUR') return <Navigate to="/censeur/dashboard" replace />;
  if (user.role === 'INTENDANT') return <Navigate to="/intendant/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Route guard to enforce role restrictions
function RoleRoute({ roles, children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    if (user.role === 'PARENT') return <Navigate to="/parent" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/grades" replace />;
    if (user.role === 'CENSEUR') return <Navigate to="/censeur/dashboard" replace />;
    if (user.role === 'INTENDANT') return <Navigate to="/intendant/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Route guard to enforce plan restrictions (for Director)
import UpgradeOverlay from './components/Shared/UpgradeOverlay';

function PlanRoute({ allowedPlans, title, description, requiredPlan, children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  
  // Only Directors have to deal with plan restrictions in the UI directly in most cases, 
  // but let's check it globally
  const currentPlan = user.subscriptionPlan || 'PREMIUM';
  if (!allowedPlans.includes(currentPlan)) {
    return <UpgradeOverlay title={title} description={description} requiredPlan={requiredPlan} />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard-redirect" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<RoleRoute roles={['DIRECTOR']}><DirectorDashboard /></RoleRoute>} />
          <Route path="/censeur/dashboard" element={<RoleRoute roles={['CENSEUR']}><CenseurDashboard /></RoleRoute>} />
          <Route path="/intendant/dashboard" element={<RoleRoute roles={['INTENDANT']}><IntendantDashboard /></RoleRoute>} />
          <Route path="/admin-staff" element={<RoleRoute roles={['DIRECTOR']}><AdminStaffPage /></RoleRoute>} />
          <Route path="/support-staff" element={<RoleRoute roles={['DIRECTOR', 'INTENDANT']}><SupportStaffPage /></RoleRoute>} />
          <Route path="/students" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><StudentsPage /></RoleRoute>} />
          <Route path="/classes" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><ClassesPage /></RoleRoute>} />
          <Route path="/teachers" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><TeachersPage /></RoleRoute>} />
          <Route path="/timetable" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><TimetablePage /></RoleRoute>} />
          <Route path="/grades" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR', 'TEACHER']}><GradeEntryPage /></RoleRoute>} />
          <Route path="/absences" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR', 'TEACHER']}><AbsencesPage /></RoleRoute>} />
          <Route path="/bulletins" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR', 'TEACHER']}><BulletinsPage /></RoleRoute>} />
          <Route path="/payments" element={
            <RoleRoute roles={['DIRECTOR', 'INTENDANT']}>
              <PlanRoute allowedPlans={['STANDARD', 'PREMIUM', 'CUSTOM']} title="Gestion Financière" description="Le suivi des paiements de scolarité nécessite le pack Standard." requiredPlan="Standard">
                <PaymentsPage />
              </PlanRoute>
            </RoleRoute>
          } />
          <Route path="/hr" element={
            <RoleRoute roles={['DIRECTOR', 'INTENDANT']}>
              <PlanRoute allowedPlans={['PREMIUM', 'CUSTOM']} title="Ressources Humaines" description="La gestion des contrats, de la paie et des congés nécessite le pack Premium." requiredPlan="Premium">
                <HRPage />
              </PlanRoute>
            </RoleRoute>
          } />
          <Route path="/documents" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><DocumentsPage /></RoleRoute>} />
          <Route path="/teacher/dashboard" element={<RoleRoute roles={['TEACHER']}><TeacherDashboard /></RoleRoute>} />
          <Route path="/teacher/payroll" element={<RoleRoute roles={['TEACHER']}><TeacherPayrollPage /></RoleRoute>} />
          <Route path="/settings" element={<RoleRoute roles={['DIRECTOR']}><SettingsPage /></RoleRoute>} />
          <Route path="/parent" element={<RoleRoute roles={['PARENT']}><ParentPortal /></RoleRoute>} />
          <Route path="/student" element={<RoleRoute roles={['STUDENT']}><StudentPortal /></RoleRoute>} />
          <Route path="/director/library" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><LibraryPage /></RoleRoute>} />
          <Route path="/billing" element={<RoleRoute roles={['DIRECTOR']}><BillingPage /></RoleRoute>} />
          <Route path="/director/timetable" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><TimetablePage /></RoleRoute>} />
          <Route path="/messages" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR', 'INTENDANT', 'TEACHER', 'PARENT', 'STUDENT']}><MessagesPage /></RoleRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
