import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PurchaseRequestStatus } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { purchaseRequestsApi } from '../services/purchaseRequests.api';
import { purchaseRequestsKeys } from './usePurchaseRequests';
import type { PurchaseRequestPayload } from '../types';

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseRequestPayload) => purchaseRequestsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.all });
      toast.success(i18n.t('purchaseRequests:toast.createSuccess'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('purchaseRequests:toast.createError')));
    },
  });
}

export function useChangePurchaseRequestStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, comment }: { status: PurchaseRequestStatus; comment?: string }) =>
      purchaseRequestsApi.changeStatus(id, status, comment),
    onSuccess: () => {
      // Status afeta detalhe, timeline, listas, fila de aprovação e KPIs.
      void queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.all });
      toast.success(i18n.t('purchaseRequests:toast.statusChanged'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('purchaseRequests:toast.statusError')));
    },
  });
}

export function useAddPurchaseRequestComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => purchaseRequestsApi.addComment(id, message),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.timeline(id) });
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('purchaseRequests:toast.commentError')));
    },
  });
}

export function useUploadPurchaseRequestAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => purchaseRequestsApi.uploadAttachment(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.detail(id) });
      toast.success(i18n.t('purchaseRequests:toast.attachmentUploaded'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('purchaseRequests:toast.attachmentError')));
    },
  });
}

export function useRemovePurchaseRequestAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => purchaseRequestsApi.removeAttachment(id, attachmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.detail(id) });
      toast.success(i18n.t('purchaseRequests:toast.attachmentRemoved'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}
