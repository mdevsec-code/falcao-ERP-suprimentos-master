import { BadRequestException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import {
  ALLOWED_TRANSITIONS,
  resolveApprovalAction,
  ROLES_BY_CURRENT_STATUS,
} from "@falcao-erp/shared-types";
import type {
  PaginatedResult,
  PurchaseRequestDetailDto,
  PurchaseRequestSummaryDto,
  PurchaseRequestTimelineEntryDto,
  Role,
} from "@falcao-erp/shared-types";
import { STORAGE_PROVIDER, type IStorageProvider } from "../storage/storage-provider.interface";
import { AddCommentDto } from "./dto/add-comment.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { QueryPurchaseRequestsDto } from "./dto/query-purchase-requests.dto";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";
import {
  PurchaseRequestsRepository,
  type PurchaseRequestDetailPayload,
  type PurchaseRequestListItemPayload,
} from "./purchase-requests.repository";

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly repository: PurchaseRequestsRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async list(
    companyId: string,
    userId: string,
    userRole: Role,
    query: QueryPurchaseRequestsDto,
  ): Promise<PaginatedResult<PurchaseRequestSummaryDto>> {
    const { data, total } = await this.repository.findMany(companyId, {
      search: query.search,
      status: query.status,
      requesterId: userRole === "REQUESTER" ? userId : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data: data.map((request) => this.toSummaryDto(request)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getById(companyId: string, id: string): Promise<PurchaseRequestDetailDto> {
    const request = await this.repository.findByIdOrThrow(companyId, id);
    return this.toDetailDto(request);
  }

  async getTimeline(companyId: string, id: string): Promise<PurchaseRequestTimelineEntryDto[]> {
    const request = await this.repository.findByIdOrThrow(companyId, id);
    const entries: PurchaseRequestTimelineEntryDto[] = [
      {
        type: "CREATED",
        id: `created-${request.id}`,
        authorName: request.requester.name,
        createdAt: request.createdAt.toISOString(),
      },
      ...request.approvals.map((approval) => ({
        type: "APPROVAL" as const,
        id: approval.id,
        authorName: approval.approver.name,
        createdAt: approval.createdAt.toISOString(),
        action: approval.action,
        fromStatus: approval.fromStatus,
        toStatus: approval.toStatus,
        message: approval.comment ?? undefined,
      })),
      ...request.comments.map((comment) => ({
        type: "COMMENT" as const,
        id: comment.id,
        authorName: comment.author.name,
        createdAt: comment.createdAt.toISOString(),
        message: comment.message,
      })),
    ];

    return entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async create(companyId: string, requesterId: string, dto: CreatePurchaseRequestDto) {
    const request = await this.repository.create(companyId, requesterId, dto);
    return this.toDetailDto(request);
  }

  async update(companyId: string, id: string, userId: string, userRole: Role, dto: UpdatePurchaseRequestDto) {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    const isOwner = existing.requesterId === userId;
    if (existing.status !== "AGUARDANDO_APROVACAO") {
      throw new BadRequestException("Só é possível editar solicitações aguardando aprovação.");
    }
    if (!isOwner && userRole !== "ADMIN") {
      throw new ForbiddenException("Você só pode editar suas próprias solicitações.");
    }

    const request = await this.repository.update(companyId, id, dto);
    return this.toDetailDto(request);
  }

  async transition(
    companyId: string,
    id: string,
    approverId: string,
    userRole: Role,
    dto: ChangeStatusDto,
  ): Promise<PurchaseRequestDetailDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    const from = existing.status;

    const allowedTargets = ALLOWED_TRANSITIONS[from];
    if (!allowedTargets.includes(dto.status)) {
      throw new BadRequestException(
        `Não é possível mover de "${from}" para "${dto.status}".`,
      );
    }

    const allowedRoles = ROLES_BY_CURRENT_STATUS[from];
    if (userRole !== "ADMIN" && !allowedRoles.includes(userRole)) {
      throw new ForbiddenException("Você não tem permissão para alterar o status nesta etapa.");
    }

    const action = resolveApprovalAction(from, dto.status);
    const request = await this.repository.transition(companyId, id, approverId, {
      ...dto,
      fromStatus: from,
      action,
    });
    return this.toDetailDto(request);
  }

  async addComment(companyId: string, purchaseRequestId: string, authorId: string, dto: AddCommentDto) {
    const comment = await this.repository.addComment(companyId, purchaseRequestId, authorId, dto.message);
    return {
      id: comment.id,
      message: comment.message,
      authorId: comment.authorId,
      authorName: comment.author.name,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async addAttachment(
    companyId: string,
    purchaseRequestId: string,
    uploadedById: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    const stored = await this.storage.save(file.buffer, {
      folder: `purchase-requests/${purchaseRequestId}`,
      fileName: file.originalname,
    });

    const attachment = await this.repository.addAttachment(companyId, purchaseRequestId, {
      fileName: file.originalname,
      filePath: stored.path,
      mimeType: file.mimetype,
      size: stored.size,
      uploadedById,
    });

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      uploadedById: attachment.uploadedById,
      uploadedByName: attachment.uploadedBy.name,
      uploadedAt: attachment.uploadedAt.toISOString(),
      url: stored.url,
    };
  }

  async removeAttachment(companyId: string, purchaseRequestId: string, attachmentId: string) {
    const attachment = await this.repository.findAttachmentOrThrow(companyId, purchaseRequestId, attachmentId);
    await this.repository.removeAttachment(attachmentId);
    await this.storage.delete(attachment.filePath);
  }

  async stats(companyId: string, userId: string, userRole: Role) {
    return this.repository.stats(companyId, userId, userRole);
  }

  private itemsEstimatedTotal(items: Array<{ quantity: unknown; estimatedPrice: unknown }>): string | null {
    const total = items.reduce((sum, item) => {
      const price = item.estimatedPrice ? Number(item.estimatedPrice) : 0;
      const quantity = Number(item.quantity);
      return sum + price * quantity;
    }, 0);
    return items.some((item) => item.estimatedPrice) ? total.toFixed(2) : null;
  }

  private toSummaryDto(request: PurchaseRequestListItemPayload): PurchaseRequestSummaryDto {
    return {
      id: request.id,
      title: request.title,
      status: request.status,
      costCenter: request.costCenter,
      requesterId: request.requesterId,
      requesterName: request.requester.name,
      itemCount: request.items.length,
      estimatedTotal: this.itemsEstimatedTotal(request.items),
      createdAt: request.createdAt.toISOString(),
    };
  }

  private toDetailDto(request: PurchaseRequestDetailPayload): PurchaseRequestDetailDto {
    return {
      id: request.id,
      title: request.title,
      status: request.status,
      costCenter: request.costCenter,
      requesterId: request.requesterId,
      requesterName: request.requester.name,
      itemCount: request.items.length,
      estimatedTotal: this.itemsEstimatedTotal(request.items),
      justification: request.justification,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      items: request.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.nome ?? null,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        estimatedPrice: item.estimatedPrice?.toString() ?? null,
      })),
      approvals: request.approvals.map((approval) => ({
        id: approval.id,
        action: approval.action,
        fromStatus: approval.fromStatus,
        toStatus: approval.toStatus,
        comment: approval.comment,
        approverId: approval.approverId,
        approverName: approval.approver.name,
        createdAt: approval.createdAt.toISOString(),
      })),
      comments: request.comments.map((comment) => ({
        id: comment.id,
        message: comment.message,
        authorId: comment.authorId,
        authorName: comment.author.name,
        createdAt: comment.createdAt.toISOString(),
      })),
      attachments: request.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        uploadedById: attachment.uploadedById,
        uploadedByName: attachment.uploadedBy.name,
        uploadedAt: attachment.uploadedAt.toISOString(),
        url: `/uploads/${attachment.filePath}`,
      })),
    };
  }
}
