import type { QuotationStatus } from '@falcao-erp/shared-types';

export type {
  PublicQuotationDto,
  QuotationAnalysisDto,
  QuotationDetailDto,
  QuotationItemDto,
  QuotationPriceDto,
  QuotationStatsDto,
  QuotationSummaryDto,
  QuotationSupplierDto,
} from '@falcao-erp/shared-types';

export interface QuotationListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: QuotationStatus;
  purchaseRequestId?: string;
}

/** Corpo de `POST /quotations`. */
export interface CreateQuotationPayload {
  purchaseRequestId: string;
  titulo?: string;
  prazoResposta: string;
  observacoes?: string;
  supplierIds: string[];
  itemIds?: string[];
}

export interface UpdateQuotationPayload {
  titulo?: string;
  prazoResposta?: string;
  observacoes?: string;
}

export interface PriceInput {
  itemId: string;
  disponivel: boolean;
  precoUnitario?: number | null;
  marca?: string;
  referencia?: string;
  observacao?: string;
}

/** Resposta do fornecedor — a mesma do link público e do lançamento manual por compras. */
export interface SubmitPricesPayload {
  precos: PriceInput[];
  prazoEntregaDias?: number;
  condicaoPagamento?: string;
  validadeProposta?: string;
  frete?: number;
  observacoes?: string;
}

export interface PublicSubmitPayload extends SubmitPricesPayload {
  nomeResponsavel: string;
}

export interface PublicDeclinePayload {
  nomeResponsavel: string;
  motivo?: string;
}
