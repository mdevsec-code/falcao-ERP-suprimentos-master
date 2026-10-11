import type {
  PaginatedResult,
  SupplierDetailDto,
  SupplierDocumentDto,
  SupplierEvaluationDto,
  SupplierStatsDto,
  SupplierSummaryDto,
} from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { SupplierListParams, SupplierPayload } from '../types';

export const suppliersApi = {
  async list(params: SupplierListParams): Promise<PaginatedResult<SupplierSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<SupplierSummaryDto>>('/suppliers', {
      params,
    });
    return data;
  },

  async stats(): Promise<SupplierStatsDto> {
    const { data } = await httpClient.get<SupplierStatsDto>('/suppliers/stats');
    return data;
  },

  async getById(id: string): Promise<SupplierDetailDto> {
    const { data } = await httpClient.get<SupplierDetailDto>(`/suppliers/${id}`);
    return data;
  },

  async create(input: SupplierPayload): Promise<SupplierDetailDto> {
    const { data } = await httpClient.post<SupplierDetailDto>('/suppliers', input);
    return data;
  },

  async update(id: string, patch: Partial<SupplierPayload>): Promise<SupplierDetailDto> {
    const { data } = await httpClient.patch<SupplierDetailDto>(`/suppliers/${id}`, patch);
    return data;
  },

  async deactivate(id: string): Promise<SupplierDetailDto> {
    const { data } = await httpClient.delete<SupplierDetailDto>(`/suppliers/${id}`);
    return data;
  },

  async reactivate(id: string): Promise<SupplierDetailDto> {
    const { data } = await httpClient.patch<SupplierDetailDto>(`/suppliers/${id}/reactivate`);
    return data;
  },

  async addEvaluation(id: string, score: number, comment?: string): Promise<SupplierEvaluationDto> {
    const { data } = await httpClient.post<SupplierEvaluationDto>(`/suppliers/${id}/evaluations`, {
      score,
      comment,
    });
    return data;
  },

  async uploadDocument(id: string, file: File, category: string): Promise<SupplierDocumentDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const { data } = await httpClient.post<SupplierDocumentDto>(
      `/suppliers/${id}/documents`,
      formData,
    );
    return data;
  },

  async removeDocument(id: string, documentId: string): Promise<void> {
    await httpClient.delete(`/suppliers/${id}/documents/${documentId}`);
  },
};
