import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { disciplinesApi, type DisciplinePayload } from '../services/disciplines.api';

export const disciplinesKeys = {
  all: ['disciplines'] as const,
  list: (includeInactive: boolean) => [...disciplinesKeys.all, { includeInactive }] as const,
};

/** Disciplinas ativas (filtros e formulários) ou todas (tela de gestão). */
export function useDisciplines(includeInactive = false) {
  return useQuery({
    queryKey: disciplinesKeys.list(includeInactive),
    queryFn: () => disciplinesApi.list(includeInactive),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDiscipline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nome: string) => disciplinesApi.create(nome),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disciplinesKeys.all });
      toast.success(i18n.t('products:disciplines.toast.created'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useUpdateDiscipline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: DisciplinePayload }) =>
      disciplinesApi.update(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disciplinesKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(i18n.t('products:disciplines.toast.updated'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}
