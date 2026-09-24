import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingState from '../components/system/LoadingState';

export default function RequireRole({ children, allowedRoles = [], allowedPositions = [] }) {
  const { isAuthenticated, hasAnyRole, hasPosition, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState title="Memulihkan sesi..." className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAssignedPosition = allowedPositions.length > 0 && hasPosition(allowedPositions);
  const hasExplicitPositions = Array.isArray(user?.positions) && user.positions.length > 0;
  const hasAccess = allowedPositions.length > 0 && hasExplicitPositions
    ? hasAssignedPosition
    : hasAnyRole(allowedRoles);
  if (allowedRoles.length > 0 && !hasAccess) {
    const fallback = location.pathname === '/dashboard' ? '/' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
