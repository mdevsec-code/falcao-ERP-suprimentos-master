import * as React from "react";
import { createContext, useCallback, useMemo, useState } from "react";
import type { AuthUserDto } from "@falcao-erp/shared-types";
import { tokenStorage } from "@/api/client";
import { authApi } from "@/features/auth/api/auth-api";

const AUTH_USER_KEY = "falcao_erp_user";

interface AuthContextValue {
  user: AuthUserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: AuthUserDto["role"][]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUserDto | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUserDto;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      tokenStorage.setTokens(response.accessToken, response.refreshToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => undefined);
    tokenStorage.clear();
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: AuthUserDto["role"][]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout, hasRole }),
    [user, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
