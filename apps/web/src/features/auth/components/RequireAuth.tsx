import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTE_PATHS } from '@/constants/routes';

export interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Protege rotas autenticadas. Redireciona para `/login` preservando
 * a URL original via `state.from`.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.LOGIN} state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
