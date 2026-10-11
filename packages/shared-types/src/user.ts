import type { AuditAction, Role } from "./enums";

/** Tamanho mínimo de senha para usuários criados/alterados (API + Web). */
export const MIN_PASSWORD_LENGTH = 8;
/** Limite do bcrypt — acima disso os bytes extras são ignorados. */
export const MAX_PASSWORD_LENGTH = 72;

export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatsDto {
  total: number;
  active: number;
  byRole: Array<{ role: Role; count: number }>;
}

export interface AuditLogStatsDto {
  total: number;
  today: number;
  byAction: Array<{ action: AuditAction; count: number }>;
  entityTypes: string[];
}

export interface HealthDto {
  status: "ok" | "degraded";
  database: "up" | "down";
  uptimeSeconds: number;
  timestamp: string;
}
