import RequireAuth from '../../auth/RequireAuth';
import RequireRole from '../../auth/RequireRole';
import { ROLES } from './roles';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!allowedRoles.length) {
    return <RequireAuth>{children}</RequireAuth>;
  }

  return <RequireRole allowedRoles={allowedRoles}>{children}</RequireRole>;
}

export function AdminRoute({ children }) {
  return <RequireRole allowedRoles={[ROLES.ADMIN]}>{children}</RequireRole>;
}
