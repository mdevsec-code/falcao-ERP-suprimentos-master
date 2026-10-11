import type {
  PaginatedResult,
  PurchaseRequestAttachmentDto,
  PurchaseRequestCommentDto,
  PurchaseRequestDetailDto,
  PurchaseRequestStatsDto,
  PurchaseRequestStatus,
  PurchaseRequestSummaryDto,
  PurchaseRequestTimelineEntryDto,
} from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { PurchaseRequestListParams, PurchaseRequestPayload } from '../types';

export const purchaseRequestsApi = {
  async list(
    params: PurchaseRequestListParams,
  ): Promise<PaginatedResult<PurchaseRequestSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<PurchaseRequestSummaryDto>>(
      '/purchase-requests',
      { params },
    );
    return data;
  },

  async stats(): Promise<PurchaseRequestStatsDto> {
    const { data } = await httpClient.get<PurchaseRequestStatsDto>('/purchase-requests/stats');
    return data;
  },

  async getById(id: string): Promise<PurchaseRequestDetailDto> {
    const { data } = await httpClient.get<PurchaseRequestDetailDto>(`/purchase-requests/${id}`);
    return data;
  },

  async getTimeline(id: string): Promise<PurchaseRequestTimelineEntryDto[]> {
    const { data } = await httpClient.get<PurchaseRequestTimelineEntryDto[]>(
      `/purchase-requests/${id}/timeline`,
    );
    return data;
  },

  async create(input: PurchaseRequestPayload): Promise<PurchaseRequestDetailDto> {
    const { data } = await httpClient.post<PurchaseRequestDetailDto>('/purchase-requests', input);
    return data;
  },

  async changeStatus(
    id: string,
    status: PurchaseRequestStatus,
    comment?: string,
  ): Promise<PurchaseRequestDetailDto> {
    const { data } = await httpClient.patch<PurchaseRequestDetailDto>(
      `/purchase-requests/${id}/status`,
      { status, comment },
    );
    return data;
  },

  async addComment(id: string, message: string): Promise<PurchaseRequestCommentDto> {
    const { data } = await httpClient.post<PurchaseRequestCommentDto>(
      `/purchase-requests/${id}/comments`,
      { message },
    );
    return data;
  },

  async uploadAttachment(id: string, file: File): Promise<PurchaseRequestAttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post<PurchaseRequestAttachmentDto>(
      `/purchase-requests/${id}/attachments`,
      formData,
    );
    return data;
  },

  async removeAttachment(id: string, attachmentId: string): Promise<void> {
    await httpClient.delete(`/purchase-requests/${id}/attachments/${attachmentId}`);
  },
};
