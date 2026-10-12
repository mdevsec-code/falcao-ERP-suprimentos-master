import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { agendaApi } from '../services/agenda.api';

export const agendaKeys = {
  all: ['agenda'] as const,
  range: (from: string, to: string, obra?: string) =>
    [...agendaKeys.all, 'range', from, to, obra ?? ''] as const,
  obras: () => [...agendaKeys.all, 'obras'] as const,
};

export function useAgenda(from: string, to: string, obra?: string) {
  return useQuery({
    queryKey: agendaKeys.range(from, to, obra),
    queryFn: () => agendaApi.list({ from, to, obra: obra || undefined }),
    placeholderData: keepPreviousData,
  });
}

/** Obras / centros de custo já usados na empresa — sugestões dos campos de centro de custo. */
export function useObras() {
  return useQuery({ queryKey: agendaKeys.obras(), queryFn: agendaApi.obras, staleTime: 60_000 });
}
