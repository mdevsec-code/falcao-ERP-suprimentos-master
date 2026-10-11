import { z } from 'zod';
import { ProductCategory, UnitOfMeasure, type ProductDetailDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import {
  emptyToUndefined,
  optionalNumber,
  optionalText,
  requiredText,
  toOptionalNumber,
} from '@/validators/common';

export type {
  ProductDetailDto,
  ProductSummaryDto,
  ProductStatsDto,
  ProductPriceEntryDto,
} from '@falcao-erp/shared-types';

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoria?: string;
  primarySupplierId?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  busca?: string;
  categoria?: ProductCategory;
}

/** A API aceita no máximo 2 casas decimais em preços (`IsNumber({ maxDecimalPlaces: 2 })`). */
const hasAtMostTwoDecimals = (value: number) =>
  // Tolerância: em ponto flutuante 0.07 * 100 = 7.000000000000001.
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const priceSchema = z.coerce
  .number({ invalid_type_error: i18n.t('validation:number') })
  .min(0, i18n.t('validation:minValue', { count: 0 }))
  .refine(hasAtMostTwoDecimals, i18n.t('validation:maxDecimals', { count: 2 }));

export const productFormSchema = z.object({
  codigo: requiredText(2, 40),
  nome: requiredText(2, 180),
  categoria: z.nativeEnum(ProductCategory, {
    errorMap: () => ({ message: i18n.t('validation:selectOption') }),
  }),
  marca: optionalText(80),
  unidade: z.nativeEnum(UnitOfMeasure, {
    errorMap: () => ({ message: i18n.t('validation:selectOption') }),
  }),
  leadTimeDays: optionalNumber(0).refine(
    (v) => v === '' || v === undefined || Number.isInteger(v),
    i18n.t('validation:integer'),
  ),
  observacoes: optionalText(1000),
  primarySupplierId: z.string().optional(),
  alternativeSupplierIds: z.array(z.string()),
  initialPrice: z.union([z.literal(''), priceSchema]).optional(),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

/** Corpo de `POST/PATCH /products`. */
export interface ProductPayload {
  codigo: string;
  nome: string;
  categoria: ProductCategory;
  marca?: string;
  unidade: UnitOfMeasure;
  leadTimeDays?: number;
  observacoes?: string;
  primarySupplierId?: string;
  alternativeSupplierIds?: string[];
  initialPrice?: number;
}

export function toFormInput(product: ProductDetailDto): ProductFormInput {
  return {
    codigo: product.codigo,
    nome: product.nome,
    categoria: product.categoria,
    marca: product.marca ?? '',
    unidade: product.unidade,
    leadTimeDays: product.leadTimeDays ?? '',
    observacoes: product.observacoes ?? '',
    primarySupplierId: product.primarySupplier?.id ?? '',
    alternativeSupplierIds: product.alternativeSuppliers.map((s) => s.id),
    initialPrice: '',
  };
}

export function fromFormInput(input: ProductFormInput, { isEdit }: { isEdit: boolean }) {
  const payload: ProductPayload = {
    codigo: input.codigo,
    nome: input.nome,
    categoria: input.categoria,
    marca: emptyToUndefined(input.marca),
    unidade: input.unidade,
    leadTimeDays: toOptionalNumber(input.leadTimeDays),
    observacoes: emptyToUndefined(input.observacoes),
    primarySupplierId: emptyToUndefined(input.primarySupplierId),
    // Um fornecedor não pode ser principal e alternativo ao mesmo tempo.
    alternativeSupplierIds: input.alternativeSupplierIds.filter(
      (id) => id !== input.primarySupplierId,
    ),
  };
  // Preço inicial só existe no cadastro — na edição o histórico é alimentado
  // pelo diálogo "Registrar preço".
  if (!isEdit) payload.initialPrice = toOptionalNumber(input.initialPrice);
  return payload;
}
