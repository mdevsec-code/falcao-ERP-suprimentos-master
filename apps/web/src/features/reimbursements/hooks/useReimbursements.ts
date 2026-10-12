import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { financeKeys } from '@/features/finance/hooks/useFinance';
import { reimbursementsApi } from '../services/reimbursements.api';
import type { DecisionPayload, ReimbursementListParams, ReimbursementPayload } from '../types';

export const reimbursementsKeys = {
  all: ['reimbursements'] as const,
  list: (params: ReimbursementListParams) => [...reimbursementsKeys.all, 'list', params] as const,
  detail: (id: string) => [...reimbursementsKeys.all, 'detail', id] as const,
  stats: () => [...reimbursementsKeys.all, 'stats'] as const,
};

export function useReimbursements(params: ReimbursementListParams) {
  return useQuery({
    queryKey: reimbursementsKeys.list(params),
    queryFn: () => reimbursementsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useReimbursementStats() {
  return useQuery({ queryKey: reimbursementsKeys.stats(), queryFn: reimbursementsApi.stats });
}

export function useReimbursement(id: string | undefined) {
  return useQuery({
    queryKey: reimbursementsKeys.detail(id ?? ''),
    queryFn: () => reimbursementsApi.getById(id as string),
    enabled: !!id,
  });
}

/**
 * Cria o reembolso e envia os comprovantes escolhidos no formulário. Se
 * algum envio falhar, o reembolso continua criado — o usuário reenvia no
 * detalhe.
 */
export function useCreateReimbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, files }: { input: ReimbursementPayload; files: File[] }) => {
      const created = await reimbursementsApi.create(input);
      const failed: string[] = [];
      for (const file of files) {
        await reimbursementsApi
          .uploadAttachment(created.id, file)
          .catch(() => failed.push(file.name));
      }
      return { created, failed };
    },
    onSuccess: ({ failed }) => {
      void queryClient.invalidateQueries({ queryKey: reimbursementsKeys.all });
      toast.success(i18n.t('reimbursements:toast.created'));
      if (failed.length > 0) {
        toast.error(i18n.t('reimbursements:toast.someUploadsFailed', { files: failed.join(', ') }));
      }
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('reimbursements:toast.createError')));
    },
  });
}

export function useDecideReimbursement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DecisionPayload) => reimbursementsApi.decide(id, input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: reimbursementsKeys.all });
      // A aprovação gera uma conta a pagar.
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
      toast.success(
        i18n.t(
          input.decision === 'APPROVE'
            ? 'reimbursements:toast.approved'
            : 'reimbursements:toast.rejected',
        ),
      );
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useRemoveReimbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reimbursementsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reimbursementsKeys.all });
      toast.success(i18n.t('reimbursements:toast.removed'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useUploadReceipt(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => reimbursementsApi.uploadAttachment(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reimbursementsKeys.detail(id) });
      toast.success(i18n.t('reimbursements:toast.receiptUploaded'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useRemoveReceipt(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => reimbursementsApi.removeAttachment(id, attachmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reimbursementsKeys.detail(id) });
      toast.success(i18n.t('reimbursements:toast.receiptRemoved'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}
