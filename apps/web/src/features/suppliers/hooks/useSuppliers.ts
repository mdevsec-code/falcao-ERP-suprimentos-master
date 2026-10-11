import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { suppliersApi } from '../services/suppliers.api';
import type { SupplierListParams } from '../types';

export const suppliersKeys = {
  all: ['suppliers'] as const,
  lists: () => [...suppliersKeys.all, 'list'] as const,
  list: (params: SupplierListParams) => [...suppliersKeys.lists(), params] as const,
  details: () => [...suppliersKeys.all, 'detail'] as const,
  detail: (id: string) => [...suppliersKeys.details(), id] as const,
  stats: () => [...suppliersKeys.all, 'stats'] as const,
};

export function useSuppliers(params: SupplierListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: suppliersKeys.list(params),
    queryFn: () => suppliersApi.list(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

/** Fornecedores ativos para os seletores dos formulários (produtos, preços). */
export function useActiveSupplierOptions() {
  return useSuppliers({ page: 1, pageSize: 100, isActive: true });
}

export function useSupplierStats() {
  return useQuery({
    queryKey: suppliersKeys.stats(),
    queryFn: suppliersApi.stats,
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: suppliersKeys.detail(id ?? ''),
    queryFn: () => suppliersApi.getById(id as string),
    enabled: !!id,
  });
}
