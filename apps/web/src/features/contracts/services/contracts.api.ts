import type {
  ContractDetailDto,
  ContractStatsDto,
  ContractStatus,
  ContractSummaryDto,
  PaginatedResult,
} from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { AmendmentPayload, ContractListParams, ContractPayload } from '../types';

export const contractsApi = {
  async list(params: ContractListParams): Promise<PaginatedResult<ContractSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<ContractSummaryDto>>('/contracts', {
      params,
    });
    return data;
  },

  async stats(): Promise<ContractStatsDto> {
    const { data } = await httpClient.get<ContractStatsDto>('/contracts/stats');
    return data;
  },

  async getById(id: string): Promise<ContractDetailDto> {
    const { data } = await httpClient.get<ContractDetailDto>(`/contracts/${id}`);
    return data;
  },

  async create(input: ContractPayload): Promise<ContractDetailDto> {
    const { data } = await httpClient.post<ContractDetailDto>('/contracts', input);
    return data;
  },

  async update(id: string, input: Partial<ContractPayload>): Promise<ContractDetailDto> {
    const { data } = await httpClient.patch<ContractDetailDto>(`/contracts/${id}`, input);
    return data;
  },

  async changeStatus(id: string, status: ContractStatus): Promise<ContractDetailDto> {
    const { data } = await httpClient.patch<ContractDetailDto>(`/contracts/${id}/status`, {
      status,
    });
    return data;
  },

  async addAmendment(id: string, input: AmendmentPayload): Promise<ContractDetailDto> {
    const { data } = await httpClient.post<ContractDetailDto>(`/contracts/${id}/amendments`, input);
    return data;
  },
};
