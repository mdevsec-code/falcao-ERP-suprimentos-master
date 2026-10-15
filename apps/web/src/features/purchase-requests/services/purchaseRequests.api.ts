import type {
  ApprovalStep,
  ApprovalStepConfigDto,
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
import { UPLOAD_TIMEOUT_MS } from '@/constants/uploads';

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
      { timeout: UPLOAD_TIMEOUT_MS },
    );
    return data;
  },

  async removeAttachment(id: string, attachmentId: string): Promise<void> {
    await httpClient.delete(`/purchase-requests/${id}/attachments/${attachmentId}`);
  },

  /** Foto de item: sobe antes de salvar; o item guarda o caminho devolvido. */
  async uploadItemPhoto(file: File): Promise<{ path: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post<{ path: string; url: string }>(
      '/purchase-requests/item-photos',
      formData,
      { timeout: UPLOAD_TIMEOUT_MS },
    );
    return data;
  },

  /** Assinatura digital da etapa atual. */
  async sign(id: string, payload: SignPayload): Promise<PurchaseRequestDetailDto> {
    const { data } = await httpClient.post<PurchaseRequestDetailDto>(
      `/purchase-requests/${id}/sign`,
      payload,
    );
    return data;
  },

  async approvalSteps(): Promise<ApprovalStepConfigDto[]> {
    const { data } = await httpClient.get<ApprovalStepConfigDto[]>(
      '/purchase-requests/approval-steps',
    );
    return data;
  },

  async setApprovalStep(step: ApprovalStep, userIds: string[]): Promise<ApprovalStepConfigDto[]> {
    const { data } = await httpClient.put<ApprovalStepConfigDto[]>(
      `/purchase-requests/approval-steps/${step}`,
      { userIds },
    );
    return data;
  },

  async mySignature(): Promise<{ signatureData: string | null }> {
    const { data } = await httpClient.get<{ signatureData: string | null }>(
      '/purchase-requests/my-signature',
    );
    return data;
  },

  async clearMySignature(): Promise<{ signatureData: string | null }> {
    const { data } = await httpClient.delete<{ signatureData: string | null }>(
      '/purchase-requests/my-signature',
    );
    return data;
  },
};

export interface SignPayload {
  decision: 'APROVADO' | 'RECUSADO';
  signatureData: string;
  comment?: string;
  saveSignature?: boolean;
}
