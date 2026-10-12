import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ContractStatus } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { contractsApi } from '../services/contracts.api';
import { contractsKeys } from './useContracts';
import type { AmendmentPayload, ContractPayload } from '../types';

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractPayload) => contractsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractsKeys.all });
      toast.success(i18n.t('contracts:toast.createSuccess'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('contracts:toast.saveError')));
    },
  });
}

export function useUpdateContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractPayload) => contractsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractsKeys.all });
      toast.success(i18n.t('contracts:toast.updateSuccess'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('contracts:toast.saveError')));
    },
  });
}

export function useChangeContractStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: ContractStatus) => contractsApi.changeStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractsKeys.all });
      toast.success(i18n.t('contracts:toast.statusChanged'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useAddAmendment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AmendmentPayload) => contractsApi.addAmendment(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractsKeys.all });
      toast.success(i18n.t('contracts:toast.amendmentAdded'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}
