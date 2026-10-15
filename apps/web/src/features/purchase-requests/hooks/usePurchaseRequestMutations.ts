import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApprovalStep, PurchaseRequestStatus } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { purchaseRequestsApi, type SignPayload } from '../services/purchaseRequests.api';
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

/** Assina (aprova ou recusa) a etapa atual; atualiza detalhe, fila e indicadores. */
export function useSignPurchaseRequest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SignPayload) => purchaseRequestsApi.sign(id, payload),
    onSuccess: (request, payload) => {
      queryClient.setQueryData(purchaseRequestsKeys.detail(id), request);
      void queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.all });
      if (payload.saveSignature) void queryClient.invalidateQueries({ queryKey: ['my-signature'] });
      toast.success(
        i18n.t(
          payload.decision === 'APROVADO'
            ? 'purchaseRequests:sign.approvedToast'
            : 'purchaseRequests:sign.rejectedToast',
        ),
      );
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('purchaseRequests:sign.error')));
    },
  });
}

export function useMySignature(enabled = true) {
  return useQuery({
    queryKey: ['my-signature'],
    queryFn: purchaseRequestsApi.mySignature,
    enabled,
  });
}

export function useClearMySignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseRequestsApi.clearMySignature,
    onSuccess: (data) => queryClient.setQueryData(['my-signature'], data),
  });
}

export const approvalStepsKey = ['approval-steps'] as const;

export function useApprovalSteps() {
  return useQuery({ queryKey: approvalStepsKey, queryFn: purchaseRequestsApi.approvalSteps });
}

export function useSetApprovalStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ step, userIds }: { step: ApprovalStep; userIds: string[] }) =>
      purchaseRequestsApi.setApprovalStep(step, userIds),
    onSuccess: (data) => {
      queryClient.setQueryData(approvalStepsKey, data);
      void queryClient.invalidateQueries({ queryKey: purchaseRequestsKeys.all });
      toast.success(i18n.t('purchaseRequests:approvers.saved'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}
