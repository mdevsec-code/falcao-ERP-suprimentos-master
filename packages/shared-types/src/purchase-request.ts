import type { ApprovalAction, ApprovalStep, PurchaseRequestStatus, SignatureDecision } from "./enums";

export interface PurchaseRequestItemDto {
  id: string;
  productId: string | null;
  productName: string | null;
  description: string;
  quantity: string;
  unit: string;
  estimatedPrice: string | null;
  marca: string | null;
  referencia: string | null;
  especificacao: string | null;
  /** Peso total do item, em kg. */
  pesoTotal: string | null;
  localUso: string | null;
  setorSolicitante: string | null;
  /** Data em que precisa chegar (AAAA-MM-DD). */
  dataNecessaria: string | null;
  /** Caminho da foto enviada para o item (para reenviar ao editar). */
  photoPath: string | null;
  /** Foto a exibir: a do item ou, sem ela, a do produto do catálogo. */
  photoUrl: string | null;
}

export interface PurchaseRequestApprovalDto {
  id: string;
  action: ApprovalAction;
  fromStatus: PurchaseRequestStatus;
  toStatus: PurchaseRequestStatus;
  comment: string | null;
  approverId: string;
  approverName: string;
  createdAt: string;
}

export interface PurchaseRequestCommentDto {
  id: string;
  message: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface PurchaseRequestAttachmentDto {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  url: string;
}

export interface PurchaseRequestSummaryDto {
  id: string;
  /** Nº sequencial por empresa (o do plano de aquisição). */
  numero: number;
  title: string;
  status: PurchaseRequestStatus;
  /** Etapa de assinatura atual — só enquanto aguarda aprovação. */
  currentStep: ApprovalStep | null;
  costCenter: string | null;
  requesterId: string;
  requesterName: string;
  itemCount: number;
  estimatedTotal: string | null;
  createdAt: string;
}

/** Assinatura digital de uma etapa do plano de aquisição. */
export interface PurchaseRequestSignatureDto {
  step: ApprovalStep;
  decision: SignatureDecision;
  signerId: string;
  signerName: string;
  /** PNG da assinatura desenhada (data URL). */
  signatureData: string;
  comment: string | null;
  signedAt: string;
}

/** Quadro de assinaturas: uma linha por etapa, na ordem. */
export interface PurchaseRequestApprovalStepDto {
  step: ApprovalStep;
  /** Quem pode assinar esta etapa (configuração da empresa). */
  approvers: Array<{ id: string; name: string }>;
  signature: PurchaseRequestSignatureDto | null;
  /** É a etapa da vez. */
  current: boolean;
}

export interface PurchaseRequestDetailDto extends PurchaseRequestSummaryDto {
  justification: string | null;
  requesterContact: string | null;
  approvalSteps: PurchaseRequestApprovalStepDto[];
  /** O usuário que consultou pode assinar a etapa atual. */
  canSign: boolean;
  updatedAt: string;
  items: PurchaseRequestItemDto[];
  approvals: PurchaseRequestApprovalDto[];
  comments: PurchaseRequestCommentDto[];
  attachments: PurchaseRequestAttachmentDto[];
}

export interface PurchaseRequestStatsDto {
  total: number;
  byStatus: Array<{ status: PurchaseRequestStatus; count: number }>;
  pendingMyApproval: number;
}

export type TimelineEntryType = "CREATED" | "UPDATED" | "APPROVAL" | "COMMENT";

export interface PurchaseRequestTimelineEntryDto {
  type: TimelineEntryType;
  id: string;
  authorName: string;
  createdAt: string;
  action?: ApprovalAction;
  fromStatus?: PurchaseRequestStatus;
  toStatus?: PurchaseRequestStatus;
  message?: string;
}

/** Quem assina cada etapa — tela de configuração dos aprovadores. */
export interface ApprovalStepConfigDto {
  step: ApprovalStep;
  approvers: Array<{ id: string; name: string; email: string; role: string }>;
}
