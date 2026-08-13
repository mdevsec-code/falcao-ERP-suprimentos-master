import type { ApprovalAction, PurchaseRequestStatus } from "./enums";

export interface PurchaseRequestItemDto {
  id: string;
  productId: string | null;
  productName: string | null;
  description: string;
  quantity: string;
  unit: string;
  estimatedPrice: string | null;
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
  title: string;
  status: PurchaseRequestStatus;
  costCenter: string | null;
  requesterId: string;
  requesterName: string;
  itemCount: number;
  estimatedTotal: string | null;
  createdAt: string;
}

export interface PurchaseRequestDetailDto extends PurchaseRequestSummaryDto {
  justification: string | null;
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
