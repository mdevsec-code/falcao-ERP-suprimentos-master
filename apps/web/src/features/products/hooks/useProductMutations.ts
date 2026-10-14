import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { productsApi } from '../services/products.api';
import { productsKeys } from './useProducts';
import type { CatalogFromItemPayload, PriceEntryPayload, ProductPayload } from '../types';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductPayload) => productsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
      toast.success(i18n.t('products:toast.createSuccess'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('products:toast.createError')));
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ProductPayload>) => productsApi.update(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
      toast.success(i18n.t('products:toast.updateSuccess'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('products:toast.updateError')));
    },
  });
}

export function useSetProductActive(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) =>
      isActive ? productsApi.reactivate(id) : productsApi.deactivate(id),
    onSuccess: (_, isActive) => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
      toast.success(i18n.t(isActive ? 'products:toast.reactivated' : 'products:toast.deactivated'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useAddPriceEntry(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: PriceEntryPayload) => productsApi.addPriceEntry(id, entry),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      toast.success(i18n.t('products:toast.priceAdded'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('products:toast.priceError')));
    },
  });
}

/** Compras inclui no catálogo o item digitado à mão e já o liga ao produto novo. */
export function useCreateProductFromRequestItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CatalogFromItemPayload) => productsApi.createFromRequestItem(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success(i18n.t('products:toast.catalogFromItem'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('products:toast.createError')));
    },
  });
}
