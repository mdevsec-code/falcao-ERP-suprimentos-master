import type { Role } from "./enums";

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
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { before: unknown; after: unknown }> | null;
  userId: string;
  userName: string;
  createdAt: string;
}
