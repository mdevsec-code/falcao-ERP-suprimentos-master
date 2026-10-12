import { z } from 'zod';
import type { ContractDetailDto, ContractStatus } from '@falcao-erp/shared-types';

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
  ContractAmendmentDto,
  ContractDetailDto,
  ContractDocumentRefDto,
  ContractStatsDto,
  ContractSummaryDto,
} from '@falcao-erp/shared-types';

export interface ContractListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ContractStatus;
  supplierId?: string;
  prazo?: 'VENCENDO' | 'VENCIDO';
}

export interface ContractFilters {
  busca?: string;
  status?: ContractStatus;
  prazo?: 'VENCENDO' | 'VENCIDO';
}

export const contractFormSchema = z
  .object({
    numero: requiredText(1, 40),
    objeto: requiredText(3, 200),
    supplierId: z.string().min(1, i18n.t('validation:selectOption')),
    descricao: optionalText(4000),
    costCenter: optionalText(60),
    valorTotal: moneySchema(0),
    dataInicio: dateOnlySchema,
    dataFim: dateOnlySchema,
    assinadoEm: optionalDateOnly,
    alertaDias: z.coerce
      .number({ invalid_type_error: i18n.t('validation:number') })
      .int(i18n.t('validation:integer'))
      .min(0, i18n.t('validation:minValue', { count: 0 }))
      .max(365, i18n.t('validation:maxValue', { count: 365 })),
  })
  .refine((v) => !v.dataInicio || !v.dataFim || v.dataFim >= v.dataInicio, {
    path: ['dataFim'],
    message: i18n.t('validation:dateOrder'),
  });

export type ContractFormInput = z.infer<typeof contractFormSchema>;

/** Corpo de `POST/PATCH /contracts`. */
export interface ContractPayload {
  numero: string;
  objeto: string;
  supplierId: string;
  descricao?: string;
  costCenter?: string;
  valorTotal: number;
  dataInicio: string;
  dataFim: string;
  assinadoEm?: string;
  alertaDias: number;
}

export function emptyContractForm(): ContractFormInput {
  return {
    numero: '',
    objeto: '',
    supplierId: '',
    descricao: '',
    costCenter: '',
    valorTotal: '' as unknown as number,
    dataInicio: '',
    dataFim: '',
    assinadoEm: '',
    alertaDias: 30,
  };
}

export function toContractForm(contract: ContractDetailDto): ContractFormInput {
  return {
    numero: contract.numero,
    objeto: contract.objeto,
    supplierId: contract.supplierId,
    descricao: contract.descricao ?? '',
    costCenter: contract.costCenter ?? '',
    valorTotal: Number(contract.valorTotal),
    dataInicio: contract.dataInicio,
    dataFim: contract.dataFim,
    assinadoEm: contract.assinadoEm ?? '',
    alertaDias: contract.alertaDias,
  };
}

export function fromContractForm(input: ContractFormInput): ContractPayload {
  return {
    numero: input.numero,
    objeto: input.objeto,
    supplierId: input.supplierId,
    descricao: emptyToUndefined(input.descricao),
    costCenter: emptyToUndefined(input.costCenter),
    valorTotal: Number(input.valorTotal),
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    assinadoEm: emptyToUndefined(input.assinadoEm),
    alertaDias: Number(input.alertaDias),
  };
}

export const amendmentFormSchema = z
  .object({
    descricao: requiredText(3, 2000),
    valorDelta: z
      .union([z.literal(''), z.coerce.number({ invalid_type_error: i18n.t('validation:number') })])
      .optional(),
    novaDataFim: optionalDateOnly,
  })
  .refine((v) => (v.valorDelta !== '' && v.valorDelta !== undefined) || !!v.novaDataFim, {
    path: ['valorDelta'],
    message: i18n.t('contracts:amendments.validation.changeRequired'),
  });

export type AmendmentFormInput = z.infer<typeof amendmentFormSchema>;

export interface AmendmentPayload {
  descricao: string;
  valorDelta?: number;
  novaDataFim?: string;
}

export function fromAmendmentForm(input: AmendmentFormInput): AmendmentPayload {
  return {
    descricao: input.descricao,
    valorDelta:
      input.valorDelta === '' || input.valorDelta === undefined
        ? undefined
        : Number(input.valorDelta),
    novaDataFim: emptyToUndefined(input.novaDataFim),
  };
}
