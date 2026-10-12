import type { DeadlineState } from "./dates";
import type { ContractStatus } from "./enums";

export interface ContractAmendmentDto {
  id: string;
  numero: number;
  descricao: string;
  valorDelta: string | null;
  novaDataFim: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface ContractSummaryDto {
  id: string;
  numero: string;
  objeto: string;
  supplierId: string;
  supplierName: string;
  costCenter: string | null;
  valorTotal: string;
  dataInicio: string;
  dataFim: string;
  status: ContractStatus;
  alertaDias: number;
  /** Só faz sentido para contratos vigentes; `null` nos demais status. */
  prazo: DeadlineState | null;
  diasRestantes: number;
  amendmentCount: number;
}

export interface ContractDocumentRefDto {
  id: string;
  titulo: string;
  fileName: string;
  size: number;
  url: string;
  uploadedByName: string;
  createdAt: string;
}

export interface ContractDetailDto extends ContractSummaryDto {
  descricao: string | null;
  assinadoEm: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  amendments: ContractAmendmentDto[];
  documents: ContractDocumentRefDto[];
  /** Soma das contas a pagar vinculadas (não canceladas). */
  totalLancado: string;
  totalPago: string;
}

export interface ContractStatsDto {
  vigentes: number;
  vencendo: number;
  vencidos: number;
  valorVigente: string;
  byStatus: Array<{ status: ContractStatus; count: number }>;
}
