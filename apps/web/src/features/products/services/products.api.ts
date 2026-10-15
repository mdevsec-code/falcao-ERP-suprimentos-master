import type {
  PaginatedResult,
  ProductDetailDto,
  ProductPriceEntryDto,
  ProductStatsDto,
  ProductSummaryDto,
} from '@falcao-erp/shared-types';
import { UPLOAD_TIMEOUT_MS } from '@/constants/uploads';
import { httpClient } from '@/services/http/client';
import type {
  CatalogFromItemPayload,
  PriceEntryPayload,
  ProductListParams,
  ProductPayload,
} from '../types';

export const productsApi = {
  async list(params: ProductListParams): Promise<PaginatedResult<ProductSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<ProductSummaryDto>>('/products', {
      params,
    });
    return data;
  },

  async stats(): Promise<ProductStatsDto> {
    const { data } = await httpClient.get<ProductStatsDto>('/products/stats');
    return data;
  },

  async getById(id: string): Promise<ProductDetailDto> {
    const { data } = await httpClient.get<ProductDetailDto>(`/products/${id}`);
    return data;
  },

  async create(input: ProductPayload): Promise<ProductDetailDto> {
    const { data } = await httpClient.post<ProductDetailDto>('/products', input);
    return data;
  },

  async update(id: string, patch: Partial<ProductPayload>): Promise<ProductDetailDto> {
    const { data } = await httpClient.patch<ProductDetailDto>(`/products/${id}`, patch);
    return data;
  },

  async deactivate(id: string): Promise<ProductDetailDto> {
    const { data } = await httpClient.delete<ProductDetailDto>(`/products/${id}`);
    return data;
  },

  async reactivate(id: string): Promise<ProductDetailDto> {
    const { data } = await httpClient.patch<ProductDetailDto>(`/products/${id}/reactivate`);
    return data;
  },

  async addPriceEntry(id: string, entry: PriceEntryPayload): Promise<ProductPriceEntryDto> {
    const { data } = await httpClient.post<ProductPriceEntryDto>(
      `/products/${id}/price-entries`,
      entry,
    );
    return data;
  },

  /** Inclui no catálogo um item digitado à mão numa solicitação. */
  async createFromRequestItem(input: CatalogFromItemPayload): Promise<ProductDetailDto> {
    const { data } = await httpClient.post<ProductDetailDto>('/products/from-request-item', input);
    return data;
  },

  /** Foto do produto (substitui a anterior). */
  async setPhoto(id: string, file: File): Promise<ProductDetailDto> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post<ProductDetailDto>(`/products/${id}/photo`, formData, {
      timeout: UPLOAD_TIMEOUT_MS,
    });
    return data;
  },

  async removePhoto(id: string): Promise<ProductDetailDto> {
    const { data } = await httpClient.delete<ProductDetailDto>(`/products/${id}/photo`);
    return data;
  },
};
