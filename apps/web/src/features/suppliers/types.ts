import { z } from 'zod';
import {
  BRAZILIAN_STATES,
  ContactType,
  isValidCnpj,
  SupplierCategory,
  type SupplierDetailDto,
} from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { cnpjSchema, emptyToUndefined, optionalText, requiredText } from '@/validators/common';

export type {
  SupplierDetailDto,
  SupplierSummaryDto,
  SupplierStatsDto,
  SupplierDocumentDto,
  SupplierEvaluationDto,
} from '@falcao-erp/shared-types';
import { MAX_UPLOAD_BYTES as UPLOAD_LIMIT_BYTES } from '@/constants/uploads';

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoria?: string;
  estado?: string;
  cidade?: string;
  isActive?: boolean;
  /** Só cadastros feitos pelo próprio fornecedor aguardando revisão. */
  cadastroPendente?: boolean;
}

export interface SupplierFilters {
  busca?: string;
  categoria?: SupplierCategory;
  estado?: string;
}

export const supplierContactSchema = z.object({
  type: z.nativeEnum(ContactType),
  label: requiredText(1, 60),
  value: requiredText(3, 120),
});

export const supplierFormSchema = z.object({
  razaoSocial: requiredText(3, 180),
  nomeFantasia: requiredText(2, 180),
  cnpj: cnpjSchema,
  inscricaoEstadual: optionalText(30),
  categoria: z.nativeEnum(SupplierCategory, {
    errorMap: () => ({ message: i18n.t('validation:selectOption') }),
  }),
  cidade: requiredText(2, 120),
  estado: z.enum(BRAZILIAN_STATES, {
    errorMap: () => ({ message: i18n.t('validation:selectOption') }),
  }),
  responsavel: requiredText(2, 120),
  atividades: optionalText(2000),
  atividadesZh: optionalText(2000),
  produtosServicos: optionalText(4000),
  produtosServicosZh: optionalText(4000),
  contacts: z.array(supplierContactSchema).min(1, i18n.t('suppliers:validation.contactsRequired')),
});

export type SupplierFormInput = z.infer<typeof supplierFormSchema>;

/** Corpo de `POST/PATCH /suppliers`. */
export type SupplierPayload = Omit<SupplierFormInput, 'inscricaoEstadual'> & {
  inscricaoEstadual?: string;
};

export function toFormInput(supplier: SupplierDetailDto): SupplierFormInput {
  return {
    razaoSocial: supplier.razaoSocial,
    nomeFantasia: supplier.nomeFantasia,
    cnpj: supplier.cnpj,
    inscricaoEstadual: supplier.inscricaoEstadual ?? '',
    categoria: supplier.categoria,
    cidade: supplier.cidade,
    estado: supplier.estado,
    responsavel: supplier.responsavel,
    atividades: supplier.atividades ?? '',
    atividadesZh: supplier.atividadesZh ?? '',
    produtosServicos: supplier.produtosServicos ?? '',
    produtosServicosZh: supplier.produtosServicosZh ?? '',
    contacts: supplier.contacts.map(({ type, label, value }) => ({ type, label, value })),
  };
}

export function fromFormInput(input: SupplierFormInput): SupplierPayload {
  return { ...input, inscricaoEstadual: emptyToUndefined(input.inscricaoEstadual) };
}

/** Limite de upload da API (`addMaxSizeValidator` nos controllers). */
export const MAX_UPLOAD_BYTES = UPLOAD_LIMIT_BYTES;

/**
 * Cadastro feito pelo próprio fornecedor pelo link da empresa. Produtos e
 * serviços são obrigatórios em pelo menos um idioma (português ou chinês).
 * É uma função (e não uma constante) para as mensagens acompanharem o idioma
 * que o fornecedor escolher na página.
 */
export function makeSupplierSignupSchema() {
  return z
    .object({
      cnpj: z
        .string()
        .trim()
        .min(1, i18n.t('validation:required'))
        .refine(isValidCnpj, i18n.t('validation:cnpj')),
      razaoSocial: requiredText(3, 180),
      nomeFantasia: requiredText(2, 180),
      inscricaoEstadual: optionalText(30),
      categoria: z.nativeEnum(SupplierCategory, {
        errorMap: () => ({ message: i18n.t('validation:selectOption') }),
      }),
      cidade: requiredText(2, 120),
      estado: z.enum(BRAZILIAN_STATES, {
        errorMap: () => ({ message: i18n.t('validation:selectOption') }),
      }),
      responsavel: requiredText(2, 120),
      email: z.string().trim().email(i18n.t('validation:email')),
      telefone: requiredText(8, 30),
      atividades: optionalText(2000),
      atividadesZh: optionalText(2000),
      produtosServicos: optionalText(4000),
      produtosServicosZh: optionalText(4000),
    })
    .refine(
      (value) => Boolean(value.produtosServicos?.trim() || value.produtosServicosZh?.trim()),
      {
        path: ['produtosServicos'],
        message: i18n.t('suppliers:signup.productsRequired'),
      },
    );
}

export type SupplierSignupInput = z.infer<ReturnType<typeof makeSupplierSignupSchema>>;
export type SupplierSignupPayload = SupplierSignupInput;
