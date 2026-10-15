import type { UserSummaryDto } from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';

export interface WechatStatus {
  connected: boolean;
}

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

  /** Avisos no WeChat (PushPlus): só diz se está ligado. */
  async wechatStatus(): Promise<WechatStatus> {
    const { data } = await httpClient.get<WechatStatus>('/users/me/wechat');
    return data;
  },

  /** Salva o código; a API manda uma mensagem de teste antes de gravar. */
  async setWechat(token: string): Promise<WechatStatus> {
    const { data } = await httpClient.put<WechatStatus>('/users/me/wechat', { token });
    return data;
  },

  async removeWechat(): Promise<WechatStatus> {
    const { data } = await httpClient.delete<WechatStatus>('/users/me/wechat');
    return data;
  },
};
