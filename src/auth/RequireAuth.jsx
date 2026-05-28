import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingState from '../components/system/LoadingState';

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState title="Memulihkan sesi..." className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
