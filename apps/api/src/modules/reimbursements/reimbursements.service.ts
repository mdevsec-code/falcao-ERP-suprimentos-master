import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { addDays, toDateOnly } from "@falcao-erp/shared-types";
import type {
  PaginatedResult,
  ReimbursementDetailDto,
  ReimbursementStatsDto,
  ReimbursementSummaryDto,
  Role,
} from "@falcao-erp/shared-types";
import {
  REIMBURSEMENT_DECIDE_ROLES,
  REIMBURSEMENT_VIEW_ALL_ROLES,
} from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { fromDateOnly, money, toDateOnlyOrNull, toDateOnlyString } from "../../common/utils/date-only";
import { decodeUploadName } from "../../common/utils/file-name";
import { STORAGE_PROVIDER, type IStorageProvider } from "../storage/storage-provider.interface";
import { CreateReimbursementDto } from "./dto/create-reimbursement.dto";
import { DecideReimbursementDto } from "./dto/decide-reimbursement.dto";
import { QueryReimbursementsDto } from "./dto/query-reimbursements.dto";
import {
  ReimbursementsRepository,
  type ReimbursementDetailPayload,
  type ReimbursementListItemPayload,
} from "./reimbursements.repository";
import { fileUrl } from "../../common/utils/file-url";

const canViewAll = (role: Role) => REIMBURSEMENT_VIEW_ALL_ROLES.includes(role);

function sumItems(items: Array<{ valor: { toString(): string } }>): number {
  return items.reduce((sum, item) => sum + Number(item.valor.toString()), 0);
}

@Injectable()
export class ReimbursementsService {
  constructor(
    private readonly repository: ReimbursementsRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: QueryReimbursementsDto,
  ): Promise<PaginatedResult<ReimbursementSummaryDto>> {
    // Quem não vê todos só enxerga os próprios, independentemente do filtro.
    const requesterId =
      !canViewAll(user.role) || query.mine === "true" ? user.userId : query.requesterId;

    const { data, total } = await this.repository.findMany(user.companyId, {
      search: query.search,
      status: query.status,
      requesterId,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      data: data.map((reimbursement) => this.toSummaryDto(reimbursement)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async stats(user: AuthenticatedUser): Promise<ReimbursementStatsDto> {
    const [rows, pendingMyDecision] = await Promise.all([
      this.repository.statsByStatus(user.companyId, canViewAll(user.role) ? undefined : user.userId),
      REIMBURSEMENT_DECIDE_ROLES.includes(user.role)
        ? this.repository.countPendingFor(user.companyId, user.userId)
        : Promise.resolve(0),
    ]);
    return {
      byStatus: rows.map((row) => ({ status: row.status, count: Number(row.count), total: money(row.total) })),
      pendingMyDecision,
    };
  }

  async getById(user: AuthenticatedUser, id: string): Promise<ReimbursementDetailDto> {
    return this.toDetailDto(await this.findVisibleOrThrow(user, id));
  }

  async create(user: AuthenticatedUser, dto: CreateReimbursementDto): Promise<ReimbursementDetailDto> {
    const today = toDateOnly();
    if (dto.items.some((item) => item.data > today)) {
      throw new BadRequestException("Despesas não podem ter data futura.");
    }
    return this.toDetailDto(await this.repository.create(user.companyId, user.userId, dto));
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const reimbursement = await this.findVisibleOrThrow(user, id);
    this.assertOwnerWhileOpen(user, reimbursement, "excluir");
    const paths = await this.repository.attachmentPaths(id);
    await this.repository.delete(user.companyId, id);
    await Promise.all(paths.map((path) => this.storage.delete(path)));
  }

  async decide(user: AuthenticatedUser, id: string, dto: DecideReimbursementDto): Promise<ReimbursementDetailDto> {
    const reimbursement = await this.repository.findByIdOrThrow(user.companyId, id);
    if (reimbursement.status !== "ENVIADO") {
      throw new BadRequestException("Este reembolso já foi decidido.");
    }
    if (reimbursement.requesterId === user.userId) {
      throw new ForbiddenException("Você não pode decidir sobre o seu próprio reembolso.");
    }
    const comment = dto.comment?.trim() || null;
    if (dto.decision === "REJECT" && !comment) {
      throw new BadRequestException("Informe o motivo da rejeição.");
    }

    const vencimento = dto.vencimento ?? addDays(toDateOnly(), 7);
    await this.repository.decide(
      user.companyId,
      id,
      user.userId,
      { status: dto.decision === "APPROVE" ? "APROVADO" : "REJEITADO", comment },
      dto.decision === "APPROVE"
        ? {
            descricao: `Reembolso: ${reimbursement.titulo} — ${reimbursement.requester.name}`,
            valor: Number(sumItems(reimbursement.items).toFixed(2)),
            vencimento: fromDateOnly(vencimento),
            costCenter: reimbursement.costCenter,
          }
        : null,
    );
    return this.getById(user, id);
  }

  async addAttachment(
    user: AuthenticatedUser,
    id: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    const reimbursement = await this.findVisibleOrThrow(user, id);
    this.assertOwnerWhileOpen(user, reimbursement, "anexar comprovantes a");

    const fileName = decodeUploadName(file.originalname);
    const stored = await this.storage.save(file.buffer, { folder: `reimbursements/${id}`, fileName });
    const attachment = await this.repository.addAttachment(id, {
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

  async removeAttachment(user: AuthenticatedUser, id: string, attachmentId: string) {
    const reimbursement = await this.findVisibleOrThrow(user, id);
    this.assertOwnerWhileOpen(user, reimbursement, "remover comprovantes de");
    const attachment = await this.repository.findAttachmentOrThrow(id, attachmentId);
    await this.repository.removeAttachment(attachmentId);
    await this.storage.delete(attachment.filePath);
  }

  /** Reembolso de outra pessoa, para quem só vê os próprios, responde 404 (não vaza a existência). */
  private async findVisibleOrThrow(user: AuthenticatedUser, id: string) {
    const reimbursement = await this.repository.findByIdOrThrow(user.companyId, id);
    if (!canViewAll(user.role) && reimbursement.requesterId !== user.userId) {
      throw new NotFoundException("Reembolso não encontrado.");
    }
    return reimbursement;
  }

  private assertOwnerWhileOpen(user: AuthenticatedUser, reimbursement: ReimbursementDetailPayload, action: string) {
    if (reimbursement.requesterId !== user.userId && user.role !== "ADMIN") {
      throw new ForbiddenException(`Só quem pediu pode ${action} este reembolso.`);
    }
    if (reimbursement.status !== "ENVIADO") {
      throw new BadRequestException(`Não é possível ${action} um reembolso já decidido.`);
    }
  }

  private toSummaryDto(reimbursement: ReimbursementListItemPayload): ReimbursementSummaryDto {
    return {
      id: reimbursement.id,
      titulo: reimbursement.titulo,
      status: reimbursement.status,
      costCenter: reimbursement.costCenter,
      requesterId: reimbursement.requesterId,
      requesterName: reimbursement.requester.name,
      total: money(sumItems(reimbursement.items)),
      itemCount: reimbursement.items.length,
      createdAt: reimbursement.createdAt.toISOString(),
    };
  }

  private toDetailDto(reimbursement: ReimbursementDetailPayload): ReimbursementDetailDto {
    return {
      ...this.toSummaryDto(reimbursement),
      decidedByName: reimbursement.decidedBy?.name ?? null,
      decidedAt: reimbursement.decidedAt?.toISOString() ?? null,
      decisionComment: reimbursement.decisionComment,
      updatedAt: reimbursement.updatedAt.toISOString(),
      items: reimbursement.items.map((item) => ({
        id: item.id,
        data: toDateOnlyString(item.data),
        categoria: item.categoria,
        descricao: item.descricao,
        valor: money(item.valor),
      })),
      attachments: reimbursement.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        uploadedById: attachment.uploadedById,
        uploadedByName: attachment.uploadedBy.name,
        uploadedAt: attachment.uploadedAt.toISOString(),
        url: fileUrl(attachment.filePath),
      })),
      payable: reimbursement.payable
        ? {
            id: reimbursement.payable.id,
            status: reimbursement.payable.status,
            vencimento: toDateOnlyString(reimbursement.payable.vencimento),
            pagoEm: toDateOnlyOrNull(reimbursement.payable.pagoEm),
          }
        : null,
    };
  }
}
