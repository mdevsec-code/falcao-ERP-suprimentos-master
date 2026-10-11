import type { UserSummaryDto } from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';

export const profileApi = {
  async me(): Promise<UserSummaryDto> {
    const { data } = await httpClient.get<UserSummaryDto>('/users/me');
    return data;
  },

  async updateName(name: string): Promise<UserSummaryDto> {
    const { data } = await httpClient.patch<UserSummaryDto>('/users/me', { name });
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await httpClient.patch('/users/me/password', { currentPassword, newPassword });
  },
};
