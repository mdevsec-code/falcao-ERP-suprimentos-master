import { type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ForbiddenPage } from '@/components/error/ForbiddenPage';
import type { Permission } from '@/constants/permissions';

export interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
}

/**
 * Protege uma rota com base em RBAC. Deve ficar dentro de `RequireAuth`
 * (assume que o usuário já está autenticado). Sem isso, um usuário
 * autenticado sem a permissão poderia acessar a página digitando a URL
 * diretamente, mesmo com o link escondido na Sidebar.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { can } = useAuth();
  if (!can(permission)) {
    return <ForbiddenPage />;
  }
  return <>{children}</>;
}
