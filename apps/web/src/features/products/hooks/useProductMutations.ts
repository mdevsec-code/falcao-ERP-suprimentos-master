import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { productsApi } from '../services/products.api';
import { productsKeys } from './useProducts';
import type { ProductPayload } from '../types';

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
    mutationFn: ({ price, supplierId }: { price: number; supplierId?: string }) =>
      productsApi.addPriceEntry(id, price, supplierId),
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
