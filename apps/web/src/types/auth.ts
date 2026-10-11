import type { AuthUserDto } from '@falcao-erp/shared-types';

/** Usuário autenticado — mesmo contrato devolvido por `POST /auth/login`. */
export type User = AuthUserDto;

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}
