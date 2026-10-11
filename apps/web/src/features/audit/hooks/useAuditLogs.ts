import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditApi } from '../services/audit.api';
import type { AuditListParams } from '../types';

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (params: AuditListParams) => [...auditKeys.all, 'list', params] as const,
  stats: () => [...auditKeys.all, 'stats'] as const,
};

export function useAuditLogs(params: AuditListParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: auditKeys.stats(),
    queryFn: auditApi.stats,
  });
}
