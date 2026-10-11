import { type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Permission } from '@/constants/permissions';
import type { Role } from '@/constants/roles';

export interface CanProps {
  permission?: Permission;
  role?: Role | Role[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Gate declarativo de RBAC. Renderiza `children` se o usuário
 * possui a permissão ou o papel exigido; caso contrário, `fallback`
 * (default: `null`).
 */
export function Can({ permission, role, fallback = null, children }: CanProps) {
  const { can, hasRole } = useAuth();
  if (permission && !can(permission)) return <>{fallback}</>;
  if (role && !hasRole(role)) return <>{fallback}</>;
  return <>{children}</>;
}
