import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  consolidatePlanItems,
  toDateOnly,
  type PaginatedResult,
  type PlanCandidateRequestDto,
  type RequisitionPlanDetailDto,
  type RequisitionPlanStatsDto,
  type RequisitionPlanSummaryDto,
  type Role,
} from "@falcao-erp/shared-types";
import { QUOTATION_WRITE_ROLES } from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { fromDateOnly, toDateOnlyString } from "../../common/utils/date-only";
import { PrismaService } from "../../database/prisma.service";
import { QuotationsService } from "../quotations/quotations.service";
import {
  CreateRequisitionPlanDto,
  LaunchRequisitionPlanDto,
  QueryPlanCandidatesDto,
  QueryRequisitionPlansDto,
  UpdateRequisitionPlanDto,
} from "./dto/requisition-plan.dto";

const quotationRefSelect = {
  select: {
    id: true,
    numero: true,
    status: true,
    linkAbertoNonce: true,
    suppliers: { select: { status: true } },
  },
} as const;

const requestInclude = {
  requester: { select: { name: true } },
  items: { include: { product: { select: { codigo: true } } } },
} satisfies Prisma.PurchaseRequestInclude;

const detailInclude = {
  createdBy: { select: { name: true } },
  quotation: quotationRefSelect,
  requests: { include: { purchaseRequest: { include: requestInclude } } },
} satisfies Prisma.RequisitionPlanInclude;

const listInclude = {
  createdBy: { select: { name: true } },
  quotation: quotationRefSelect,
  _count: { select: { requests: true } },
} satisfies Prisma.RequisitionPlanInclude;

type PlanDetailPayload = Prisma.RequisitionPlanGetPayload<{ include: typeof detailInclude }>;
type PlanListPayload = Prisma.RequisitionPlanGetPayload<{ include: typeof listInclude }>;
type RequestPayload = Prisma.PurchaseRequestGetPayload<{ include: typeof requestInclude }>;

/**
 * Plano "ativo" segura as solicitações: rascunho, ou lançado com a cotação
 * ainda aberta/encerrada. Cancelar a cotação do plano libera as solicitações.
 */
const ACTIVE_PLAN: Prisma.RequisitionPlanWhereInput = {
  OR: [{ status: "RASCUNHO" }, { status: "LANCADO", quotation: { status: { not: "CANCELADA" } } }],
};

@Injectable()
export class RequisitionPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotations: QuotationsService,
  ) {}

  // ── Consulta ───────────────────────────────────────────────────────────────

  async list(companyId: string, query: QueryRequisitionPlansDto): Promise<PaginatedResult<RequisitionPlanSummaryDto>> {
    const search = query.search?.trim();
    const numero = search && /^\d+$/.test(search) ? Number(search) : undefined;
    const where: Prisma.RequisitionPlanWhereInput = {
      status: query.status,
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: "insensitive" } },
              { obra: { contains: search, mode: "insensitive" } },
              ...(numero !== undefined ? [{ numero }] : []),
            ],
          }
        : {}),
    };
    const client = this.prisma.forCompany(companyId);
    const [rows, total] = await Promise.all([
      client.requisitionPlan.findMany({
        where,
        include: listInclude,
        orderBy: [{ status: "asc" }, { numero: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      client.requisitionPlan.count({ where }),
    ]);
    return {
      data: (rows as unknown as PlanListPayload[]).map((row) => this.toSummary(row, row._count.requests)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async stats(companyId: string): Promise<RequisitionPlanStatsDto> {
    const client = this.prisma.forCompany(companyId);
    const [rascunhos, lancados, solicitacoesDisponiveis] = await Promise.all([
      client.requisitionPlan.count({ where: { status: "RASCUNHO" } }),
      client.requisitionPlan.count({ where: { status: "LANCADO", quotation: { status: "ABERTA" } } }),
      client.purchaseRequest.count({ where: this.candidateWhere() }),
    ]);
    return { rascunhos, lancados, solicitacoesDisponiveis };
  }

  async getById(user: AuthenticatedUser, id: string): Promise<RequisitionPlanDetailDto> {
    const plan = await this.findOrThrow(user.companyId, id);
    return this.toDetail(plan, QUOTATION_WRITE_ROLES.includes(user.role as Role));
  }

  /** Solicitações aprovadas que podem entrar num plano. */
  async candidates(companyId: string, query: QueryPlanCandidatesDto): Promise<PlanCandidateRequestDto[]> {
    const rows = await this.prisma.forCompany(companyId).purchaseRequest.findMany({
      where: this.candidateWhere(query.planId),
      include: requestInclude,
      orderBy: { createdAt: "asc" },
      take: 300,
    });
    return (rows as unknown as RequestPayload[]).map((request) => ({
      ...this.toRequestRef(request),
      items: this.requestItems(request),
    }));
  }

  // ── Rascunho ──────────────────────────────────────────────────────────────

  async create(user: AuthenticatedUser, dto: CreateRequisitionPlanDto): Promise<RequisitionPlanDetailDto> {
    this.assertFutureDeadline(dto.prazoResposta);
    await this.assertCandidates(user.companyId, dto.purchaseRequestIds);
    const id = await this.withNextNumber(user.companyId, (numero, tx) =>
      tx.requisitionPlan.create({
        data: {
          companyId: user.companyId,
          numero,
          titulo: dto.titulo.trim(),
          obra: dto.obra?.trim() || null,
          prazoResposta: fromDateOnly(dto.prazoResposta),
          observacoes: dto.observacoes?.trim() || null,
          createdById: user.userId,
          requests: { create: dto.purchaseRequestIds.map((purchaseRequestId) => ({ purchaseRequestId })) },
        },
        select: { id: true },
      }),
    );
    return this.getById(user, id);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateRequisitionPlanDto): Promise<RequisitionPlanDetailDto> {
    await this.findDraftOrThrow(user.companyId, id);
    if (dto.prazoResposta) this.assertFutureDeadline(dto.prazoResposta);
    if (dto.purchaseRequestIds) await this.assertCandidates(user.companyId, dto.purchaseRequestIds, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.requisitionPlan.update({
        where: { id },
        data: {
          titulo: dto.titulo?.trim(),
          obra: dto.obra === undefined ? undefined : dto.obra.trim() || null,
          prazoResposta: dto.prazoResposta ? fromDateOnly(dto.prazoResposta) : undefined,
          observacoes: dto.observacoes === undefined ? undefined : dto.observacoes.trim() || null,
        },
      });
      if (dto.purchaseRequestIds) {
        await tx.requisitionPlanRequest.deleteMany({ where: { planId: id } });
        await tx.requisitionPlanRequest.createMany({
          data: dto.purchaseRequestIds.map((purchaseRequestId) => ({ planId: id, purchaseRequestId })),
        });
      }
    });
    return this.getById(user, id);
  }

  async launch(user: AuthenticatedUser, id: string, dto: LaunchRequisitionPlanDto): Promise<RequisitionPlanDetailDto> {
    await this.findDraftOrThrow(user.companyId, id);
    await this.quotations.launchPlan(user, id, dto.supplierIds ?? []);
    return this.getById(user, id);
  }

  /** Só rascunho; o plano lançado é encerrado ou cancelado pela cotação dele. */
  async cancel(user: AuthenticatedUser, id: string): Promise<RequisitionPlanDetailDto> {
    await this.findDraftOrThrow(user.companyId, id);
    const { count } = await this.prisma.forCompany(user.companyId).requisitionPlan.updateMany({
      where: { id, status: "RASCUNHO" },
      data: { status: "CANCELADO" },
    });
    if (count === 0) throw new ConflictException("Este plano já foi lançado ou cancelado.");
    return this.getById(user, id);
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  /**
   * Aprovada (em compras ou em cotação), sem cotação própria aberta e fora de
   * qualquer outro plano ativo.
   */
  private candidateWhere(ignorePlanId?: string): Prisma.PurchaseRequestWhereInput {
    return {
      status: { in: ["EM_COMPRAS", "EM_COTACAO"] },
      quotations: { none: { status: "ABERTA" } },
      planEntries: {
        none: { plan: { ...ACTIVE_PLAN, ...(ignorePlanId ? { id: { not: ignorePlanId } } : {}) } },
      },
    };
  }

  private async assertCandidates(companyId: string, ids: string[], ignorePlanId?: string): Promise<void> {
    const found = await this.prisma.forCompany(companyId).purchaseRequest.count({
      where: { id: { in: ids }, ...this.candidateWhere(ignorePlanId) },
    });
    if (found !== ids.length) {
      throw new BadRequestException(
        "Alguma solicitação escolhida não está aprovada, já tem cotação aberta ou já está em outro plano.",
      );
    }
  }

  private assertFutureDeadline(prazo: string): void {
    if (prazo < toDateOnly()) throw new BadRequestException("O prazo de resposta não pode estar no passado.");
  }

  private async findOrThrow(companyId: string, id: string): Promise<PlanDetailPayload> {
    const plan = await this.prisma.forCompany(companyId).requisitionPlan.findFirst({
      where: { id },
      include: detailInclude,
    });
    if (!plan) throw new NotFoundException("Plano de requisição não encontrado.");
    return plan as unknown as PlanDetailPayload;
  }

  private async findDraftOrThrow(companyId: string, id: string): Promise<PlanDetailPayload> {
    const plan = await this.findOrThrow(companyId, id);
    if (plan.status !== "RASCUNHO") throw new BadRequestException("Só é possível alterar um plano em rascunho.");
    return plan;
  }

  /** Numeração sequencial por empresa; a constraint única resolve a corrida. */
  private async withNextNumber(
    companyId: string,
    create: (numero: number, tx: Prisma.TransactionClient) => Promise<{ id: string }>,
  ): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const last = await tx.requisitionPlan.aggregate({ where: { companyId }, _max: { numero: true } });
          return (await create((last._max.numero ?? 0) + 1, tx)).id;
        });
      } catch (error) {
        const isNumberClash =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2;
        if (!isNumberClash) throw error;
      }
    }
    throw new ConflictException("Não foi possível numerar o plano. Tente de novo.");
  }

  private toRequestRef(request: RequestPayload) {
    return {
      id: request.id,
      title: request.title,
      status: request.status,
      costCenter: request.costCenter,
      requesterName: request.requester.name,
      itemCount: request.items.length,
      createdAt: request.createdAt.toISOString(),
    };
  }

  private requestItems(request: RequestPayload): PlanCandidateRequestDto["items"] {
    return request.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productCodigo: item.product?.codigo ?? null,
      description: item.description,
      quantity: item.quantity.toString(),
      unit: item.unit,
      marca: item.marca,
      referencia: item.referencia,
    }));
  }

  private toSummary(plan: PlanListPayload | PlanDetailPayload, solicitacoes: number): RequisitionPlanSummaryDto {
    return {
      id: plan.id,
      numero: plan.numero,
      titulo: plan.titulo,
      obra: plan.obra,
      status: plan.status,
      prazoResposta: toDateOnlyString(plan.prazoResposta),
      solicitacoes,
      createdByName: plan.createdBy.name,
      createdAt: plan.createdAt.toISOString(),
      lancadoEm: plan.lancadoEm?.toISOString() ?? null,
      quotation: plan.quotation
        ? {
            id: plan.quotation.id,
            numero: plan.quotation.numero,
            status: plan.quotation.status,
            convidados: plan.quotation.suppliers.length,
            respondidos: plan.quotation.suppliers.filter((s) => s.status === "RESPONDIDO").length,
          }
        : null,
    };
  }

  private toDetail(plan: PlanDetailPayload, canManage: boolean): RequisitionPlanDetailDto {
    const requests = plan.requests.map((entry) => entry.purchaseRequest);
    return {
      ...this.toSummary(plan, requests.length),
      observacoes: plan.observacoes,
      requests: requests.map((request) => this.toRequestRef(request)),
      items: consolidatePlanItems(
        requests.map((request) => ({
          purchaseRequestId: request.id,
          purchaseRequestTitle: request.title,
          items: this.requestItems(request),
        })),
      ),
      linkAbertoToken: canManage && plan.quotation ? this.quotations.openLinkToken(plan.quotation) : null,
    };
  }
}
