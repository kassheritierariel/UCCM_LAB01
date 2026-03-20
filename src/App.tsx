import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Dashboard from './Dashboard';
import Login from './Login';
import StudentPortal from './StudentPortal';
import ProfessorPortal from './ProfessorPortal';
import LandingPage from './LandingPage';
import WhatsAppButton from './components/WhatsAppButton';
import OfflineIndicator from './components/OfflineIndicator';
import RegisterInstitution from './RegisterInstitution';

const ProtectedRoute = ({ children, allowedRoles, isStaffOnly }: { children: React.ReactNode, allowedRoles?: string[], isStaffOnly?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isStaffOnly && ['student', 'professor'].includes(user.role)) {
    return <Navigate to="/app" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app" />;
  }

  return <>{children}</>;
};

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'student':
      return <Navigate to="/student" />;
    case 'professor':
      return <Navigate to="/professor" />;
    default:
      // admin, cashier, chef, super_admin, and any custom roles
      return <Navigate to="/dashboard" />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <OfflineIndicator />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-institution" element={<RegisterInstitution />} />
          <Route path="/app" element={<RoleBasedRedirect />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute isStaffOnly>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentPortal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/professor" 
            element={
              <ProtectedRoute allowedRoles={['professor']}>
                <ProfessorPortal />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <WhatsAppButton />
      </Router>
    </AuthProvider>
  );
}
