import type {
  PaginatedResult,
  ReimbursementAttachmentDto,
  ReimbursementDetailDto,
  ReimbursementStatsDto,
  ReimbursementSummaryDto,
} from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { DecisionPayload, ReimbursementListParams, ReimbursementPayload } from '../types';
import { UPLOAD_TIMEOUT_MS } from '@/constants/uploads';

export const reimbursementsApi = {
  async list(params: ReimbursementListParams): Promise<PaginatedResult<ReimbursementSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<ReimbursementSummaryDto>>(
      '/reimbursements',
      { params },
    );
    return data;
  },

  async stats(): Promise<ReimbursementStatsDto> {
    const { data } = await httpClient.get<ReimbursementStatsDto>('/reimbursements/stats');
    return data;
  },

  async getById(id: string): Promise<ReimbursementDetailDto> {
    const { data } = await httpClient.get<ReimbursementDetailDto>(`/reimbursements/${id}`);
    return data;
  },

  async create(input: ReimbursementPayload): Promise<ReimbursementDetailDto> {
    const { data } = await httpClient.post<ReimbursementDetailDto>('/reimbursements', input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/reimbursements/${id}`);
  },

  async decide(id: string, input: DecisionPayload): Promise<ReimbursementDetailDto> {
    const { data } = await httpClient.patch<ReimbursementDetailDto>(
      `/reimbursements/${id}/decision`,
      input,
    );
    return data;
  },

  async uploadAttachment(id: string, file: File): Promise<ReimbursementAttachmentDto> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await httpClient.post<ReimbursementAttachmentDto>(
      `/reimbursements/${id}/attachments`,
      form,
      { timeout: UPLOAD_TIMEOUT_MS },
    );
    return data;
  },

  async removeAttachment(id: string, attachmentId: string): Promise<void> {
    await httpClient.delete(`/reimbursements/${id}/attachments/${attachmentId}`);
  },
};
