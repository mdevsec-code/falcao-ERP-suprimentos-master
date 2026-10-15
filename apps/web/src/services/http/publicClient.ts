import axios from 'axios';

import { env } from '@/config/env';
import { ApiError, type ApiErrorBody } from './errors';

/**
 * Cliente das páginas públicas do fornecedor (cotação, link aberto, catálogo).
 * O fornecedor não tem conta: o link é a credencial — sem token de sessão nem
 * o fluxo de refresh/redirecionamento para o login do `httpClient`.
 */
export const publicClient = axios.create({ baseURL: env.VITE_API_URL, timeout: 20_000 });

publicClient.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(
    axios.isAxiosError<ApiErrorBody>(error)
      ? ApiError.fromAxios(error)
      : new ApiError({ message: 'Erro desconhecido' }),
  ),
);
