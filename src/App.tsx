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

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
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
    case 'admin':
    case 'cashier':
    case 'chef':
    case 'super_admin':
      return <Navigate to="/dashboard" />;
    case 'student':
      return <Navigate to="/student" />;
    case 'professor':
      return <Navigate to="/professor" />;
    default:
      return <Navigate to="/login" />;
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
          <Route path="/app" element={<RoleBasedRedirect />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'cashier', 'chef', 'super_admin']}>
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
