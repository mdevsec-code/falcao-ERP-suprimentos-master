import axios from 'axios';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LoginResponseDto } from '@falcao-erp/shared-types';

import { env } from '@/config/env';
import i18n from '@/i18n';
import { ApiError, type ApiErrorBody } from '@/services/http/errors';
import type { AuthSession } from '@/types/auth';

export type SignInResult = { ok: true; session: AuthSession } | { ok: false; error: string };

export interface AuthState {
  session: AuthSession | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<SignInResult>;
  /** Troca os tokens da sessão atual (usado pelo refresh automático do `httpClient`). */
  setTokens: (accessToken: string, refreshToken: string) => void;
  signOut: () => Promise<void>;
}

/**
 * "Manter conectado" real: quando marcado, a sessão vai para `localStorage`
 * (sobrevive ao fechar o navegador); quando desmarcado, vai para
 * `sessionStorage` (some ao fechar a aba/navegador). A escolha de storage
 * é decidida em tempo real por este flag, também persistido em
 * `localStorage` (ele próprio precisa sobreviver ao reload para sabermos
 * onde procurar a sessão no próximo boot).
 */
const REMEMBER_FLAG_KEY = 'falcao-erp-auth-remember';

function shouldRemember(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(REMEMBER_FLAG_KEY) !== 'false';
}

function setRememberFlag(remember: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMEMBER_FLAG_KEY, remember ? 'true' : 'false');
}

const dynamicAuthStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return (shouldRemember() ? localStorage : sessionStorage).getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    (shouldRemember() ? localStorage : sessionStorage).setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

/**
 * Cliente sem interceptors para as rotas de autenticação — evita que um 401
 * do próprio login dispare o fluxo de refresh/redirecionamento do `httpClient`.
 */
const authHttp = axios.create({ baseURL: env.VITE_API_URL, timeout: 15_000 });

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,

      signIn: async (email, password, rememberMe = true) => {
        setRememberFlag(rememberMe);
        try {
          const { data } = await authHttp.post<LoginResponseDto>('/auth/login', {
            email: email.trim().toLowerCase(),
            password,
          });
          const session: AuthSession = {
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
          set({ session });
          return { ok: true, session };
        } catch (error) {
          if (axios.isAxiosError<ApiErrorBody>(error)) {
            const apiError = ApiError.fromAxios(error);
            if (apiError.status === 0) {
              return { ok: false, error: i18n.t('auth:login.errors.network') };
            }
            if (apiError.status === 401) {
              return { ok: false, error: i18n.t('auth:login.errors.invalidCredentials') };
            }
            return { ok: false, error: apiError.message };
          }
          return { ok: false, error: i18n.t('auth:login.errors.unknown') };
        }
      },

      setTokens: (accessToken, refreshToken) => {
        const current = get().session;
        if (!current) return;
        set({ session: { ...current, accessToken, refreshToken } });
      },

      signOut: async () => {
        const token = get().session?.accessToken;
        set({ session: null });
        if (!token) return;
        try {
          // Revoga os refresh tokens no servidor. Falha de rede é ignorada —
          // a sessão local já foi encerrada acima.
          await authHttp.post('/auth/logout', null, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // ignora
        }
      },
    }),
    {
      name: 'falcao-erp-auth',
      storage: createJSONStorage(() => dynamicAuthStorage),
      partialize: (state) => ({ session: state.session }),
    },
  ),
);

/**
 * Acesso não-reativo para uso em `services/http/client.ts` (interceptors).
 * Não gera re-renderização — use o hook em componentes.
 */
export const authStore = {
  get session() {
    return useAuthStore.getState().session;
  },
  setTokens: (accessToken: string, refreshToken: string) =>
    useAuthStore.getState().setTokens(accessToken, refreshToken),
  signOut: () => useAuthStore.getState().signOut(),
};

/** Seletores ergonômicos — use em componentes em vez do hook direto. */
export const useAuthSession = () => useAuthStore((s) => s.session);
export const useCurrentUser = () => useAuthStore((s) => s.session?.user ?? null);
