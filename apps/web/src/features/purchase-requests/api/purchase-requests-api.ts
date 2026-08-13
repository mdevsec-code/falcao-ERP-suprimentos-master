import type {
  PaginatedResult,
  PurchaseRequestAttachmentDto,
  PurchaseRequestCommentDto,
  PurchaseRequestDetailDto,
  PurchaseRequestStatsDto,
  PurchaseRequestSummaryDto,
  PurchaseRequestTimelineEntryDto,
} from "@falcao-erp/shared-types";
import { apiClient } from "@/api/client";

export interface PurchaseRequestListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface PurchaseRequestItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
}

export interface PurchaseRequestFormInput {
  title: string;
  justification?: string;
  costCenter?: string;
  items: PurchaseRequestItemInput[];
}

export const purchaseRequestsApi = {
  list: (params: PurchaseRequestListParams) =>
    apiClient
      .get<PaginatedResult<PurchaseRequestSummaryDto>>("/purchase-requests", { params })
      .then((res) => res.data),

  stats: () => apiClient.get<PurchaseRequestStatsDto>("/purchase-requests/stats").then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<PurchaseRequestDetailDto>(`/purchase-requests/${id}`).then((res) => res.data),

  getTimeline: (id: string) =>
    apiClient
      .get<PurchaseRequestTimelineEntryDto[]>(`/purchase-requests/${id}/timeline`)
      .then((res) => res.data),

  create: (data: PurchaseRequestFormInput) =>
    apiClient.post<PurchaseRequestDetailDto>("/purchase-requests", data).then((res) => res.data),

  update: (id: string, data: Partial<PurchaseRequestFormInput>) =>
    apiClient.patch<PurchaseRequestDetailDto>(`/purchase-requests/${id}`, data).then((res) => res.data),

  changeStatus: (id: string, status: string, comment?: string) =>
    apiClient
      .patch<PurchaseRequestDetailDto>(`/purchase-requests/${id}/status`, { status, comment })
      .then((res) => res.data),

  addComment: (id: string, message: string) =>
    apiClient
      .post<PurchaseRequestCommentDto>(`/purchase-requests/${id}/comments`, { message })
      .then((res) => res.data),

  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post<PurchaseRequestAttachmentDto>(`/purchase-requests/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  removeAttachment: (id: string, attachmentId: string) =>
    apiClient.delete(`/purchase-requests/${id}/attachments/${attachmentId}`),
};
