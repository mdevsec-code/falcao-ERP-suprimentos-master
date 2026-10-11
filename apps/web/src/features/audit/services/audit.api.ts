import type { AuditLogEntryDto, AuditLogStatsDto, PaginatedResult } from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { AuditListParams } from '../types';

export const auditApi = {
  async list(params: AuditListParams): Promise<PaginatedResult<AuditLogEntryDto>> {
    const { data } = await httpClient.get<PaginatedResult<AuditLogEntryDto>>('/audit-logs', {
      params,
    });
    return data;
  },

  async stats(): Promise<AuditLogStatsDto> {
    const { data } = await httpClient.get<AuditLogStatsDto>('/audit-logs/stats');
    return data;
  },
};
