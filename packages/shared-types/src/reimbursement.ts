import type { ExpenseCategory, ReimbursementStatus } from "./enums";

export interface ReimbursementItemDto {
  id: string;
  data: string;
  categoria: ExpenseCategory;
  descricao: string;
  valor: string;
}

export interface ReimbursementAttachmentDto {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  url: string;
}

export interface ReimbursementSummaryDto {
  id: string;
  titulo: string;
  status: ReimbursementStatus;
  costCenter: string | null;
  requesterId: string;
  requesterName: string;
  total: string;
  itemCount: number;
  createdAt: string;
}

export interface ReimbursementDetailDto extends ReimbursementSummaryDto {
  decidedByName: string | null;
  decidedAt: string | null;
  decisionComment: string | null;
  updatedAt: string;
  items: ReimbursementItemDto[];
  attachments: ReimbursementAttachmentDto[];
  /** Conta a pagar gerada na aprovação. */
  payable: { id: string; status: string; vencimento: string; pagoEm: string | null } | null;
}

export interface ReimbursementStatsDto {
  byStatus: Array<{ status: ReimbursementStatus; count: number; total: string }>;
  /** Aguardando decisão de quem consulta (gestor/admin); 0 para os demais. */
  pendingMyDecision: number;
}
