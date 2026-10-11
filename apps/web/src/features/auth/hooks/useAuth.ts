import { useCallback } from 'react';
import { useAuthSession, useAuthStore, useCurrentUser } from '@/store/authStore';
import type { AuthState } from '@/store/authStore';
import type { Role } from '@/constants/roles';
import { hasPermission, type Permission } from '@/constants/permissions';

export interface UseAuthReturn {
  session: ReturnType<typeof useAuthSession>;
  user: ReturnType<typeof useCurrentUser>;
  isAuthenticated: boolean;
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  hasRole: (role: Role | Role[]) => boolean;
  can: (permission: Permission) => boolean;
}

export function useAuth(): UseAuthReturn {
  const session = useAuthSession();
  const user = useCurrentUser();
  const signInFn = useAuthStore((s: AuthState) => s.signIn);
  const signOutFn = useAuthStore((s: AuthState) => s.signOut);

  const isAuthenticated = session !== null;

  const signIn = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      const result = await signInFn(email, password, rememberMe);
      if (result.ok) return { ok: true as const };
      return { ok: false as const, error: result.error };
    },
    [signInFn],
  );

  const signOut = useCallback(async () => {
    await signOutFn();
  }, [signOutFn]);

  const hasRole = useCallback(
    (role: Role | Role[]) => {
      if (!user) return false;
      return Array.isArray(role) ? role.includes(user.role) : user.role === role;
    },
    [user],
  );

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    },
    [user],
  );

  return { session, user, isAuthenticated, signIn, signOut, hasRole, can };
}
