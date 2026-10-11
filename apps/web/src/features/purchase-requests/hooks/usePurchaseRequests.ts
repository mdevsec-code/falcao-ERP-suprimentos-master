import { useMemo } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import type { PurchaseRequestStatus, PurchaseRequestSummaryDto } from '@falcao-erp/shared-types';

import { purchaseRequestsApi } from '../services/purchaseRequests.api';
import { MAX_PAGE_SIZE, type PurchaseRequestListParams } from '../types';

export const purchaseRequestsKeys = {
  all: ['purchase-requests'] as const,
  lists: () => [...purchaseRequestsKeys.all, 'list'] as const,
  list: (params: PurchaseRequestListParams) => [...purchaseRequestsKeys.lists(), params] as const,
  details: () => [...purchaseRequestsKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseRequestsKeys.details(), id] as const,
  timeline: (id: string) => [...purchaseRequestsKeys.details(), id, 'timeline'] as const,
  stats: () => [...purchaseRequestsKeys.all, 'stats'] as const,
};

export function usePurchaseRequests(params: PurchaseRequestListParams) {
  return useQuery({
    queryKey: purchaseRequestsKeys.list(params),
    queryFn: () => purchaseRequestsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Fila de aprovação: uma consulta por status (a API filtra um status por
 * vez e limita `pageSize` a 100), unidas e ordenadas da mais antiga para a
 * mais nova — quem espera há mais tempo aparece primeiro.
 */
export function usePurchaseRequestQueue(
  statuses: readonly PurchaseRequestStatus[],
  search?: string,
) {
  const results = useQueries({
    queries: statuses.map((status) => {
      const params: PurchaseRequestListParams = {
        page: 1,
        pageSize: MAX_PAGE_SIZE,
        status,
        search: search || undefined,
      };
      return {
        queryKey: purchaseRequestsKeys.list(params),
        queryFn: () => purchaseRequestsApi.list(params),
      };
    }),
  });

  const isLoading = results.some((r) => r.isLoading);
  const isFetching = results.some((r) => r.isFetching);
  const isError = results.some((r) => r.isError);
  const dataVersion = results.map((r) => r.dataUpdatedAt).join('|');

  const rows = useMemo<PurchaseRequestSummaryDto[]>(() => {
    const merged = new Map<string, PurchaseRequestSummaryDto>();
    for (const r of results) for (const row of r.data?.data ?? []) merged.set(row.id, row);
    return [...merged.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    // `results` muda de identidade a cada render; `dataVersion` captura as mudanças reais.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  return {
    rows,
    isLoading,
    isFetching,
    isError,
    refetch: () => Promise.all(results.map((r) => r.refetch())),
  };
}

export function usePurchaseRequestStats() {
  return useQuery({
    queryKey: purchaseRequestsKeys.stats(),
    queryFn: purchaseRequestsApi.stats,
  });
}

export function usePurchaseRequest(id: string | undefined) {
  return useQuery({
    queryKey: purchaseRequestsKeys.detail(id ?? ''),
    queryFn: () => purchaseRequestsApi.getById(id as string),
    enabled: !!id,
  });
}

export function usePurchaseRequestTimeline(id: string | undefined) {
  return useQuery({
    queryKey: purchaseRequestsKeys.timeline(id ?? ''),
    queryFn: () => purchaseRequestsApi.getTimeline(id as string),
    enabled: !!id,
  });
}
