import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SupplierCatalogDetailDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import {
  catalogsApi,
  type CatalogDecision,
  type CatalogListParams,
  type CreateProductFromItemPayload,
} from '../services/catalogs.api';

export const catalogsKeys = {
  all: ['supplier-catalogs'] as const,
  lists: () => [...catalogsKeys.all, 'list'] as const,
  list: (params: CatalogListParams) => [...catalogsKeys.lists(), params] as const,
  detail: (id: string) => [...catalogsKeys.all, 'detail', id] as const,
  stats: () => [...catalogsKeys.all, 'stats'] as const,
  link: () => [...catalogsKeys.all, 'link'] as const,
};

export function useCatalogs(params: CatalogListParams) {
  return useQuery({
    queryKey: catalogsKeys.list(params),
    queryFn: () => catalogsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCatalogStats(enabled = true) {
  return useQuery({ queryKey: catalogsKeys.stats(), queryFn: catalogsApi.stats, enabled });
}

export function useCatalog(id: string | undefined) {
  return useQuery({
    queryKey: catalogsKeys.detail(id ?? ''),
    queryFn: () => catalogsApi.getById(id as string),
    enabled: !!id,
  });
}

export function useCatalogLink() {
  return useQuery({ queryKey: catalogsKeys.link(), queryFn: catalogsApi.getLink });
}

export function useCatalogLinkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: 'regenerate' | 'disable') =>
      action === 'regenerate' ? catalogsApi.regenerateLink() : catalogsApi.disableLink(),
    onSuccess: (data, action) => {
      queryClient.setQueryData(catalogsKeys.link(), data);
      toast.success(
        i18n.t(action === 'regenerate' ? 'catalogs:toast.linkOn' : 'catalogs:toast.linkOff'),
      );
    },
    onError: (error: Error) => toast.error(getErrorMessage(error, i18n.t('common:errors.generic'))),
  });
}

/** Revisão muda o catálogo vivo: atualiza o catálogo recebido e os produtos. */
function useCatalogMutation<TVars>(
  id: string,
  mutationFn: (vars: TVars) => Promise<SupplierCatalogDetailDto>,
  successKey: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (catalog) => {
      queryClient.setQueryData(catalogsKeys.detail(id), catalog);
      void queryClient.invalidateQueries({ queryKey: catalogsKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: catalogsKeys.stats() });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(i18n.t(successKey));
    },
    onError: (error: Error) => toast.error(getErrorMessage(error, i18n.t('common:errors.generic'))),
  });
}

export function useReviewCatalog(id: string) {
  return useCatalogMutation(
    id,
    (decisoes: CatalogDecision[]) => catalogsApi.review(id, decisoes),
    'catalogs:toast.reviewed',
  );
}

export function useCreateProductFromItem(id: string) {
  return useCatalogMutation(
    id,
    ({ itemId, payload }: { itemId: string; payload: CreateProductFromItemPayload }) =>
      catalogsApi.createProduct(id, itemId, payload),
    'catalogs:toast.productCreated',
  );
}

export function useRejectCatalog(id: string) {
  return useCatalogMutation(
    id,
    (motivo?: string) => catalogsApi.reject(id, motivo),
    'catalogs:toast.rejected',
  );
}
