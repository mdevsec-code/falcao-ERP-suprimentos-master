import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { RequisitionPlanDetailDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { plansApi, type PlanListParams, type PlanPayload } from '../services/plans.api';

export const plansKeys = {
  all: ['requisition-plans'] as const,
  lists: () => [...plansKeys.all, 'list'] as const,
  list: (params: PlanListParams) => [...plansKeys.lists(), params] as const,
  detail: (id: string) => [...plansKeys.all, 'detail', id] as const,
  stats: () => [...plansKeys.all, 'stats'] as const,
  candidates: (planId?: string) => [...plansKeys.all, 'candidates', planId ?? 'new'] as const,
};

export function usePlans(params: PlanListParams) {
  return useQuery({
    queryKey: plansKeys.list(params),
    queryFn: () => plansApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePlanStats() {
  return useQuery({ queryKey: plansKeys.stats(), queryFn: plansApi.stats });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: plansKeys.detail(id ?? ''),
    queryFn: () => plansApi.getById(id as string),
    enabled: !!id,
  });
}

export function usePlanCandidates(planId?: string) {
  return useQuery({
    queryKey: plansKeys.candidates(planId),
    queryFn: () => plansApi.candidates(planId),
  });
}

/** Grava o plano no cache e atualiza listas, indicadores e as telas afetadas. */
function usePlanMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<RequisitionPlanDetailDto>,
  successKey: string,
  errorKey = 'common:errors.generic',
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (plan) => {
      queryClient.setQueryData(plansKeys.detail(plan.id), plan);
      void queryClient.invalidateQueries({ queryKey: plansKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: plansKeys.stats() });
      void queryClient.invalidateQueries({ queryKey: [...plansKeys.all, 'candidates'] });
      // Lançar abre a cotação e muda o status das solicitações.
      void queryClient.invalidateQueries({ queryKey: ['quotations'] });
      void queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success(i18n.t(successKey, { numero: plan.numero }));
    },
    onError: (error: Error) => toast.error(getErrorMessage(error, i18n.t(errorKey))),
  });
}

export function useCreatePlan() {
  return usePlanMutation((payload: PlanPayload) => plansApi.create(payload), 'plans:toast.created');
}

export function useUpdatePlan(id: string) {
  return usePlanMutation(
    (payload: Partial<PlanPayload>) => plansApi.update(id, payload),
    'plans:toast.updated',
  );
}

export function useLaunchPlan(id: string) {
  return usePlanMutation(
    (supplierIds: string[]) => plansApi.launch(id, supplierIds),
    'plans:toast.launched',
  );
}

export function useCancelPlan(id: string) {
  return usePlanMutation(() => plansApi.cancel(id), 'plans:toast.cancelled');
}
