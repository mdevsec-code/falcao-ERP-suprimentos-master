import type { DeadlineState } from "./dates";
import type { DocumentCategory } from "./enums";

/** Dias antes do vencimento em que um documento passa a "vencendo". */
export const DOCUMENT_ALERT_DAYS = 30;

export type DocumentValidity = DeadlineState | "SEM_VALIDADE";

export interface DocumentDto {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: DocumentCategory;
  tags: string[];
  validoAte: string | null;
  validade: DocumentValidity;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  /** Arquivo de texto indexado para a busca por conteúdo. */
  conteudoIndexado: boolean;
  supplierId: string | null;
  supplierName: string | null;
  contractId: string | null;
  contractNumero: string | null;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStatsDto {
  total: number;
  vencidos: number;
  vencendo: number;
  byCategory: Array<{ categoria: DocumentCategory; count: number }>;
}
