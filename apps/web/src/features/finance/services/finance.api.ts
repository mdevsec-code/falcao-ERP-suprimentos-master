import type {
  CashFlowPointDto,
  CostCenterTotalDto,
  PaginatedResult,
  PayableDto,
  PayableStatsDto,
} from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import type { InvoiceFormInput, PayableListParams, PayablePayload, PayPayload } from '../types';

export const financeApi = {
  async list(params: PayableListParams): Promise<PaginatedResult<PayableDto>> {
    const { data } = await httpClient.get<PaginatedResult<PayableDto>>('/payables', { params });
    return data;
  },

  async stats(): Promise<PayableStatsDto> {
    const { data } = await httpClient.get<PayableStatsDto>('/payables/stats');
    return data;
  },

  async cashFlow(costCenter?: string): Promise<CashFlowPointDto[]> {
    const { data } = await httpClient.get<CashFlowPointDto[]>('/payables/cash-flow', {
      params: { costCenter: costCenter || undefined },
    });
    return data;
  },

  async byCostCenter(): Promise<CostCenterTotalDto[]> {
    const { data } = await httpClient.get<CostCenterTotalDto[]>('/payables/by-cost-center');
    return data;
  },

  async costCenters(): Promise<string[]> {
    const { data } = await httpClient.get<string[]>('/payables/cost-centers');
    return data;
  },

  async create(input: PayablePayload): Promise<PayableDto> {
    const { data } = await httpClient.post<PayableDto>('/payables', input);
    return data;
  },

  async update(id: string, input: PayablePayload): Promise<PayableDto> {
    const { data } = await httpClient.patch<PayableDto>(`/payables/${id}`, input);
    return data;
  },

  async pay(id: string, input: PayPayload): Promise<PayableDto> {
    const { data } = await httpClient.patch<PayableDto>(`/payables/${id}/pay`, input);
    return data;
  },

  async invoice(id: string, input: InvoiceFormInput): Promise<PayableDto> {
    const { data } = await httpClient.patch<PayableDto>(`/payables/${id}/invoice`, {
      notaFiscal: input.notaFiscal,
      notaFiscalEmissao: input.notaFiscalEmissao || undefined,
    });
    return data;
  },

  async cancel(id: string): Promise<PayableDto> {
    const { data } = await httpClient.patch<PayableDto>(`/payables/${id}/cancel`);
    return data;
  },
};
