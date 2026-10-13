import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ReimbursementStatus } from "../../../generated/prisma";
import { PrismaService } from "../../database/prisma.service";
import { fromDateOnly } from "../../common/utils/date-only";
import { CreateReimbursementDto } from "./dto/create-reimbursement.dto";

export interface ReimbursementFilters {
  search?: string;
  status?: ReimbursementStatus;
  requesterId?: string;
  page: number;
  pageSize: number;
}

const listInclude = {
  requester: true,
  items: true,
} satisfies Prisma.ReimbursementInclude;

const detailInclude = {
  requester: true,
  decidedBy: true,
  items: { orderBy: { data: "asc" as const } },
  attachments: { include: { uploadedBy: true }, orderBy: { uploadedAt: "desc" as const } },
  payable: true,
} satisfies Prisma.ReimbursementInclude;

export type ReimbursementListItemPayload = Prisma.ReimbursementGetPayload<{ include: typeof listInclude }>;
export type ReimbursementDetailPayload = Prisma.ReimbursementGetPayload<{ include: typeof detailInclude }>;

@Injectable()
export class ReimbursementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: ReimbursementFilters) {
    const where: Prisma.ReimbursementWhereInput = {
      status: filters.status,
      requesterId: filters.requesterId,
      ...(filters.search
        ? {
            OR: [
              { titulo: { contains: filters.search, mode: "insensitive" } },
              { requester: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.reimbursement.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.reimbursement.count({ where }),
    ]);
    return { data: data as unknown as ReimbursementListItemPayload[], total };
  }

  async findByIdOrThrow(companyId: string, id: string): Promise<ReimbursementDetailPayload> {
    const reimbursement = await this.prisma.forCompany(companyId).reimbursement.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!reimbursement) throw new NotFoundException("Reembolso não encontrado.");
    return reimbursement as unknown as ReimbursementDetailPayload;
  }

  async create(companyId: string, requesterId: string, dto: CreateReimbursementDto) {
    const reimbursement = await this.prisma.forCompany(companyId).reimbursement.create({
      data: {
        companyId,
        requesterId,
        titulo: dto.titulo,
        costCenter: dto.costCenter || null,
        items: {
          createMany: {
            data: dto.items.map((item) => ({
              data: fromDateOnly(item.data),
              categoria: item.categoria,
              descricao: item.descricao,
              valor: item.valor,
            })),
          },
        },
      },
      include: detailInclude,
    });
    return reimbursement as unknown as ReimbursementDetailPayload;
  }

  async delete(companyId: string, id: string) {
    await this.prisma.forCompany(companyId).reimbursement.delete({ where: { id } });
  }

  /** Registra a decisão e, na aprovação, gera a conta a pagar — tudo ou nada. */
  async decide(
    companyId: string,
    id: string,
    deciderId: string,
    decision: { status: "APROVADO" | "REJEITADO"; comment: string | null },
    payable: { descricao: string; valor: number; vencimento: Date; costCenter: string | null } | null,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // Condicional: duas decisões simultâneas não geram duas contas a pagar.
      const { count } = await tx.reimbursement.updateMany({
        where: { id, companyId, status: "ENVIADO" },
        data: {
          status: decision.status,
          decidedById: deciderId,
          decidedAt: new Date(),
          decisionComment: decision.comment,
        },
      });
      if (count === 0) throw new ConflictException("Este reembolso já foi decidido.");
      if (payable) {
        await tx.payable.create({
          data: {
            companyId,
            reimbursementId: id,
            origem: "REEMBOLSO",
            createdById: deciderId,
            ...payable,
          },
        });
      }
    });
  }

  async addAttachment(
    reimbursementId: string,
    data: { fileName: string; filePath: string; mimeType: string; size: number; uploadedById: string },
  ) {
    return this.prisma.reimbursementAttachment.create({
      data: { reimbursementId, ...data },
      include: { uploadedBy: true },
    });
  }

  async findAttachmentOrThrow(reimbursementId: string, attachmentId: string) {
    const attachment = await this.prisma.reimbursementAttachment.findFirst({
      where: { id: attachmentId, reimbursementId },
    });
    if (!attachment) throw new NotFoundException("Comprovante não encontrado.");
    return attachment;
  }

  async removeAttachment(attachmentId: string) {
    await this.prisma.reimbursementAttachment.delete({ where: { id: attachmentId } });
  }

  async attachmentPaths(reimbursementId: string) {
    const rows = await this.prisma.reimbursementAttachment.findMany({
      where: { reimbursementId },
      select: { filePath: true },
    });
    return rows.map((row) => row.filePath);
  }

  async statsByStatus(companyId: string, requesterId?: string) {
    const requesterFilter = requesterId ? Prisma.sql`AND r.requester_id = ${requesterId}` : Prisma.empty;
    return this.prisma.$queryRaw<Array<{ status: ReimbursementStatus; count: bigint; total: Prisma.Decimal | null }>>(
      Prisma.sql`
        SELECT r.status, COUNT(DISTINCT r.id) AS count, SUM(i.valor) AS total
        FROM reimbursements r
        LEFT JOIN reimbursement_items i ON i.reimbursement_id = r.id
        WHERE r.company_id = ${companyId} ${requesterFilter}
        GROUP BY r.status`,
    );
  }

  async countPendingFor(companyId: string, deciderId: string) {
    return this.prisma.forCompany(companyId).reimbursement.count({
      where: { status: "ENVIADO", requesterId: { not: deciderId } },
    });
  }
}
