import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ApprovalStep, type PurchaseRequestStatus } from "@prisma/client";
import { fromDateOnly } from "../../common/utils/date-only";
import { PrismaService } from "../../database/prisma.service";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { CreatePurchaseRequestDto, PurchaseRequestItemInputDto } from "./dto/create-purchase-request.dto";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";

export interface PurchaseRequestFilters {
  search?: string;
  status?: PurchaseRequestStatus;
  requesterId?: string;
  /** Só as que estão numa destas etapas de assinatura (fila "aguardando minha assinatura"). */
  currentSteps?: ApprovalStep[];
  page: number;
  pageSize: number;
}

const detailInclude = {
  requester: true,
  items: { include: { product: true } },
  approvals: { include: { approver: true }, orderBy: { createdAt: "desc" as const } },
  comments: { include: { author: true }, orderBy: { createdAt: "asc" as const } },
  attachments: { include: { uploadedBy: true }, orderBy: { uploadedAt: "desc" as const } },
  signatures: { orderBy: { signedAt: "asc" as const } },
} satisfies Prisma.PurchaseRequestInclude;

const listInclude = {
  requester: true,
  items: true,
} satisfies Prisma.PurchaseRequestInclude;

export type PurchaseRequestDetailPayload = Prisma.PurchaseRequestGetPayload<{
  include: typeof detailInclude;
}>;
export type PurchaseRequestListItemPayload = Prisma.PurchaseRequestGetPayload<{
  include: typeof listInclude;
}>;

/** Campos do item como vão para o banco (create e update usam o mesmo). */
function itemData(item: PurchaseRequestItemInputDto) {
  return {
    productId: item.productId,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    estimatedPrice: item.estimatedPrice,
    marca: item.marca,
    referencia: item.referencia,
    especificacao: item.especificacao?.trim() || null,
    pesoTotal: item.pesoTotal ?? null,
    localUso: item.localUso?.trim() || null,
    setorSolicitante: item.setorSolicitante?.trim() || null,
    dataNecessaria: item.dataNecessaria ? fromDateOnly(item.dataNecessaria) : null,
    photoPath: item.photoPath ?? null,
  };
}

@Injectable()
export class PurchaseRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: PurchaseRequestFilters) {
    const search = filters.search?.trim();
    const numero = search && /^\d+$/.test(search) ? Number(search) : undefined;
    const where: Prisma.PurchaseRequestWhereInput = {
      status: filters.status,
      requesterId: filters.requesterId,
      ...(filters.currentSteps ? { currentStep: { in: filters.currentSteps } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              ...(numero !== undefined ? [{ numero }] : []),
            ],
          }
        : {}),
    };

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.purchaseRequest.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.purchaseRequest.count({ where }),
    ]);

    return { data: data as unknown as PurchaseRequestListItemPayload[], total };
  }

  async findByIdOrThrow(companyId: string, id: string): Promise<PurchaseRequestDetailPayload> {
    const request = await this.prisma.forCompany(companyId).purchaseRequest.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!request) {
      throw new NotFoundException("Solicitação não encontrada.");
    }
    return request as unknown as PurchaseRequestDetailPayload;
  }

  /** Nº sequencial por empresa; a constraint única resolve a corrida de dois envios juntos. */
  async create(
    companyId: string,
    requesterId: string,
    dto: CreatePurchaseRequestDto,
  ): Promise<PurchaseRequestDetailPayload> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const id = await this.prisma.$transaction(async (tx) => {
          const last = await tx.purchaseRequest.aggregate({ where: { companyId }, _max: { numero: true } });
          const created = await tx.purchaseRequest.create({
            data: {
              companyId,
              numero: (last._max.numero ?? 0) + 1,
              requesterId,
              title: dto.title,
              justification: dto.justification,
              costCenter: dto.costCenter,
              requesterContact: dto.requesterContact?.trim() || null,
              currentStep: "TECNICO",
              items: { createMany: { data: dto.items.map(itemData) } },
            },
            select: { id: true },
          });
          return created.id;
        });
        return this.findByIdOrThrow(companyId, id);
      } catch (error) {
        const isNumberClash =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2;
        if (!isNumberClash) throw error;
      }
    }
    throw new ConflictException("Não foi possível numerar a solicitação. Tente de novo.");
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdatePurchaseRequestDto,
  ): Promise<PurchaseRequestDetailPayload> {
    await this.findByIdOrThrow(companyId, id);

    const request = await this.prisma.forCompany(companyId).purchaseRequest.update({
      where: { id },
      data: {
        title: dto.title,
        justification: dto.justification,
        costCenter: dto.costCenter,
        requesterContact: dto.requesterContact === undefined ? undefined : dto.requesterContact.trim() || null,
        ...(dto.items
          ? { items: { deleteMany: {}, createMany: { data: dto.items.map(itemData) } } }
          : {}),
      },
      include: detailInclude,
    });
    return request as unknown as PurchaseRequestDetailPayload;
  }

  async transition(
    companyId: string,
    id: string,
    approverId: string,
    dto: ChangeStatusDto & { fromStatus: PurchaseRequestStatus; action: "APPROVE" | "REJECT" | "REQUEST_CHANGES" },
  ): Promise<PurchaseRequestDetailPayload> {
    const request = await this.prisma.forCompany(companyId).purchaseRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approvals: {
          create: {
            approverId,
            action: dto.action,
            fromStatus: dto.fromStatus,
            toStatus: dto.status,
            comment: dto.comment,
          },
        },
      },
      include: detailInclude,
    });
    return request as unknown as PurchaseRequestDetailPayload;
  }

  async addComment(companyId: string, purchaseRequestId: string, authorId: string, message: string) {
    await this.findByIdOrThrow(companyId, purchaseRequestId);
    return this.prisma.purchaseRequestComment.create({
      data: { purchaseRequestId, authorId, message },
      include: { author: true },
    });
  }

  async addAttachment(
    companyId: string,
    purchaseRequestId: string,
    data: { fileName: string; filePath: string; mimeType: string; size: number; uploadedById: string },
  ) {
    await this.findByIdOrThrow(companyId, purchaseRequestId);
    return this.prisma.purchaseRequestAttachment.create({
      data: { purchaseRequestId, ...data },
      include: { uploadedBy: true },
    });
  }

  async findAttachmentOrThrow(companyId: string, purchaseRequestId: string, attachmentId: string) {
    await this.findByIdOrThrow(companyId, purchaseRequestId);
    const attachment = await this.prisma.purchaseRequestAttachment.findFirst({
      where: { id: attachmentId, purchaseRequestId },
    });
    if (!attachment) {
      throw new NotFoundException("Anexo não encontrado.");
    }
    return attachment;
  }

  async removeAttachment(attachmentId: string) {
    return this.prisma.purchaseRequestAttachment.delete({ where: { id: attachmentId } });
  }

  async stats(companyId: string, userRole: string, signableSteps: ApprovalStep[]) {
    const client = this.prisma.forCompany(companyId);
    const [total, byStatus, pendingMyApproval] = await Promise.all([
      client.purchaseRequest.count({}),
      this.prisma.purchaseRequest.groupBy({
        by: ["status"],
        where: { companyId },
        _count: { _all: true },
      }),
      this.countPendingForUser(companyId, userRole, signableSteps),
    ]);

    return {
      total,
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      pendingMyApproval,
    };
  }

  /** Assinaturas que esperam por mim + as etapas operacionais do meu papel (cotar, receber…). */
  private async countPendingForUser(companyId: string, userRole: string, signableSteps: ApprovalStep[]) {
    const statusByRole: Record<string, PurchaseRequestStatus[]> = {
      BUYER: ["EM_COMPRAS", "EM_COTACAO"],
      WAREHOUSE: ["PEDIDO_REALIZADO", "AGUARDANDO_RECEBIMENTO"],
      ADMIN: ["EM_COMPRAS", "EM_COTACAO", "PEDIDO_REALIZADO", "AGUARDANDO_RECEBIMENTO"],
    };
    const statuses = statusByRole[userRole] ?? [];
    const or: Prisma.PurchaseRequestWhereInput[] = [];
    if (statuses.length > 0) or.push({ status: { in: statuses } });
    if (signableSteps.length > 0) {
      or.push({ status: "AGUARDANDO_APROVACAO", currentStep: { in: signableSteps } });
    }
    if (or.length === 0) return 0;
    return this.prisma.purchaseRequest.count({ where: { companyId, OR: or } });
  }
}
