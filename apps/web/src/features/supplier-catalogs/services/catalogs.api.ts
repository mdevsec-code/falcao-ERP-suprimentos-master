import type {
  PaginatedResult,
  PublicCatalogLinkDto,
  PublicCatalogSubmitResultDto,
  SupplierCatalogDetailDto,
  SupplierCatalogStatus,
  SupplierCatalogSummaryDto,
} from '@falcao-erp/shared-types';

import { UPLOAD_TIMEOUT_MS } from '@/constants/uploads';
import type { PublicIdentityPayload } from '@/features/quotations/types';
import { httpClient } from '@/services/http/client';
import { publicClient } from '@/services/http/publicClient';

export interface CatalogListParams {
  page?: number;
  pageSize?: number;
  status?: SupplierCatalogStatus;
  supplierId?: string;
}

export interface CatalogItemPayload {
  codigoFornecedor?: string;
  descricao: string;
  unidade: string;
  marca?: string;
  referencia?: string;
  preco?: number;
  observacao?: string;
}

export interface CatalogDecision {
  itemId: string;
  acao: 'IMPORTAR' | 'IGNORAR';
  productId?: string;
}

export interface CreateProductFromItemPayload {
  codigo: string;
  nome: string;
  categoria: string;
  unidade: string;
  disciplineId?: string;
}

export const catalogsApi = {
  async list(params: CatalogListParams): Promise<PaginatedResult<SupplierCatalogSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<SupplierCatalogSummaryDto>>(
      '/supplier-catalogs',
      { params },
    );
    return data;
  },

  async stats(): Promise<{ pendentes: number }> {
    const { data } = await httpClient.get<{ pendentes: number }>('/supplier-catalogs/stats');
    return data;
  },

  async getById(id: string): Promise<SupplierCatalogDetailDto> {
    const { data } = await httpClient.get<SupplierCatalogDetailDto>(`/supplier-catalogs/${id}`);
    return data;
  },

  async getLink(): Promise<{ token: string | null }> {
    const { data } = await httpClient.get<{ token: string | null }>('/supplier-catalogs/link');
    return data;
  },

  async regenerateLink(): Promise<{ token: string | null }> {
    const { data } = await httpClient.post<{ token: string }>('/supplier-catalogs/link');
    return data;
  },

  async disableLink(): Promise<{ token: string | null }> {
    const { data } = await httpClient.delete<{ token: null }>('/supplier-catalogs/link');
    return data;
  },

  async review(id: string, decisoes: CatalogDecision[]): Promise<SupplierCatalogDetailDto> {
    const { data } = await httpClient.post<SupplierCatalogDetailDto>(
      `/supplier-catalogs/${id}/review`,
      { decisoes },
    );
    return data;
  },

  async createProduct(
    id: string,
    itemId: string,
    payload: CreateProductFromItemPayload,
  ): Promise<SupplierCatalogDetailDto> {
    const { data } = await httpClient.post<SupplierCatalogDetailDto>(
      `/supplier-catalogs/${id}/items/${itemId}/product`,
      payload,
    );
    return data;
  },

  async reject(id: string, motivo?: string): Promise<SupplierCatalogDetailDto> {
    const { data } = await httpClient.post<SupplierCatalogDetailDto>(
      `/supplier-catalogs/${id}/reject`,
      { motivo },
    );
    return data;
  },
};

/** Link público da empresa: o fornecedor envia o catálogo sem conta no sistema. */
export const publicCatalogsApi = {
  async view(token: string): Promise<PublicCatalogLinkDto> {
    const { data } = await publicClient.get<PublicCatalogLinkDto>(
      `/public/catalogs/${encodeURIComponent(token)}`,
    );
    return data;
  },

  async submit(
    token: string,
    payload: {
      identidade: PublicIdentityPayload;
      observacoes?: string;
      itens: CatalogItemPayload[];
    },
    file: File | null,
  ): Promise<PublicCatalogSubmitResultDto> {
    const form = new FormData();
    form.append('dados', JSON.stringify(payload));
    if (file) form.append('file', file);
    const { data } = await publicClient.post<PublicCatalogSubmitResultDto>(
      `/public/catalogs/${encodeURIComponent(token)}`,
      form,
      { timeout: UPLOAD_TIMEOUT_MS },
    );
    return data;
  },
};
