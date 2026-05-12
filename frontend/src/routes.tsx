import { Navigate, type RouteObject } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import MePage from '@/features/users/MePage';
import UserDetailPage from '@/features/users/UserDetailPage';
import { getAccess } from '@/lib/auth-storage';

function RootRedirect() {
  return <Navigate to={getAccess() ? '/me' : '/login'} replace />;
}

export const routes: RouteObject[] = [
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/me', element: <MePage /> },
          { path: '/users/:id', element: <UserDetailPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <p className="p-6">404 — không tìm thấy trang</p> },
];
