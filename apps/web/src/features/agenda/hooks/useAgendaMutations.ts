import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import i18n from '@/i18n';
import { getErrorMessage } from '@/services/http/errors';
import { agendaApi } from '../services/agenda.api';
import { agendaKeys } from './useAgenda';
import type { AgendaEventPayload } from '../types';

function useAgendaMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  successKey: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agendaKeys.all });
      toast.success(i18n.t(successKey));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, i18n.t('common:errors.generic')));
    },
  });
}

export function useCreateEvent() {
  return useAgendaMutation(
    (input: AgendaEventPayload) => agendaApi.createEvent(input),
    'agenda:toast.created',
  );
}

export function useUpdateEvent() {
  return useAgendaMutation(
    ({ id, input }: { id: string; input: AgendaEventPayload }) => agendaApi.updateEvent(id, input),
    'agenda:toast.updated',
  );
}

export function useDeleteEvent() {
  return useAgendaMutation((id: string) => agendaApi.deleteEvent(id), 'agenda:toast.deleted');
}
