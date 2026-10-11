import type { AuditAction, Role } from "./enums";

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  companyName: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export interface AuditLogEntryDto {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  /** Snapshot do registro após a operação (o AuditLogInterceptor grava `{ after }`); nulo em DELETE. */
  changes: { after?: unknown } | null;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}
