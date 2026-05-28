import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingState from '../components/system/LoadingState';

export default function RequireRole({ children, allowedRoles = [] }) {
  const { isAuthenticated, hasAnyRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState title="Memulihkan sesi..." className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    const fallback = location.pathname === '/dashboard' ? '/' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
