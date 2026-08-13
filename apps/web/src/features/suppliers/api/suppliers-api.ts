import type {
  PaginatedResult,
  SupplierDetailDto,
  SupplierDocumentDto,
  SupplierEvaluationDto,
  SupplierStatsDto,
  SupplierSummaryDto,
} from "@falcao-erp/shared-types";
import { apiClient } from "@/api/client";

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoria?: string;
  estado?: string;
  cidade?: string;
  isActive?: boolean;
}

export interface SupplierContactInput {
  type: "PHONE" | "EMAIL";
  label: string;
  value: string;
}

export interface SupplierFormInput {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  categoria: string;
  cidade: string;
  estado: string;
  responsavel: string;
  contacts: SupplierContactInput[];
}

export const suppliersApi = {
  list: (params: SupplierListParams) =>
    apiClient
      .get<PaginatedResult<SupplierSummaryDto>>("/suppliers", { params })
      .then((res) => res.data),

  stats: () => apiClient.get<SupplierStatsDto>("/suppliers/stats").then((res) => res.data),

  getById: (id: string) =>
    apiClient.get<SupplierDetailDto>(`/suppliers/${id}`).then((res) => res.data),

  create: (data: SupplierFormInput) =>
    apiClient.post<SupplierDetailDto>("/suppliers", data).then((res) => res.data),

  update: (id: string, data: Partial<SupplierFormInput>) =>
    apiClient.patch<SupplierDetailDto>(`/suppliers/${id}`, data).then((res) => res.data),

  deactivate: (id: string) =>
    apiClient.delete<SupplierDetailDto>(`/suppliers/${id}`).then((res) => res.data),

  reactivate: (id: string) =>
    apiClient.patch<SupplierDetailDto>(`/suppliers/${id}/reactivate`).then((res) => res.data),

  addEvaluation: (id: string, score: number, comment?: string) =>
    apiClient
      .post<SupplierEvaluationDto>(`/suppliers/${id}/evaluations`, { score, comment })
      .then((res) => res.data),

  uploadDocument: (id: string, file: File, category: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    return apiClient
      .post<SupplierDocumentDto>(`/suppliers/${id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  removeDocument: (id: string, documentId: string) =>
    apiClient.delete(`/suppliers/${id}/documents/${documentId}`),
};
