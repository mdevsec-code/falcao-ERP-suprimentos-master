import { z } from 'zod';
import {
  PurchaseRequestStatus,
  type PurchaseRequestStatus as PurchaseRequestStatusType,
  type Role,
} from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import {
  emptyToUndefined,
  optionalText,
  requiredText,
  toOptionalNumber,
} from '@/validators/common';

export type {
  PurchaseRequestDetailDto,
  PurchaseRequestSummaryDto,
  PurchaseRequestStatsDto,
  PurchaseRequestTimelineEntryDto,
  PurchaseRequestAttachmentDto,
  PurchaseRequestCommentDto,
} from '@falcao-erp/shared-types';
import { MAX_UPLOAD_BYTES as UPLOAD_LIMIT_BYTES } from '@/constants/uploads';

export { PurchaseRequestStatus };

export interface PurchaseRequestListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PurchaseRequestStatusType;
  /** Só as que aguardam a assinatura de quem consulta. */
  pendingMySignature?: boolean;
}

export interface PurchaseRequestFilters {
  busca?: string;
  status?: PurchaseRequestStatusType;
}

/** Limite de `pageSize` da API (`PaginationQueryDto`, `@Max(100)`). */
export const MAX_PAGE_SIZE = 100;

/** Limite de upload da API (`addMaxSizeValidator` no controller). */
export const MAX_UPLOAD_BYTES = UPLOAD_LIMIT_BYTES;

/**
 * Fila de "Aprovações" por papel: etapas operacionais (cotar, pedir, receber).
 * As assinaturas do plano de aquisição têm fila própria ("aguardando minha
 * assinatura"), por pessoa configurada em cada etapa.
 */
export const APPROVAL_QUEUE_BY_ROLE: Partial<Record<Role, PurchaseRequestStatusType[]>> = {
  BUYER: ['EM_COMPRAS', 'EM_COTACAO', 'PEDIDO_REALIZADO'],
  WAREHOUSE: ['PEDIDO_REALIZADO', 'AGUARDANDO_RECEBIMENTO'],
  ADMIN: ['EM_COMPRAS', 'EM_COTACAO', 'PEDIDO_REALIZADO', 'AGUARDANDO_RECEBIMENTO'],
};

const decimal2 = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const purchaseRequestItemSchema = z.object({
  productId: z.string(),
  description: requiredText(2, 200),
  quantity: z.coerce
    .number({ invalid_type_error: i18n.t('validation:number') })
    .min(0.01, i18n.t('validation:minValue', { count: 0.01 }))
    .refine(decimal2, i18n.t('validation:maxDecimals', { count: 2 })),
  unit: requiredText(1, 20),
  estimatedPrice: z
    .union([
      z.literal(''),
      z.coerce
        .number()
        .min(0, i18n.t('validation:minValue', { count: 0 }))
        .refine(decimal2, i18n.t('validation:maxDecimals', { count: 2 })),
    ])
    .optional(),
  marca: optionalText(80),
  referencia: optionalText(80),
  especificacao: optionalText(500),
  pesoTotal: z
    .union([z.literal(''), z.coerce.number().min(0, i18n.t('validation:minValue', { count: 0 }))])
    .optional(),
  localUso: optionalText(120),
  setorSolicitante: optionalText(120),
  dataNecessaria: z.string().optional(),
  /** Foto já enviada (caminho no servidor) e o endereço para mostrar. */
  photoPath: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const purchaseRequestFormSchema = z.object({
  title: requiredText(3, 180),
  justification: optionalText(2000),
  costCenter: optionalText(60),
  requesterContact: optionalText(120),
  items: z
    .array(purchaseRequestItemSchema)
    .min(1, i18n.t('purchaseRequests:validation.itemsRequired')),
});

export type PurchaseRequestFormInput = z.infer<typeof purchaseRequestFormSchema>;
export type PurchaseRequestItemInput = PurchaseRequestFormInput['items'][number];

/** Corpo de `POST /purchase-requests`. */
export interface PurchaseRequestPayload {
  title: string;
  justification?: string;
  costCenter?: string;
  requesterContact?: string;
  items: {
    productId?: string;
    description: string;
    quantity: number;
    unit: string;
    estimatedPrice?: number;
    marca?: string;
    referencia?: string;
    especificacao?: string;
    pesoTotal?: number;
    localUso?: string;
    setorSolicitante?: string;
    dataNecessaria?: string;
    photoPath?: string;
  }[];
}

export function fromFormInput(input: PurchaseRequestFormInput): PurchaseRequestPayload {
  return {
    title: input.title,
    justification: emptyToUndefined(input.justification),
    costCenter: emptyToUndefined(input.costCenter),
    requesterContact: emptyToUndefined(input.requesterContact),
    items: input.items.map((item) => ({
      productId: emptyToUndefined(item.productId),
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      estimatedPrice: toOptionalNumber(item.estimatedPrice),
      marca: emptyToUndefined(item.marca),
      referencia: emptyToUndefined(item.referencia),
      especificacao: emptyToUndefined(item.especificacao),
      pesoTotal: toOptionalNumber(item.pesoTotal),
      localUso: emptyToUndefined(item.localUso),
      setorSolicitante: emptyToUndefined(item.setorSolicitante),
      dataNecessaria: emptyToUndefined(item.dataNecessaria),
      photoPath: emptyToUndefined(item.photoPath),
    })),
  };
}

/** Subtotal estimado de um item do formulário (0 quando sem preço). */
export function itemSubtotal(item: Partial<PurchaseRequestItemInput>): number {
  const quantity = Number(item.quantity);
  const price = Number(item.estimatedPrice);
  if (!quantity || !price || Number.isNaN(quantity) || Number.isNaN(price)) return 0;
  return quantity * price;
}
