import type {
  InvoiceXmlCheckDto,
  PayableWithInvoiceCheckDto,
  CashFlowPointDto,
  CostCenterTotalDto,
  PaginatedResult,
  PayableDto,
  PayableStatsDto,
} from '@falcao-erp/shared-types';
import { httpClient } from '@/services/http/client';
import { UPLOAD_TIMEOUT_MS } from '@/constants/uploads';
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

  /** PDF (DANFE) ou XML da NF-e; o XML preenche número, emissão e chave e volta conferido. */
  async uploadInvoiceFile(id: string, file: File): Promise<PayableWithInvoiceCheckDto> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await httpClient.post<PayableWithInvoiceCheckDto>(
      `/payables/${id}/invoice-file`,
      form,
      { timeout: UPLOAD_TIMEOUT_MS },
    );
    return data;
  },

  async removeInvoiceFile(id: string, kind: 'pdf' | 'xml'): Promise<PayableDto> {
    const { data } = await httpClient.delete<PayableDto>(`/payables/${id}/invoice-file/${kind}`);
    return data;
  },

  /** Lê o XML sem gravar, para abrir uma conta já preenchida. */
  async previewInvoiceXml(file: File): Promise<InvoiceXmlCheckDto> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await httpClient.post<InvoiceXmlCheckDto>(
      '/payables/invoice-xml/preview',
      form,
      {
        timeout: UPLOAD_TIMEOUT_MS,
      },
    );
    return data;
  },

  async cancel(id: string): Promise<PayableDto> {
    const { data } = await httpClient.patch<PayableDto>(`/payables/${id}/cancel`);
    return data;
  },
};
