import axios from 'axios';
import type {
  PaginatedResult,
  PublicQuotationDto,
  QuotationDetailDto,
  QuotationStatsDto,
  QuotationSummaryDto,
} from '@falcao-erp/shared-types';

import { env } from '@/config/env';
import { httpClient } from '@/services/http/client';
import { ApiError, type ApiErrorBody } from '@/services/http/errors';
import type {
  CreateQuotationPayload,
  PublicDeclinePayload,
  PublicSubmitPayload,
  QuotationListParams,
  SubmitPricesPayload,
  UpdateQuotationPayload,
} from '../types';

export const quotationsApi = {
  async list(params: QuotationListParams): Promise<PaginatedResult<QuotationSummaryDto>> {
    const { data } = await httpClient.get<PaginatedResult<QuotationSummaryDto>>('/quotations', {
      params,
    });
    return data;
  },

  async stats(): Promise<QuotationStatsDto> {
    const { data } = await httpClient.get<QuotationStatsDto>('/quotations/stats');
    return data;
  },

  async getById(id: string): Promise<QuotationDetailDto> {
    const { data } = await httpClient.get<QuotationDetailDto>(`/quotations/${id}`);
    return data;
  },

  async create(input: CreateQuotationPayload): Promise<QuotationDetailDto> {
    const { data } = await httpClient.post<QuotationDetailDto>('/quotations', input);
    return data;
  },

  async update(id: string, patch: UpdateQuotationPayload): Promise<QuotationDetailDto> {
    const { data } = await httpClient.patch<QuotationDetailDto>(`/quotations/${id}`, patch);
    return data;
  },

  async addSupplier(id: string, supplierId: string): Promise<QuotationDetailDto> {
    const { data } = await httpClient.post<QuotationDetailDto>(`/quotations/${id}/suppliers`, {
      supplierId,
    });
    return data;
  },

  async removeSupplier(id: string, quotationSupplierId: string): Promise<QuotationDetailDto> {
    const { data } = await httpClient.delete<QuotationDetailDto>(
      `/quotations/${id}/suppliers/${quotationSupplierId}`,
    );
    return data;
  },

  async regenerateLink(id: string, quotationSupplierId: string): Promise<QuotationDetailDto> {
    const { data } = await httpClient.post<QuotationDetailDto>(
      `/quotations/${id}/suppliers/${quotationSupplierId}/link`,
    );
    return data;
  },

  async submitPrices(
    id: string,
    quotationSupplierId: string,
    payload: SubmitPricesPayload,
  ): Promise<QuotationDetailDto> {
    const { data } = await httpClient.put<QuotationDetailDto>(
      `/quotations/${id}/suppliers/${quotationSupplierId}/prices`,
      payload,
    );
    return data;
  },

  async setWinner(
    id: string,
    itemId: string,
    quotationSupplierId: string | null,
  ): Promise<QuotationDetailDto> {
    const { data } = await httpClient.patch<QuotationDetailDto>(
      `/quotations/${id}/items/${itemId}/winner`,
      { quotationSupplierId },
    );
    return data;
  },

  async pickCheapest(id: string): Promise<QuotationDetailDto> {
    const { data } = await httpClient.post<QuotationDetailDto>(`/quotations/${id}/pick-cheapest`);
    return data;
  },

  async close(id: string): Promise<QuotationDetailDto> {
    const { data } = await httpClient.post<QuotationDetailDto>(`/quotations/${id}/close`);
    return data;
  },

  async cancel(id: string): Promise<QuotationDetailDto> {
    const { data } = await httpClient.post<QuotationDetailDto>(`/quotations/${id}/cancel`);
    return data;
  },
};

/**
 * O fornecedor não tem conta: o link é a credencial. Cliente HTTP próprio,
 * sem token de sessão nem o fluxo de refresh/redirect para o login.
 */
const publicClient = axios.create({ baseURL: env.VITE_API_URL, timeout: 20_000 });
publicClient.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(
    axios.isAxiosError<ApiErrorBody>(error)
      ? ApiError.fromAxios(error)
      : new ApiError({ message: 'Erro desconhecido' }),
  ),
);

export const publicQuotationsApi = {
  async view(token: string): Promise<PublicQuotationDto> {
    const { data } = await publicClient.get<PublicQuotationDto>(
      `/public/quotations/${encodeURIComponent(token)}`,
    );
    return data;
  },

  async submit(token: string, payload: PublicSubmitPayload): Promise<PublicQuotationDto> {
    const { data } = await publicClient.put<PublicQuotationDto>(
      `/public/quotations/${encodeURIComponent(token)}`,
      payload,
    );
    return data;
  },

  async decline(token: string, payload: PublicDeclinePayload): Promise<PublicQuotationDto> {
    const { data } = await publicClient.post<PublicQuotationDto>(
      `/public/quotations/${encodeURIComponent(token)}/decline`,
      payload,
    );
    return data;
  },
};
