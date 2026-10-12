import { z } from 'zod';
import type { DocumentCategory, DocumentDto, DocumentValidity } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import {
  emptyToUndefined,
  optionalDateOnly,
  optionalText,
  requiredText,
} from '@/validators/common';

export type { DocumentDto, DocumentStatsDto, DocumentValidity } from '@falcao-erp/shared-types';

export interface DocumentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoria?: DocumentCategory;
  tag?: string;
  validade?: DocumentValidity;
  supplierId?: string;
  contractId?: string;
}

export interface DocumentFilters {
  busca?: string;
  categoria?: DocumentCategory;
  tag?: string;
  validade?: DocumentValidity;
}

/** Limite de upload da API (`addMaxSizeValidator` no `DocumentsController`). */
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export const documentFormSchema = z.object({
  titulo: requiredText(2, 180),
  descricao: optionalText(2000),
  categoria: z.string().min(1, i18n.t('validation:selectOption')),
  /** Separadas por vírgula. */
  tags: optionalText(500),
  validoAte: optionalDateOnly,
  supplierId: z.string().optional(),
  contractId: z.string().optional(),
});

export type DocumentFormInput = z.infer<typeof documentFormSchema>;

export function splitTags(value: string | undefined): string[] {
  return [
    ...new Set(
      (value ?? '')
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function emptyDocumentForm(preset?: Partial<DocumentFormInput>): DocumentFormInput {
  return {
    titulo: '',
    descricao: '',
    categoria: '',
    tags: '',
    validoAte: '',
    supplierId: '',
    contractId: '',
    ...preset,
  };
}

export function toDocumentForm(document: DocumentDto): DocumentFormInput {
  return {
    titulo: document.titulo,
    descricao: document.descricao ?? '',
    categoria: document.categoria,
    tags: document.tags.join(', '),
    validoAte: document.validoAte ?? '',
    supplierId: document.supplierId ?? '',
    contractId: document.contractId ?? '',
  };
}

/** Multipart de `POST /documents`. */
export function toUploadFormData(input: DocumentFormInput, file: File): FormData {
  const form = new FormData();
  form.append('file', file);
  form.append('titulo', input.titulo);
  form.append('categoria', input.categoria);
  const optional = {
    descricao: emptyToUndefined(input.descricao),
    tags: splitTags(input.tags).join(','),
    validoAte: emptyToUndefined(input.validoAte),
    supplierId: emptyToUndefined(input.supplierId),
    contractId: emptyToUndefined(input.contractId),
  };
  for (const [key, value] of Object.entries(optional)) if (value) form.append(key, value);
  return form;
}

/** Corpo de `PATCH /documents/:id` — `null` remove o valor. */
export interface DocumentUpdatePayload {
  titulo: string;
  descricao: string | null;
  categoria: DocumentCategory;
  tags: string[];
  validoAte: string | null;
  supplierId: string | null;
  contractId: string | null;
}

export function toUpdatePayload(input: DocumentFormInput): DocumentUpdatePayload {
  return {
    titulo: input.titulo,
    descricao: input.descricao || null,
    categoria: input.categoria as DocumentCategory,
    tags: splitTags(input.tags),
    validoAte: input.validoAte || null,
    supplierId: input.supplierId || null,
    contractId: input.contractId || null,
  };
}
