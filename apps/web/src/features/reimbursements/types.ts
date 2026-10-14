import { z } from 'zod';
import type { ExpenseCategory, ReimbursementStatus } from '@falcao-erp/shared-types';
import { toDateOnly } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import {
  dateOnlySchema,
  emptyToUndefined,
  moneySchema,
  optionalText,
  requiredText,
} from '@/validators/common';

export type {
  ReimbursementAttachmentDto,
  ReimbursementDetailDto,
  ReimbursementItemDto,
  ReimbursementStatsDto,
  ReimbursementSummaryDto,
} from '@falcao-erp/shared-types';
import { MAX_UPLOAD_BYTES as UPLOAD_LIMIT_BYTES } from '@/constants/uploads';

export interface ReimbursementListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ReimbursementStatus;
  mine?: boolean;
}

export interface ReimbursementFilters {
  busca?: string;
  status?: ReimbursementStatus;
  mine?: boolean;
}

/** Limite de upload da API (comprovantes). */
export const MAX_RECEIPT_BYTES = UPLOAD_LIMIT_BYTES;

export const expenseItemSchema = z.object({
  data: dateOnlySchema.refine((v) => v <= toDateOnly(), i18n.t('validation:futureDate')),
  categoria: z.string().min(1, i18n.t('validation:selectOption')),
  descricao: requiredText(2, 200),
  valor: moneySchema(0.01),
});

export const reimbursementFormSchema = z.object({
  titulo: requiredText(3, 180),
  costCenter: optionalText(60),
  items: z.array(expenseItemSchema).min(1, i18n.t('reimbursements:validation.itemsRequired')),
});

export type ReimbursementFormInput = z.infer<typeof reimbursementFormSchema>;
export type ExpenseItemInput = ReimbursementFormInput['items'][number];

export function emptyExpenseItem(): ExpenseItemInput {
  return { data: toDateOnly(), categoria: '', descricao: '', valor: '' as unknown as number };
}

export interface ReimbursementPayload {
  titulo: string;
  costCenter?: string;
  items: { data: string; categoria: ExpenseCategory; descricao: string; valor: number }[];
}

export function fromReimbursementForm(input: ReimbursementFormInput): ReimbursementPayload {
  return {
    titulo: input.titulo,
    costCenter: emptyToUndefined(input.costCenter),
    items: input.items.map((item) => ({
      data: item.data,
      categoria: item.categoria as ExpenseCategory,
      descricao: item.descricao,
      valor: Number(item.valor),
    })),
  };
}

export interface DecisionPayload {
  decision: 'APPROVE' | 'REJECT';
  comment?: string;
  vencimento?: string;
}
