import axios from "axios";
import type { LoginResponseDto } from "@falcao-erp/shared-types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api/v1";
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

const ACCESS_TOKEN_KEY = "falcao_erp_access_token";
const REFRESH_TOKEN_KEY = "falcao_erp_refresh_token";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.includes("/auth/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        refreshPromise ??= axios
          .post<LoginResponseDto>(`${API_URL}/auth/refresh`, { refreshToken })
          .then((res) => {
            tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
            return res.data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });

        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch {
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export interface ApiErrorBody {
  error: { statusCode: number; message: string | string[]; timestamp: string };
}

export function getApiErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    const message = body?.error?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === "string") return message;
  }
  return fallback;
}
