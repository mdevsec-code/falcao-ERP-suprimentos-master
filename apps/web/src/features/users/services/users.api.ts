import type { PaginatedResult, UserStatsDto, UserSummaryDto } from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { CreateUserInput, EditUserInput, UserListParams } from '../types';

export const usersApi = {
  async list(params: UserListParams): Promise<PaginatedResult<UserSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<UserSummaryDto>>('/users', { params });
    return data;
  },

  async stats(): Promise<UserStatsDto> {
    const { data } = await httpClient.get<UserStatsDto>('/users/stats');
    return data;
  },

  async create(input: CreateUserInput): Promise<UserSummaryDto> {
    const { data } = await httpClient.post<UserSummaryDto>('/users', input);
    return data;
  },

  async update(id: string, patch: Partial<EditUserInput>): Promise<UserSummaryDto> {
    const { data } = await httpClient.patch<UserSummaryDto>(`/users/${id}`, patch);
    return data;
  },

  async resetPassword(id: string, password: string): Promise<void> {
    await httpClient.patch(`/users/${id}/password`, { password });
  },
};
