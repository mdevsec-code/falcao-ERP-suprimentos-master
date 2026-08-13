import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, PurchaseRequestStatus } from "../../../generated/prisma";
import { PrismaService } from "../../database/prisma.service";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";

export interface PurchaseRequestFilters {
  search?: string;
  status?: PurchaseRequestStatus;
  requesterId?: string;
  page: number;
  pageSize: number;
}

const detailInclude = {
  requester: true,
  items: { include: { product: true } },
  approvals: { include: { approver: true }, orderBy: { createdAt: "desc" as const } },
  comments: { include: { author: true }, orderBy: { createdAt: "asc" as const } },
  attachments: { include: { uploadedBy: true }, orderBy: { uploadedAt: "desc" as const } },
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

@Injectable()
export class PurchaseRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: PurchaseRequestFilters) {
    const where: Prisma.PurchaseRequestWhereInput = {
      status: filters.status,
      requesterId: filters.requesterId,
      ...(filters.search
        ? { title: { contains: filters.search, mode: "insensitive" } }
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

  async create(
    companyId: string,
    requesterId: string,
    dto: CreatePurchaseRequestDto,
  ): Promise<PurchaseRequestDetailPayload> {
    const request = await this.prisma.forCompany(companyId).purchaseRequest.create({
      data: {
        companyId,
        requesterId,
        title: dto.title,
        justification: dto.justification,
        costCenter: dto.costCenter,
        items: {
          createMany: {
            data: dto.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              estimatedPrice: item.estimatedPrice,
            })),
          },
        },
      },
      include: detailInclude,
    });
    return request as unknown as PurchaseRequestDetailPayload;
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
        ...(dto.items
          ? {
              items: {
                deleteMany: {},
                createMany: {
                  data: dto.items.map((item) => ({
                    productId: item.productId,
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    estimatedPrice: item.estimatedPrice,
                  })),
                },
              },
            }
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

  async stats(companyId: string, userId: string, userRole: string) {
    const client = this.prisma.forCompany(companyId);
    const [total, byStatus, pendingMyApproval] = await Promise.all([
      client.purchaseRequest.count({}),
      this.prisma.purchaseRequest.groupBy({
        by: ["status"],
        where: { companyId },
        _count: { _all: true },
      }),
      this.countPendingForRole(companyId, userRole),
    ]);

    return {
      total,
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      pendingMyApproval,
    };
  }

  private async countPendingForRole(companyId: string, userRole: string) {
    const statusByRole: Record<string, PurchaseRequestStatus[]> = {
      MANAGER: ["AGUARDANDO_APROVACAO"],
      BUYER: ["EM_COMPRAS", "EM_COTACAO"],
      WAREHOUSE: ["PEDIDO_REALIZADO", "AGUARDANDO_RECEBIMENTO"],
      ADMIN: [
        "AGUARDANDO_APROVACAO",
        "EM_COMPRAS",
        "EM_COTACAO",
        "PEDIDO_REALIZADO",
        "AGUARDANDO_RECEBIMENTO",
      ],
    };
    const statuses = statusByRole[userRole];
    if (!statuses || statuses.length === 0) return 0;
    return this.prisma.purchaseRequest.count({ where: { companyId, status: { in: statuses } } });
  }
}
