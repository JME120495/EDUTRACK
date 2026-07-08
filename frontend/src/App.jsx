import React, { useContext, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Layout from './components/Shared/Layout';
import LoadingSpinner from './components/Shared/LoadingSpinner';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Public/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/Public/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/Public/ForgotPasswordPage'));
const LandingPage = lazy(() => import('./pages/Public/LandingPage'));
const DirectorDashboard = lazy(() => import('./pages/Director/Dashboard'));
const StudentsPage = lazy(() => import('./pages/Director/StudentsPage'));
const ClassesPage = lazy(() => import('./pages/Director/ClassesPage'));
const MatieresPage = lazy(() => import('./pages/Director/MatieresPage'));
const TeachersPage = lazy(() => import('./pages/Director/TeachersPage'));
const TimetablePage = lazy(() => import('./pages/Director/TimetablePage'));
const GradeEntryPage = lazy(() => import('./pages/Teacher/GradeEntryPage'));
const AbsencesPage = lazy(() => import('./pages/Teacher/AbsencesPage'));
const CahierDeTextesPage = lazy(() => import('./pages/Teacher/CahierDeTextesPage'));
const BulletinsPage = lazy(() => import('./pages/Director/BulletinsPage'));
const PaymentsPage = lazy(() => import('./pages/Director/PaymentsPage'));
const PlatformLogin = lazy(() => import('./pages/Platform/PlatformLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/Platform/SuperAdminDashboard'));
const InfluencerDashboard = lazy(() => import('./pages/Platform/InfluencerDashboard'));
const PayrollPage = lazy(() => import('./pages/Director/PayrollPage'));
const SettingsPage = lazy(() => import('./pages/Director/SettingsPage'));
const ParentPortal = lazy(() => import('./pages/Parent/ParentPortal'));
const TeacherPayrollPage = lazy(() => import('./pages/Teacher/TeacherPayrollPage'));
const HRPage = lazy(() => import('./pages/Director/HRPage'));
const DocumentsPage = lazy(() => import('./pages/Director/DocumentsPage'));
const CenseurDashboard = lazy(() => import('./pages/Censeur/CenseurDashboard'));
const IntendantDashboard = lazy(() => import('./pages/Intendant/IntendantDashboard'));
const AccountingPage = lazy(() => import('./pages/Intendant/AccountingPage'));
const AdminStaffPage = lazy(() => import('./pages/Director/AdminStaffPage'));
const SupportStaffPage = lazy(() => import('./pages/Director/SupportStaffPage'));
const TeacherDashboard = lazy(() => import('./pages/Teacher/TeacherDashboard'));
const LibraryPage = lazy(() => import('./pages/Director/LibraryPage'));
const StudentPortal = lazy(() => import('./pages/Student/StudentPortal'));
const MessagesPage = lazy(() => import('./pages/Shared/MessagesPage'));
const PricingPage = lazy(() => import('./pages/Public/PricingPage'));
const BillingPage = lazy(() => import('./pages/Director/BillingPage'));
const LogisticsPage = lazy(() => import('./pages/Director/LogisticsPage'));

function HomeRedirect() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PARENT') return <Navigate to="/parent" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'CENSEUR') return <Navigate to="/censeur/dashboard" replace />;
  if (user.role === 'INTENDANT') return <Navigate to="/intendant/dashboard" replace />;
  if (user.role === 'SURVEILLANT') return <Navigate to="/absences" replace />;
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
    if (user.role === 'SURVEILLANT') return <Navigate to="/absences" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Route guard for Platform/SaaS users
function PlatformRoute({ roles, children }) {
  const token = localStorage.getItem('platform_token');
  const userStr = localStorage.getItem('platform_user');
  if (!token || !userStr) return <Navigate to="/platform/login" replace />;
  try {
    const user = JSON.parse(userStr);
    if (!roles.includes(user.role)) {
      if (user.role === 'INFLUENCER') return <Navigate to="/platform/influencer" replace />;
      return <Navigate to="/platform/admin" replace />;
    }
    return children;
  } catch (e) {
    return <Navigate to="/platform/login" replace />;
  }
}

// Route guard to enforce plan restrictions (for Director)
import UpgradeOverlay from './components/Shared/UpgradeOverlay';
import { ColdStartLoader } from './components/Shared/ServerStatus';

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
      <ColdStartLoader />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          
          {/* Platform Routes */}
          <Route path="/platform/login" element={<PlatformLogin />} />
          <Route path="/platform/influencer" element={<InfluencerDashboard />} />
          <Route path="/platform/admin" element={<SuperAdminDashboard />} />
          
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
            <Route path="/matieres" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><MatieresPage /></RoleRoute>} />
            <Route path="/teachers" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><TeachersPage /></RoleRoute>} />
            <Route path="/timetable" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><TimetablePage /></RoleRoute>} />
            <Route path="/grades" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR', 'TEACHER']}><GradeEntryPage /></RoleRoute>} />
            <Route path="/absences" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR', 'TEACHER', 'SURVEILLANT']}><AbsencesPage /></RoleRoute>} />
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
            <Route path="/payroll" element={<RoleRoute roles={['DIRECTOR', 'INTENDANT']}><PayrollPage /></RoleRoute>} />
            <Route path="/accounting" element={
              <RoleRoute roles={['DIRECTOR', 'INTENDANT']}>
                <PlanRoute allowedPlans={['PREMIUM', 'CUSTOM']} title="Comptabilité OHADA" description="La comptabilité complète nécessite le pack Premium." requiredPlan="Premium">
                  <AccountingPage />
                </PlanRoute>
              </RoleRoute>
            } />
            <Route path="/documents" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><DocumentsPage /></RoleRoute>} />
            <Route path="/logistics" element={<RoleRoute roles={['DIRECTOR', 'INTENDANT']}><LogisticsPage /></RoleRoute>} />
            <Route path="/teacher/dashboard" element={<RoleRoute roles={['TEACHER']}><TeacherDashboard /></RoleRoute>} />
            <Route path="/teacher/payroll" element={<RoleRoute roles={['TEACHER']}><TeacherPayrollPage /></RoleRoute>} />
            <Route path="/teacher/cahier-textes" element={<RoleRoute roles={['TEACHER', 'DIRECTOR', 'CENSEUR']}><CahierDeTextesPage /></RoleRoute>} />
            <Route path="/settings" element={<RoleRoute roles={['DIRECTOR']}><SettingsPage /></RoleRoute>} />
            <Route path="/parent" element={<RoleRoute roles={['PARENT']}><ParentPortal /></RoleRoute>} />
            <Route path="/student" element={<RoleRoute roles={['STUDENT']}><StudentPortal /></RoleRoute>} />
            <Route path="/director/library" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><LibraryPage /></RoleRoute>} />
            <Route path="/billing" element={<RoleRoute roles={['DIRECTOR']}><BillingPage /></RoleRoute>} />
            <Route path="/director/timetable" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR']}><TimetablePage /></RoleRoute>} />
            <Route path="/messages" element={<RoleRoute roles={['DIRECTOR', 'CENSEUR', 'INTENDANT', 'TEACHER', 'PARENT', 'STUDENT', 'SURVEILLANT']}><MessagesPage /></RoleRoute>} />
          </Route>
  
          {/* SaaS Platform Protected Routes (No Layout) */}
          <Route path="/platform/admin" element={<PlatformRoute roles={['SUPER_ADMIN']}><SuperAdminDashboard /></PlatformRoute>} />
          <Route path="/platform/influencer" element={<PlatformRoute roles={['INFLUENCER']}><InfluencerDashboard /></PlatformRoute>} />
  
  
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
