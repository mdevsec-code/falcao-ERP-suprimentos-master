import type { DocumentDto, DocumentStatsDto, PaginatedResult } from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { DocumentListParams, DocumentUpdatePayload } from '../types';

export const documentsApi = {
  async list(params: DocumentListParams): Promise<PaginatedResult<DocumentDto>> {
    const { data } = await httpClient.get<PaginatedResult<DocumentDto>>('/documents', { params });
    return data;
  },

  async stats(): Promise<DocumentStatsDto> {
    const { data } = await httpClient.get<DocumentStatsDto>('/documents/stats');
    return data;
  },

  async tags(): Promise<Array<{ tag: string; count: number }>> {
    const { data } = await httpClient.get<Array<{ tag: string; count: number }>>('/documents/tags');
    return data;
  },

  async upload(form: FormData): Promise<DocumentDto> {
    const { data } = await httpClient.post<DocumentDto>('/documents', form);
    return data;
  },

  async update(id: string, input: DocumentUpdatePayload): Promise<DocumentDto> {
    const { data } = await httpClient.patch<DocumentDto>(`/documents/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/documents/${id}`);
  },
};
