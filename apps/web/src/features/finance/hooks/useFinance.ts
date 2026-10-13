import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { contractsKeys } from '@/features/contracts/hooks/useContracts';
import { agendaKeys } from '@/features/agenda/hooks/useAgenda';
import { financeApi } from '../services/finance.api';
import type { InvoiceFormInput, PayableListParams, PayablePayload, PayPayload } from '../types';

export const financeKeys = {
  all: ['payables'] as const,
  list: (params: PayableListParams) => [...financeKeys.all, 'list', params] as const,
  stats: () => [...financeKeys.all, 'stats'] as const,
  cashFlow: (costCenter?: string) => [...financeKeys.all, 'cash-flow', costCenter ?? ''] as const,
  byCostCenter: () => [...financeKeys.all, 'by-cost-center'] as const,
  costCenters: () => [...financeKeys.all, 'cost-centers'] as const,
};

export function usePayables(params: PayableListParams) {
  return useQuery({
    queryKey: financeKeys.list(params),
    queryFn: () => financeApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePayableStats(enabled = true) {
  return useQuery({ queryKey: financeKeys.stats(), queryFn: financeApi.stats, enabled });
}

export function useCashFlow(costCenter?: string) {
  return useQuery({
    queryKey: financeKeys.cashFlow(costCenter),
    queryFn: () => financeApi.cashFlow(costCenter),
    placeholderData: keepPreviousData,
  });
}

export function useByCostCenter() {
  return useQuery({ queryKey: financeKeys.byCostCenter(), queryFn: financeApi.byCostCenter });
}

export function usePayableCostCenters() {
  return useQuery({ queryKey: financeKeys.costCenters(), queryFn: financeApi.costCenters });
}

/** Contas afetam KPIs, gráficos, a execução do contrato, reembolsos e a agenda. */
function useInvalidateFinance() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: financeKeys.all });
    void queryClient.invalidateQueries({ queryKey: contractsKeys.all });
    void queryClient.invalidateQueries({ queryKey: agendaKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
  };
}

function useFinanceMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  successKey: string,
) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t(successKey));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useCreatePayable() {
  return useFinanceMutation(
    (input: PayablePayload) => financeApi.create(input),
    'finance:toast.created',
  );
}

export function useUpdatePayable() {
  return useFinanceMutation(
    ({ id, input }: { id: string; input: PayablePayload }) => financeApi.update(id, input),
    'finance:toast.updated',
  );
}

export function usePayPayable() {
  return useFinanceMutation(
    ({ id, input }: { id: string; input: PayPayload }) => financeApi.pay(id, input),
    'finance:toast.paid',
  );
}

export function useRegisterInvoice() {
  return useFinanceMutation(
    ({ id, input }: { id: string; input: InvoiceFormInput }) => financeApi.invoice(id, input),
    'finance:toast.invoiced',
  );
}

export function useCancelPayable() {
  return useFinanceMutation((id: string) => financeApi.cancel(id), 'finance:toast.cancelled');
}
