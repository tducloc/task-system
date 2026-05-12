import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAccess } from '@/lib/auth-storage';

export default function ProtectedRoute() {
  const location = useLocation();
  const hasToken = Boolean(getAccess());
  if (!hasToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
