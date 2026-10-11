import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { suppliersApi } from '../services/suppliers.api';
import { suppliersKeys } from './useSuppliers';
import type { SupplierPayload } from '../types';

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierPayload) => suppliersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
      toast.success(i18n.t('suppliers:toast.createSuccess'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('suppliers:toast.createError')));
    },
  });
}

export function useUpdateSupplier(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<SupplierPayload>) => suppliersApi.update(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
      toast.success(i18n.t('suppliers:toast.updateSuccess'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('suppliers:toast.updateError')));
    },
  });
}

export function useSetSupplierActive(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) =>
      isActive ? suppliersApi.reactivate(id) : suppliersApi.deactivate(id),
    onSuccess: (_, isActive) => {
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
      toast.success(
        i18n.t(isActive ? 'suppliers:toast.reactivated' : 'suppliers:toast.deactivated'),
      );
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useAddEvaluation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ score, comment }: { score: number; comment?: string }) =>
      suppliersApi.addEvaluation(id, score, comment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
      toast.success(i18n.t('suppliers:toast.evaluationSuccess'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useUploadSupplierDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, category }: { file: File; category: string }) =>
      suppliersApi.uploadDocument(id, file, category),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(id) });
      toast.success(i18n.t('suppliers:toast.documentUploaded'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('suppliers:toast.documentUploadError')));
    },
  });
}

export function useRemoveSupplierDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => suppliersApi.removeDocument(id, documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: suppliersKeys.detail(id) });
      toast.success(i18n.t('suppliers:toast.documentRemoved'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}
