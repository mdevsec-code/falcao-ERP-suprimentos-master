import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/products.api';
import type { ProductListParams } from '../types';

export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productsKeys.lists(), params] as const,
  details: () => [...productsKeys.all, 'detail'] as const,
  detail: (id: string) => [...productsKeys.details(), id] as const,
  stats: () => [...productsKeys.all, 'stats'] as const,
};

export function useProducts(params: ProductListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

/** Produtos ativos do catálogo para o formulário de solicitação de compra. */
export function useActiveProductOptions() {
  return useProducts({ page: 1, pageSize: 100, isActive: true });
}

export function useProductStats() {
  return useQuery({
    queryKey: productsKeys.stats(),
    queryFn: productsApi.stats,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productsKeys.detail(id ?? ''),
    queryFn: () => productsApi.getById(id as string),
    enabled: !!id,
  });
}
