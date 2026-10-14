import type { DisciplineDto } from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';

export interface DisciplinePayload {
  nome?: string;
  ordem?: number;
  isActive?: boolean;
}

export const disciplinesApi = {
  async list(includeInactive = false): Promise<DisciplineDto[]> {
    const { data } = await httpClient.get<DisciplineDto[]>('/disciplines', {
      params: includeInactive ? { includeInactive: true } : undefined,
    });
    return data;
  },

  async create(nome: string): Promise<DisciplineDto> {
    const { data } = await httpClient.post<DisciplineDto>('/disciplines', { nome });
    return data;
  },

  async update(id: string, patch: DisciplinePayload): Promise<DisciplineDto> {
    const { data } = await httpClient.patch<DisciplineDto>(`/disciplines/${id}`, patch);
    return data;
  },
};
