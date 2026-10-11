import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { LoginResponseDto } from '@falcao-erp/shared-types';

import { env } from '@/config/env';
import { authStore } from '@/store/authStore';
import { ROUTE_PATHS } from '@/constants/routes';
import { ApiError, type ApiErrorBody } from './errors';

/**
 * Cliente HTTP central. Adiciona o access token automaticamente, renova a
 * sessão com o refresh token quando a API responde 401 e converte
 * `AxiosError` em `ApiError` padronizado.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 15_000,
});

httpClient.interceptors.request.use((config) => {
  const token = authStore.session?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Promessa de refresh compartilhada: várias requisições que recebem 401 ao
 * mesmo tempo esperam um único `POST /auth/refresh`, em vez de cada uma
 * disparar o seu (o que invalidaria os tokens umas das outras).
 */
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(refreshToken: string): Promise<string> {
  refreshPromise ??= axios
    .post<LoginResponseDto>(`${env.VITE_API_URL}/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      authStore.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function endSessionAndRedirect(): void {
  void authStore.signOut();
  if (typeof window !== 'undefined' && window.location.pathname !== ROUTE_PATHS.LOGIN) {
    window.location.assign(ROUTE_PATHS.LOGIN);
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError<ApiErrorBody>(error)) {
      return Promise.reject(new ApiError({ message: 'Erro desconhecido', code: 'UNKNOWN_ERROR' }));
    }

    const original = error.config as RetriableConfig | undefined;
    const refreshToken = authStore.session?.refreshToken;

    if (error.response?.status === 401 && original && !original._retry) {
      if (!refreshToken) {
        endSessionAndRedirect();
        return Promise.reject(ApiError.fromAxios(error));
      }
      original._retry = true;
      try {
        const accessToken = await refreshAccessToken(refreshToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return httpClient(original);
      } catch {
        endSessionAndRedirect();
        return Promise.reject(ApiError.fromAxios(error));
      }
    }

    return Promise.reject(ApiError.fromAxios(error));
  },
);
