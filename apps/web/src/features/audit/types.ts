import type { AuditAction } from '@falcao-erp/shared-types';
import i18n from '@/i18n';

export type { AuditLogEntryDto, AuditLogStatsDto } from '@falcao-erp/shared-types';

export interface AuditListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: AuditAction;
  entityType?: string;
  from?: string;
  to?: string;
}

export interface AuditFilters {
  busca?: string;
  action?: AuditAction;
  entityType?: string;
  from?: string;
  to?: string;
}

/**
 * Rótulo do tipo de entidade (`enums:auditEntity.<tipo>`). Tipos novos que a
 * API venha a registrar caem no próprio nome técnico em vez de mostrar a
 * chave de tradução crua.
 */
export function entityLabel(entityType: string): string {
  return i18n.t(`enums:auditEntity.${entityType}`, { defaultValue: entityType });
}
