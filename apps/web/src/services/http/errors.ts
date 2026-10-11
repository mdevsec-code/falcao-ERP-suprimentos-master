import type { AxiosError } from 'axios';

/**
 * Corpo de erro padronizado da API (ver `HttpExceptionFilter` em
 * `apps/api/src/common/filters`). `message` vem como array quando é um erro
 * de validação do `class-validator` (uma mensagem por campo inválido).
 */
export interface ApiErrorBody {
  error?: { statusCode?: number; message?: string | string[]; timestamp?: string };
}

/**
 * Erro normalizado da camada HTTP. Sempre use este tipo ao consumir services,
 * nunca `AxiosError` cru — facilita mocking e troca de cliente HTTP.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly code: string;
  readonly status: number;
  /** Todas as mensagens da API (validação pode trazer mais de uma). */
  readonly messages: string[];

  constructor({
    message,
    code = 'UNKNOWN_ERROR',
    status = 0,
    messages,
  }: {
    message: string;
    code?: string;
    status?: number;
    messages?: string[];
  }) {
    super(message);
    this.code = code;
    this.status = status;
    this.messages = messages ?? [message];
  }

  static fromAxios(error: AxiosError<ApiErrorBody>): ApiError {
    const status = error.response?.status ?? 0;
    const raw = error.response?.data?.error?.message;
    const messages = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return new ApiError({
      message: messages[0] ?? error.message ?? 'Erro de rede',
      code: mapStatusToCode(status),
      status,
      messages: messages.length > 0 ? messages : undefined,
    });
  }
}

function mapStatusToCode(status: number): string {
  if (status === 0) return 'NETWORK_ERROR';
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return 'HTTP_ERROR';
}

/**
 * Extrai uma mensagem legível de qualquer erro vindo de um service.
 * Usado pelos `onError` das mutations para alimentar os toasts.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status !== 0) return error.message || fallback;
  return fallback;
}
