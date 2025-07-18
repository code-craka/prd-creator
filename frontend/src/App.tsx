import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PRDCreatePage } from './pages/prd/PRDCreatePage';
import { PRDViewPage } from './pages/prd/PRDViewPage';
import { PRDEditPage } from './pages/prd/PRDEditPage';
import { SharedPRDPage } from './pages/prd/SharedPRDPage';
import { TeamPage } from './pages/team/TeamPage';
import { PublicGalleryPage } from './pages/PublicGalleryPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/shared/:token" element={<SharedPRDPage />} />
        <Route path="/gallery" element={<PublicGalleryPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="prd">
            <Route path="create" element={<PRDCreatePage />} />
            <Route path=":id" element={<PRDViewPage />} />
            <Route path=":id/edit" element={<PRDEditPage />} />
          </Route>
          <Route path="team/:teamId" element={<TeamPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

function ProtectedRoute() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

export default App;