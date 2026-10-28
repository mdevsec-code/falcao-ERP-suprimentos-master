import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  ALLOWED_TRANSITIONS,
  APPROVAL_STEPS,
  resolveApprovalAction,
  ROLES_BY_CURRENT_STATUS,
} from "@falcao-erp/shared-types";
import type {
  ApprovalStep,
  ApprovalStepConfigDto,
  PaginatedResult,
  PurchaseRequestDetailDto,
  PurchaseRequestSummaryDto,
  PurchaseRequestTimelineEntryDto,
  Role,
} from "@falcao-erp/shared-types";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { toDateOnlyOrNull } from "../../common/utils/date-only";
import { decodeUploadName } from "../../common/utils/file-name";
import { STORAGE_PROVIDER, type IStorageProvider } from "../storage/storage-provider.interface";
import { AddCommentDto } from "./dto/add-comment.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { QueryPurchaseRequestsDto } from "./dto/query-purchase-requests.dto";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";
import {
  canRemovePurchaseRequestAttachment,
  canViewPurchaseRequest,
  seesOnlyOwnRequests,
} from "./purchase-request-access";
import { PurchaseRequestApprovalsService } from "./purchase-request-approvals.service";
import {
  PurchaseRequestsRepository,
  type PurchaseRequestDetailPayload,
  type PurchaseRequestListItemPayload,
} from "./purchase-requests.repository";

/** Fotos de item: só imagens que o navegador e o PDF mostram. */
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly repository: PurchaseRequestsRepository,
    private readonly approvals: PurchaseRequestApprovalsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async list(user: AuthenticatedUser, query: QueryPurchaseRequestsDto): Promise<PaginatedResult<PurchaseRequestSummaryDto>> {
    const pendingMine = query.pendingMySignature === "true";
    const { data, total } = await this.repository.findMany(user.companyId, {
      search: query.search,
      status: pendingMine ? "AGUARDANDO_APROVACAO" : query.status,
      requesterId: seesOnlyOwnRequests(user) && !pendingMine ? user.userId : undefined,
      currentSteps: pendingMine ? await this.approvals.signableSteps(user) : undefined,
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

  /**
   * A solicitação, se o usuário pode vê-la (`canViewPurchaseRequest`). Toda rota
   * com `:id` passa por aqui; quem não pode ver recebe o mesmo 404 de um id inexistente.
   */
  async findVisibleOrThrow(user: AuthenticatedUser, id: string): Promise<PurchaseRequestDetailPayload> {
    const request = await this.repository.findByIdOrThrow(user.companyId, id);
    const signableSteps = seesOnlyOwnRequests(user) ? await this.approvals.signableSteps(user) : [];
    const visible = canViewPurchaseRequest(
      user,
      {
        requesterId: request.requesterId,
        status: request.status,
        currentStep: request.currentStep,
        signerIds: request.signatures.map((signature) => signature.userId),
      },
      signableSteps,
    );
    if (!visible) throw new NotFoundException("Solicitação não encontrada.");
    return request;
  }

  async getById(user: AuthenticatedUser, id: string): Promise<PurchaseRequestDetailDto> {
    const request = await this.findVisibleOrThrow(user, id);
    return this.toDetailDto(request, user);
  }

  async getTimeline(user: AuthenticatedUser, id: string): Promise<PurchaseRequestTimelineEntryDto[]> {
    const request = await this.findVisibleOrThrow(user, id);
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

  async create(user: AuthenticatedUser, dto: CreatePurchaseRequestDto): Promise<PurchaseRequestDetailDto> {
    this.assertOwnPhotos(user.companyId, dto.items);
    const request = await this.repository.create(user.companyId, user.userId, dto);
    // Começa a corrida de assinaturas: e-mail para quem assina a primeira etapa.
    void this.approvals.notifyStep(request, "TECNICO");
    return this.toDetailDto(request, user);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdatePurchaseRequestDto): Promise<PurchaseRequestDetailDto> {
    const existing = await this.findVisibleOrThrow(user, id);
    const isOwner = existing.requesterId === user.userId;
    if (existing.status !== "AGUARDANDO_APROVACAO") {
      throw new BadRequestException("Só é possível editar solicitações aguardando aprovação.");
    }
    if (existing.signatures.length > 0) {
      throw new BadRequestException("A solicitação já foi assinada por uma etapa e não pode mais ser alterada.");
    }
    if (!isOwner && user.role !== "ADMIN") {
      throw new ForbiddenException("Você só pode editar suas próprias solicitações.");
    }
    if (dto.items) this.assertOwnPhotos(user.companyId, dto.items);

    const request = await this.repository.update(user.companyId, id, dto);
    return this.toDetailDto(request, user);
  }

  async transition(
    user: AuthenticatedUser,
    id: string,
    dto: ChangeStatusDto,
  ): Promise<PurchaseRequestDetailDto> {
    const existing = await this.findVisibleOrThrow(user, id);
    const from = existing.status;

    const allowedTargets = ALLOWED_TRANSITIONS[from];
    if (!allowedTargets.includes(dto.status)) {
      throw new BadRequestException(
        from === "AGUARDANDO_APROVACAO"
          ? "A aprovação é feita pelas assinaturas de cada etapa."
          : `Não é possível mover de "${from}" para "${dto.status}".`,
      );
    }

    const allowedRoles = ROLES_BY_CURRENT_STATUS[from];
    if (user.role !== "ADMIN" && !allowedRoles.includes(user.role as Role)) {
      throw new ForbiddenException("Você não tem permissão para alterar o status nesta etapa.");
    }

    const action = resolveApprovalAction(from, dto.status);
    const request = await this.repository.transition(user.companyId, id, user.userId, {
      ...dto,
      fromStatus: from,
      action,
    });
    return this.toDetailDto(request, user);
  }

  /** Foto do item, enviada antes de salvar a solicitação; o item guarda só o caminho. */
  async uploadItemPhoto(
    companyId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer; size: number },
  ): Promise<{ path: string; url: string }> {
    const extension = PHOTO_TYPES[file.mimetype];
    if (!extension) throw new BadRequestException("Envie a foto em JPG, PNG ou WebP.");
    const stored = await this.storage.save(file.buffer, {
      folder: `item-photos/${companyId}`,
      fileName: `foto${extension}`,
    });
    return { path: stored.path, url: stored.url };
  }

  async addComment(user: AuthenticatedUser, purchaseRequestId: string, dto: AddCommentDto) {
    await this.findVisibleOrThrow(user, purchaseRequestId);
    const comment = await this.repository.addComment(user.companyId, purchaseRequestId, user.userId, dto.message);
    return {
      id: comment.id,
      message: comment.message,
      authorId: comment.authorId,
      authorName: comment.author.name,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async addAttachment(
    user: AuthenticatedUser,
    purchaseRequestId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    // Confere a solicitação (e se o usuário a vê) ANTES de gravar: a pasta usa o id da URL.
    await this.findVisibleOrThrow(user, purchaseRequestId);
    const fileName = decodeUploadName(file.originalname);
    const stored = await this.storage.save(file.buffer, {
      folder: `purchase-requests/${purchaseRequestId}`,
      fileName,
    });

    const attachment = await this.repository.addAttachment(user.companyId, purchaseRequestId, {
      fileName,
      filePath: stored.path,
      mimeType: file.mimetype,
      size: stored.size,
      uploadedById: user.userId,
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

  async removeAttachment(user: AuthenticatedUser, purchaseRequestId: string, attachmentId: string) {
    const request = await this.findVisibleOrThrow(user, purchaseRequestId);
    const attachment = await this.repository.findAttachmentOrThrow(user.companyId, purchaseRequestId, attachmentId);
    if (!canRemovePurchaseRequestAttachment(user, request, attachment)) {
      throw new ForbiddenException("Você só pode remover anexos que enviou ou da sua própria solicitação.");
    }
    await this.repository.removeAttachment(attachmentId);
    await this.storage.delete(attachment.filePath);
  }

  async stats(user: AuthenticatedUser) {
    return this.repository.stats(user.companyId, user.role, await this.approvals.signableSteps(user));
  }

  /** Foto de item de outra empresa não entra: o caminho tem o id da empresa. */
  private assertOwnPhotos(companyId: string, items: Array<{ photoPath?: string }>): void {
    for (const item of items) {
      if (item.photoPath && !item.photoPath.startsWith(`item-photos/${companyId}/`)) {
        throw new BadRequestException("Foto do item inválida — envie a foto novamente.");
      }
    }
  }

  private itemsEstimatedTotal(items: Array<{ quantity: unknown; estimatedPrice: unknown }>): string | null {
    const total = items.reduce((sum, item) => {
      const price = item.estimatedPrice ? Number(item.estimatedPrice) : 0;
      const quantity = Number(item.quantity);
      return sum + price * quantity;
    }, 0);
    return items.some((item) => item.estimatedPrice) ? total.toFixed(2) : null;
  }

  private toSummaryDto(request: PurchaseRequestListItemPayload | PurchaseRequestDetailPayload): PurchaseRequestSummaryDto {
    return {
      id: request.id,
      numero: request.numero,
      title: request.title,
      status: request.status,
      currentStep: request.currentStep,
      costCenter: request.costCenter,
      requesterId: request.requesterId,
      requesterName: request.requester.name,
      itemCount: request.items.length,
      estimatedTotal: this.itemsEstimatedTotal(request.items),
      createdAt: request.createdAt.toISOString(),
    };
  }

  private async toDetailDto(request: PurchaseRequestDetailPayload, user: AuthenticatedUser): Promise<PurchaseRequestDetailDto> {
    const [config, signable] = await Promise.all([
      this.approvals.stepsConfig(user.companyId),
      this.approvals.signableSteps(user),
    ]);
    const approversOf = (step: ApprovalStep) =>
      (config.find((row: ApprovalStepConfigDto) => row.step === step)?.approvers ?? []).map(({ id, name }) => ({ id, name }));

    return {
      ...this.toSummaryDto(request),
      justification: request.justification,
      requesterContact: request.requesterContact,
      updatedAt: request.updatedAt.toISOString(),
      canSign:
        request.status === "AGUARDANDO_APROVACAO" && !!request.currentStep && signable.includes(request.currentStep),
      approvalSteps: APPROVAL_STEPS.map((step) => {
        const signature = request.signatures.find((row) => row.step === step);
        return {
          step,
          approvers: approversOf(step),
          current: request.status === "AGUARDANDO_APROVACAO" && request.currentStep === step,
          signature: signature
            ? {
                step,
                decision: signature.decision,
                signerId: signature.userId,
                signerName: signature.signerName,
                signatureData: signature.signatureData,
                comment: signature.comment,
                signedAt: signature.signedAt.toISOString(),
              }
            : null,
        };
      }),
      items: request.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.nome ?? null,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        estimatedPrice: item.estimatedPrice?.toString() ?? null,
        marca: item.marca,
        referencia: item.referencia,
        especificacao: item.especificacao,
        pesoTotal: item.pesoTotal?.toString() ?? null,
        localUso: item.localUso,
        setorSolicitante: item.setorSolicitante,
        dataNecessaria: toDateOnlyOrNull(item.dataNecessaria),
        photoPath: item.photoPath,
        photoUrl: item.photoPath
          ? `/uploads/${item.photoPath}`
          : item.product?.photoPath
            ? `/uploads/${item.product.photoPath}`
            : null,
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
