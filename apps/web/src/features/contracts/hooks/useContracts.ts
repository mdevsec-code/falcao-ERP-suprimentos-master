import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { contractsApi } from '../services/contracts.api';
import type { ContractListParams } from '../types';

export const contractsKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractsKeys.all, 'list'] as const,
  list: (params: ContractListParams) => [...contractsKeys.lists(), params] as const,
  detail: (id: string) => [...contractsKeys.all, 'detail', id] as const,
  stats: () => [...contractsKeys.all, 'stats'] as const,
};

export function useContracts(params: ContractListParams) {
  return useQuery({
    queryKey: contractsKeys.list(params),
    queryFn: () => contractsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Contratos vigentes para seletores (contas a pagar, documentos). */
export function useActiveContractOptions(enabled = true) {
  return useQuery({
    queryKey: contractsKeys.list({ page: 1, pageSize: 100, status: 'VIGENTE' }),
    queryFn: () => contractsApi.list({ page: 1, pageSize: 100, status: 'VIGENTE' }),
    enabled,
  });
}

export function useContractStats() {
  return useQuery({ queryKey: contractsKeys.stats(), queryFn: contractsApi.stats });
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: contractsKeys.detail(id ?? ''),
    queryFn: () => contractsApi.getById(id as string),
    enabled: !!id,
  });
}
