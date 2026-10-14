import { z } from 'zod';
import type {
  PayableDto,
  PayableSource,
  PayableStatus,
  PaymentMethod,
} from '@falcao-erp/shared-types';
import { toDateOnly } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import {
  dateOnlySchema,
  emptyToUndefined,
  moneySchema,
  optionalDateOnly,
  optionalText,
  requiredText,
} from '@/validators/common';

export type {
  CashFlowPointDto,
  CostCenterTotalDto,
  PayableDto,
  PayableStatsDto,
} from '@falcao-erp/shared-types';

export interface PayableListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PayableStatus;
  origem?: PayableSource;
  costCenter?: string;
  vencidas?: boolean;
  semNota?: boolean;
  /** Só contas com nota fiscal (exportação de notas). */
  comNota?: boolean;
  from?: string;
  to?: string;
}

export interface PayableFilters {
  busca?: string;
  status?: PayableStatus;
  origem?: PayableSource;
  costCenter?: string;
  vencidas?: boolean;
  semNota?: boolean;
  from?: string;
  to?: string;
}

export function toListParams(filters: PayableFilters, search?: string): PayableListParams {
  return {
    search: search || undefined,
    status: filters.status,
    origem: filters.origem,
    costCenter: filters.costCenter,
    vencidas: filters.vencidas || undefined,
    semNota: filters.semNota || undefined,
    from: filters.from,
    to: filters.to,
  };
}

// ── Conta a pagar (criar/editar) ─────────────────────────────

export const payableFormSchema = z.object({
  descricao: requiredText(3, 200),
  valor: moneySchema(0.01),
  vencimento: dateOnlySchema,
  supplierId: z.string().optional(),
  contractId: z.string().optional(),
  purchaseRequestId: z.string().optional(),
  costCenter: optionalText(60),
  notaFiscal: optionalText(60),
  notaFiscalEmissao: optionalDateOnly,
  observacoes: optionalText(2000),
});

export type PayableFormInput = z.infer<typeof payableFormSchema>;

export interface PayablePayload {
  descricao: string;
  valor?: number;
  vencimento: string;
  supplierId?: string;
  contractId?: string;
  purchaseRequestId?: string;
  costCenter?: string;
  notaFiscal?: string;
  notaFiscalEmissao?: string;
  observacoes?: string;
}

export function emptyPayableForm(): PayableFormInput {
  return {
    descricao: '',
    valor: '' as unknown as number,
    vencimento: '',
    supplierId: '',
    contractId: '',
    purchaseRequestId: '',
    costCenter: '',
    notaFiscal: '',
    notaFiscalEmissao: '',
    observacoes: '',
  };
}

export function toPayableForm(payable: PayableDto): PayableFormInput {
  return {
    descricao: payable.descricao,
    valor: Number(payable.valor),
    vencimento: payable.vencimento,
    supplierId: payable.supplierId ?? '',
    contractId: payable.contractId ?? '',
    purchaseRequestId: payable.purchaseRequestId ?? '',
    costCenter: payable.costCenter ?? '',
    notaFiscal: payable.notaFiscal ?? '',
    notaFiscalEmissao: payable.notaFiscalEmissao ?? '',
    observacoes: payable.observacoes ?? '',
  };
}

/** Contas de reembolso não aceitam valor nem vínculos (a API recusa). */
export function fromPayableForm(input: PayableFormInput, isReimbursement = false): PayablePayload {
  const base: PayablePayload = {
    descricao: input.descricao,
    vencimento: input.vencimento,
    notaFiscal: emptyToUndefined(input.notaFiscal),
    notaFiscalEmissao: emptyToUndefined(input.notaFiscalEmissao),
    observacoes: emptyToUndefined(input.observacoes),
  };
  if (isReimbursement) return base;
  return {
    ...base,
    valor: Number(input.valor),
    supplierId: emptyToUndefined(input.supplierId),
    contractId: emptyToUndefined(input.contractId),
    purchaseRequestId: emptyToUndefined(input.purchaseRequestId),
    costCenter: emptyToUndefined(input.costCenter),
  };
}

// ── Baixa ───────────────────────────────────────────────────

export const payFormSchema = z
  .object({
    pagoEm: dateOnlySchema,
    valorPago: moneySchema(0.01),
    formaPagamento: z.string().min(1, i18n.t('validation:selectOption')),
  })
  .refine((v) => !v.pagoEm || v.pagoEm <= toDateOnly(), {
    path: ['pagoEm'],
    message: i18n.t('validation:futureDate'),
  });

export type PayFormInput = z.infer<typeof payFormSchema>;

export interface PayPayload {
  pagoEm: string;
  valorPago: number;
  formaPagamento: PaymentMethod;
}

// ── Nota fiscal ─────────────────────────────────────────────

export const invoiceFormSchema = z.object({
  notaFiscal: requiredText(1, 60),
  notaFiscalEmissao: optionalDateOnly,
});

export type InvoiceFormInput = z.infer<typeof invoiceFormSchema>;
