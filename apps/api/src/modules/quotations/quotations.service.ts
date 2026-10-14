import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import {
  addDays,
  analyzeQuotation,
  toDateOnly,
  type PaginatedResult,
  type PublicQuotationDto,
  type QuotationDetailDto,
  type QuotationItemDto,
  type QuotationPriceDto,
  type QuotationStatsDto,
  type QuotationSummaryDto,
  type QuotationSupplierDto,
  type Role,
} from "@falcao-erp/shared-types";
import { QUOTATION_WRITE_ROLES } from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { fromDateOnly, money, toDateOnlyOrNull, toDateOnlyString } from "../../common/utils/date-only";
import { PrismaService } from "../../database/prisma.service";
import {
  AddQuotationSupplierDto,
  CreateQuotationDto,
  PublicDeclineQuotationDto,
  PublicSubmitQuotationDto,
  QueryQuotationsDto,
  SetWinnerDto,
  SubmitQuotationPricesDto,
  UpdateQuotationDto,
} from "./dto/quotation.dto";
import { buildLinkToken, isValidLinkSignature, newLinkNonce, parseLinkToken } from "./quotation-link";

const detailInclude = {
  createdBy: { select: { name: true } },
  purchaseRequest: { include: { requester: { select: { name: true } } } },
  items: { include: { product: { select: { codigo: true } } }, orderBy: { ordem: "asc" as const } },
  suppliers: {
    include: { supplier: { include: { contacts: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.QuotationInclude;

type QuotationDetailPayload = Prisma.QuotationGetPayload<{ include: typeof detailInclude }>;

const listInclude = {
  createdBy: { select: { name: true } },
  purchaseRequest: { select: { title: true } },
  suppliers: { select: { status: true } },
  _count: { select: { items: true } },
} satisfies Prisma.QuotationInclude;

type QuotationListPayload = Prisma.QuotationGetPayload<{ include: typeof listInclude }>;

/** Cotação só pode ser aberta depois da aprovação da solicitação. */
const QUOTABLE_STATUSES = ["EM_COMPRAS", "EM_COTACAO"] as const;

@Injectable()
export class QuotationsService {
  private readonly linkSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.linkSecret = config.getOrThrow<string>("JWT_SECRET");
  }

  // ── Consulta ───────────────────────────────────────────────────────────────

  async list(companyId: string, query: QueryQuotationsDto): Promise<PaginatedResult<QuotationSummaryDto>> {
    const search = query.search?.trim();
    const numero = search && /^\d+$/.test(search) ? Number(search) : undefined;
    const where: Prisma.QuotationWhereInput = {
      status: query.status,
      purchaseRequestId: query.purchaseRequestId,
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: "insensitive" } },
              { purchaseRequest: { title: { contains: search, mode: "insensitive" } } },
              ...(numero !== undefined ? [{ numero }] : []),
            ],
          }
        : {}),
    };
    const client = this.prisma.forCompany(companyId);
    const [rows, total] = await Promise.all([
      client.quotation.findMany({
        where,
        include: listInclude,
        orderBy: [{ status: "asc" }, { numero: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      client.quotation.count({ where }),
    ]);
    return {
      data: (rows as unknown as QuotationListPayload[]).map((row) => this.toSummary(row)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async stats(companyId: string): Promise<QuotationStatsDto> {
    const client = this.prisma.forCompany(companyId);
    const today = toDateOnly();
    const monthStart = `${today.slice(0, 7)}-01`;
    const [abertas, aguardandoResposta, vencendo, encerradasNoMes] = await Promise.all([
      client.quotation.count({ where: { status: "ABERTA" } }),
      client.quotation.count({ where: { status: "ABERTA", suppliers: { some: { status: "CONVIDADO" } } } }),
      client.quotation.count({
        where: { status: "ABERTA", prazoResposta: { lte: fromDateOnly(addDays(today, 2)) } },
      }),
      client.quotation.count({ where: { status: "ENCERRADA", encerradaEm: { gte: fromDateOnly(monthStart) } } }),
    ]);
    return { abertas, aguardandoResposta, vencendo, encerradasNoMes };
  }

  async getById(user: AuthenticatedUser, id: string): Promise<QuotationDetailDto> {
    const quotation = await this.findOrThrow(user.companyId, id);
    return this.toDetail(quotation, QUOTATION_WRITE_ROLES.includes(user.role as Role));
  }

  // ── Abertura e manutenção ─────────────────────────────────────────────────

  async create(user: AuthenticatedUser, dto: CreateQuotationDto): Promise<QuotationDetailDto> {
    const companyId = user.companyId;
    if (dto.prazoResposta < toDateOnly()) {
      throw new BadRequestException("O prazo de resposta não pode estar no passado.");
    }
    const request = await this.prisma.forCompany(companyId).purchaseRequest.findFirst({
      where: { id: dto.purchaseRequestId },
      // Sem orderBy: mesma ordem em que o solicitante digitou (e em que a tela mostra).
      include: { items: true },
    });
    if (!request) throw new NotFoundException("Solicitação de compra não encontrada.");
    if (!(QUOTABLE_STATUSES as readonly string[]).includes(request.status)) {
      throw new BadRequestException("A cotação só pode ser aberta para solicitações aprovadas (em compras ou em cotação).");
    }

    const items = dto.itemIds?.length ? request.items.filter((item) => dto.itemIds?.includes(item.id)) : request.items;
    if (items.length === 0 || (dto.itemIds?.length && items.length !== dto.itemIds.length)) {
      throw new BadRequestException("Escolha itens desta solicitação para cotar.");
    }
    await this.assertActiveSuppliers(companyId, dto.supplierIds);

    const id = await this.withNextNumber(companyId, (numero, tx) =>
      tx.quotation.create({
        data: {
          companyId,
          purchaseRequestId: request.id,
          numero,
          titulo: dto.titulo?.trim() || request.title,
          prazoResposta: fromDateOnly(dto.prazoResposta),
          observacoes: dto.observacoes?.trim() || null,
          createdById: user.userId,
          items: {
            create: items.map((item, index) => ({
              purchaseRequestItemId: item.id,
              productId: item.productId,
              ordem: index + 1,
              descricao: item.description,
              quantidade: item.quantity,
              unidade: item.unit,
              marca: item.marca,
              referencia: item.referencia,
            })),
          },
          suppliers: {
            create: dto.supplierIds.map((supplierId) => ({ supplierId, linkNonce: newLinkNonce() })),
          },
        },
        select: { id: true, numero: true },
      }),
      async (created, tx) => {
        // Abrir a cotação é a etapa "em cotação" da solicitação.
        if (request.status === "EM_COMPRAS") {
          await tx.purchaseRequest.update({
            where: { id: request.id },
            data: {
              status: "EM_COTACAO",
              approvals: {
                create: {
                  approverId: user.userId,
                  action: "APPROVE",
                  fromStatus: "EM_COMPRAS",
                  toStatus: "EM_COTACAO",
                  comment: `Cotação nº ${created.numero} aberta.`,
                },
              },
            },
          });
        }
      },
    );
    return this.getById(user, id);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateQuotationDto): Promise<QuotationDetailDto> {
    await this.findOpenOrThrow(user.companyId, id);
    if (dto.prazoResposta && dto.prazoResposta < toDateOnly()) {
      throw new BadRequestException("O prazo de resposta não pode estar no passado.");
    }
    await this.prisma.forCompany(user.companyId).quotation.update({
      where: { id },
      data: {
        titulo: dto.titulo?.trim(),
        prazoResposta: dto.prazoResposta ? fromDateOnly(dto.prazoResposta) : undefined,
        observacoes: dto.observacoes === undefined ? undefined : dto.observacoes.trim() || null,
      },
    });
    return this.getById(user, id);
  }

  async addSupplier(user: AuthenticatedUser, id: string, dto: AddQuotationSupplierDto): Promise<QuotationDetailDto> {
    const quotation = await this.findOpenOrThrow(user.companyId, id);
    await this.assertActiveSuppliers(user.companyId, [dto.supplierId]);
    if (quotation.suppliers.some((s) => s.supplierId === dto.supplierId)) {
      throw new ConflictException("Este fornecedor já foi convidado.");
    }
    await this.prisma.quotationSupplier.create({
      data: { quotationId: id, supplierId: dto.supplierId, linkNonce: newLinkNonce() },
    });
    return this.getById(user, id);
  }

  async removeSupplier(user: AuthenticatedUser, id: string, quotationSupplierId: string): Promise<QuotationDetailDto> {
    const quotation = await this.findOpenOrThrow(user.companyId, id);
    this.invitationOrThrow(quotation, quotationSupplierId);
    await this.prisma.quotationSupplier.delete({ where: { id: quotationSupplierId } });
    return this.getById(user, id);
  }

  /** Gera um link novo; o anterior deixa de funcionar. */
  async regenerateLink(user: AuthenticatedUser, id: string, quotationSupplierId: string): Promise<QuotationDetailDto> {
    const quotation = await this.findOpenOrThrow(user.companyId, id);
    this.invitationOrThrow(quotation, quotationSupplierId);
    await this.prisma.quotationSupplier.update({ where: { id: quotationSupplierId }, data: { linkNonce: newLinkNonce() } });
    return this.getById(user, id);
  }

  /** Compras lança a proposta recebida por e-mail ou telefone. */
  async submitPricesInternally(
    user: AuthenticatedUser,
    id: string,
    quotationSupplierId: string,
    dto: SubmitQuotationPricesDto,
  ): Promise<QuotationDetailDto> {
    const quotation = await this.findOpenOrThrow(user.companyId, id);
    this.invitationOrThrow(quotation, quotationSupplierId);
    const author = await this.prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
    await this.savePrices(quotation, quotationSupplierId, dto, `${author?.name ?? "Compras"} (lançado por compras)`);
    return this.getById(user, id);
  }

  async setWinner(user: AuthenticatedUser, id: string, itemId: string, dto: SetWinnerDto): Promise<QuotationDetailDto> {
    const quotation = await this.findOpenOrThrow(user.companyId, id);
    if (!quotation.items.some((item) => item.id === itemId)) throw new NotFoundException("Item não encontrado nesta cotação.");
    if (dto.quotationSupplierId) {
      this.invitationOrThrow(quotation, dto.quotationSupplierId);
      const price = await this.prisma.quotationPrice.findUnique({
        where: { quotationSupplierId_quotationItemId: { quotationSupplierId: dto.quotationSupplierId, quotationItemId: itemId } },
      });
      if (!price || !price.disponivel || price.precoUnitario === null) {
        throw new BadRequestException("Este fornecedor não cotou o item.");
      }
    }
    await this.prisma.quotationItem.update({ where: { id: itemId }, data: { vencedorId: dto.quotationSupplierId } });
    return this.getById(user, id);
  }

  /** Marca, em cada item, o fornecedor de menor preço. */
  async pickCheapest(user: AuthenticatedUser, id: string): Promise<QuotationDetailDto> {
    const quotation = await this.findOpenOrThrow(user.companyId, id);
    const detail = this.toDetail(quotation, false, await this.loadPrices(quotation));
    await this.prisma.$transaction(
      detail.analysis.items.map((item) =>
        this.prisma.quotationItem.update({
          where: { id: item.itemId },
          data: { vencedorId: item.melhorFornecedorIds[0] ?? null },
        }),
      ),
    );
    return this.getById(user, id);
  }

  /** Encerra a cotação e grava os preços vencedores no histórico do catálogo. */
  async close(user: AuthenticatedUser, id: string): Promise<QuotationDetailDto> {
    const quotation = await this.findOpenOrThrow(user.companyId, id);
    const winners = quotation.items.filter((item) => item.vencedorId);
    if (winners.length === 0) {
      throw new BadRequestException("Escolha o fornecedor de pelo menos um item antes de encerrar.");
    }
    const prices = await this.loadPrices(quotation);

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.quotation.updateMany({
        where: { id, companyId: user.companyId, status: "ABERTA" },
        data: { status: "ENCERRADA", encerradaEm: new Date() },
      });
      if (count === 0) throw new ConflictException("Esta cotação já foi encerrada ou cancelada.");

      for (const item of winners) {
        if (!item.productId) continue;
        const price = prices.find((p) => p.quotationItemId === item.id && p.quotationSupplierId === item.vencedorId);
        const invitation = quotation.suppliers.find((s) => s.id === item.vencedorId);
        if (!price?.precoUnitario || !invitation) continue;
        await tx.productPriceEntry.create({
          data: {
            productId: item.productId,
            supplierId: invitation.supplierId,
            price: price.precoUnitario,
            quantity: item.quantidade,
            marca: price.marca ?? item.marca,
            referencia: price.referencia ?? item.referencia,
            origem: "COTACAO",
            quotationId: id,
          },
        });
      }
    });
    return this.getById(user, id);
  }

  async cancel(user: AuthenticatedUser, id: string): Promise<QuotationDetailDto> {
    await this.findOpenOrThrow(user.companyId, id);
    const { count } = await this.prisma.forCompany(user.companyId).quotation.updateMany({
      where: { id, status: "ABERTA" },
      data: { status: "CANCELADA", encerradaEm: new Date() },
    });
    if (count === 0) throw new ConflictException("Esta cotação já foi encerrada ou cancelada.");
    return this.getById(user, id);
  }

  // ── Link público do fornecedor ────────────────────────────────────────────

  async publicView(token: string): Promise<PublicQuotationDto> {
    const invitation = await this.invitationByToken(token);
    const { quotation } = invitation;
    const closedReason = this.closedReason(quotation.status, toDateOnlyString(quotation.prazoResposta));
    return {
      empresa: quotation.company.name,
      numero: quotation.numero,
      titulo: quotation.titulo,
      prazoResposta: toDateOnlyString(quotation.prazoResposta),
      observacoes: quotation.observacoes,
      aberta: closedReason === null,
      motivoFechada: closedReason,
      fornecedor: { nomeFantasia: invitation.supplier.nomeFantasia, razaoSocial: invitation.supplier.razaoSocial },
      itens: quotation.items.map((item) => ({
        id: item.id,
        descricao: item.descricao,
        quantidade: item.quantidade.toString(),
        unidade: item.unidade,
        marca: item.marca,
        referencia: item.referencia,
      })),
      resposta: {
        status: invitation.status,
        respondidoEm: invitation.respondidoEm?.toISOString() ?? null,
        respondidoPor: invitation.respondidoPor,
        prazoEntregaDias: invitation.prazoEntregaDias,
        condicaoPagamento: invitation.condicaoPagamento,
        validadeProposta: toDateOnlyOrNull(invitation.validadeProposta),
        frete: invitation.frete ? money(invitation.frete) : null,
        observacoes: invitation.observacoes,
        precos: invitation.prices.map((p) => ({
          itemId: p.quotationItemId,
          precoUnitario: p.precoUnitario ? money(p.precoUnitario) : null,
          marca: p.marca,
          referencia: p.referencia,
          disponivel: p.disponivel,
          observacao: p.observacao,
        })),
      },
    };
  }

  async publicSubmit(token: string, dto: PublicSubmitQuotationDto): Promise<PublicQuotationDto> {
    const invitation = await this.invitationByToken(token);
    this.assertAcceptingAnswers(invitation.quotation);
    const quotation = await this.findOrThrow(invitation.quotation.companyId, invitation.quotationId);
    await this.savePrices(quotation, invitation.id, dto, dto.nomeResponsavel.trim());
    return this.publicView(token);
  }

  async publicDecline(token: string, dto: PublicDeclineQuotationDto): Promise<PublicQuotationDto> {
    const invitation = await this.invitationByToken(token);
    this.assertAcceptingAnswers(invitation.quotation);
    await this.prisma.$transaction([
      this.prisma.quotationPrice.deleteMany({ where: { quotationSupplierId: invitation.id } }),
      this.prisma.quotationItem.updateMany({ where: { vencedorId: invitation.id }, data: { vencedorId: null } }),
      this.prisma.quotationSupplier.update({
        where: { id: invitation.id },
        data: {
          status: "RECUSOU",
          respondidoEm: new Date(),
          respondidoPor: dto.nomeResponsavel.trim(),
          observacoes: dto.motivo?.trim() || null,
        },
      }),
    ]);
    return this.publicView(token);
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  private async findOrThrow(companyId: string, id: string): Promise<QuotationDetailPayload> {
    const quotation = await this.prisma.forCompany(companyId).quotation.findFirst({ where: { id }, include: detailInclude });
    if (!quotation) throw new NotFoundException("Cotação não encontrada.");
    return quotation as unknown as QuotationDetailPayload;
  }

  private async findOpenOrThrow(companyId: string, id: string): Promise<QuotationDetailPayload> {
    const quotation = await this.findOrThrow(companyId, id);
    if (quotation.status !== "ABERTA") {
      throw new BadRequestException("Esta cotação já foi encerrada ou cancelada.");
    }
    return quotation;
  }

  private invitationOrThrow(quotation: QuotationDetailPayload, quotationSupplierId: string) {
    const invitation = quotation.suppliers.find((s) => s.id === quotationSupplierId);
    if (!invitation) throw new NotFoundException("Fornecedor não convidado para esta cotação.");
    return invitation;
  }

  private async assertActiveSuppliers(companyId: string, supplierIds: string[]): Promise<void> {
    const found = await this.prisma.forCompany(companyId).supplier.count({
      where: { id: { in: supplierIds }, isActive: true },
    });
    if (found !== supplierIds.length) {
      throw new BadRequestException("Fornecedor não encontrado ou inativo.");
    }
  }

  /** Numeração sequencial por empresa; a constraint única resolve a corrida de duas aberturas simultâneas. */
  private async withNextNumber(
    companyId: string,
    create: (numero: number, tx: Prisma.TransactionClient) => Promise<{ id: string; numero: number }>,
    after: (created: { id: string; numero: number }, tx: Prisma.TransactionClient) => Promise<void>,
  ): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const last = await tx.quotation.aggregate({ where: { companyId }, _max: { numero: true } });
          const created = await create((last._max.numero ?? 0) + 1, tx);
          await after(created, tx);
          return created.id;
        });
      } catch (error) {
        const isNumberClash =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2;
        if (!isNumberClash) throw error;
      }
    }
    throw new ConflictException("Não foi possível numerar a cotação. Tente de novo.");
  }

  private async savePrices(
    quotation: QuotationDetailPayload,
    quotationSupplierId: string,
    dto: SubmitQuotationPricesDto,
    respondidoPor: string,
  ): Promise<void> {
    const itemIds = new Set(quotation.items.map((item) => item.id));
    const seen = new Set<string>();
    for (const price of dto.precos) {
      if (!itemIds.has(price.itemId)) throw new BadRequestException("Item não pertence a esta cotação.");
      if (seen.has(price.itemId)) throw new BadRequestException("Item repetido na resposta.");
      seen.add(price.itemId);
    }

    const clean = (text: string | undefined) => text?.trim() || null;
    await this.prisma.$transaction([
      ...dto.precos.map((price) =>
        this.prisma.quotationPrice.upsert({
          where: { quotationSupplierId_quotationItemId: { quotationSupplierId, quotationItemId: price.itemId } },
          create: {
            quotationSupplierId,
            quotationItemId: price.itemId,
            disponivel: price.disponivel,
            precoUnitario: price.disponivel ? price.precoUnitario : null,
            marca: clean(price.marca),
            referencia: clean(price.referencia),
            observacao: clean(price.observacao),
          },
          update: {
            disponivel: price.disponivel,
            precoUnitario: price.disponivel ? price.precoUnitario : null,
            marca: clean(price.marca),
            referencia: clean(price.referencia),
            observacao: clean(price.observacao),
          },
        }),
      ),
      // Item que deixou de ser cotado não pode continuar como vencedor.
      this.prisma.quotationItem.updateMany({
        where: {
          quotationId: quotation.id,
          vencedorId: quotationSupplierId,
          id: { in: dto.precos.filter((p) => !p.disponivel).map((p) => p.itemId) },
        },
        data: { vencedorId: null },
      }),
      this.prisma.quotationSupplier.update({
        where: { id: quotationSupplierId },
        data: {
          status: "RESPONDIDO",
          respondidoEm: new Date(),
          respondidoPor,
          prazoEntregaDias: dto.prazoEntregaDias ?? null,
          condicaoPagamento: clean(dto.condicaoPagamento),
          validadeProposta: dto.validadeProposta ? fromDateOnly(dto.validadeProposta) : null,
          frete: dto.frete ?? null,
          observacoes: clean(dto.observacoes),
        },
      }),
    ]);
  }

  private async invitationByToken(token: string) {
    const parsed = parseLinkToken(token);
    const notFound = new NotFoundException("Link de cotação inválido ou expirado.");
    if (!parsed) throw notFound;
    const invitation = await this.prisma.quotationSupplier.findUnique({
      where: { id: parsed.quotationSupplierId },
      include: {
        supplier: true,
        prices: true,
        quotation: { include: { company: true, items: { orderBy: { ordem: "asc" } } } },
      },
    });
    if (!invitation || !isValidLinkSignature(this.linkSecret, invitation.id, invitation.linkNonce, parsed.signature)) {
      throw notFound;
    }
    return invitation;
  }

  private closedReason(status: string, prazo: string): PublicQuotationDto["motivoFechada"] {
    if (status === "ENCERRADA") return "ENCERRADA";
    if (status === "CANCELADA") return "CANCELADA";
    if (prazo < toDateOnly()) return "PRAZO";
    return null;
  }

  private assertAcceptingAnswers(quotation: { status: string; prazoResposta: Date }): void {
    const reason = this.closedReason(quotation.status, toDateOnlyString(quotation.prazoResposta));
    if (reason === "PRAZO") throw new BadRequestException("O prazo para responder esta cotação terminou.");
    if (reason) throw new BadRequestException("Esta cotação não está mais recebendo respostas.");
  }

  private async loadPrices(quotation: QuotationDetailPayload) {
    return this.prisma.quotationPrice.findMany({
      where: { quotationSupplier: { quotationId: quotation.id } },
    });
  }

  private toSummary(row: QuotationListPayload): QuotationSummaryDto {
    return {
      id: row.id,
      numero: row.numero,
      titulo: row.titulo,
      status: row.status,
      prazoResposta: toDateOnlyString(row.prazoResposta),
      purchaseRequestId: row.purchaseRequestId,
      purchaseRequestTitle: row.purchaseRequest.title,
      itens: row._count.items,
      convidados: row.suppliers.length,
      respondidos: row.suppliers.filter((s) => s.status === "RESPONDIDO").length,
      createdByName: row.createdBy.name,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async lastPrices(quotation: QuotationDetailPayload) {
    const productIds = [...new Set(quotation.items.map((i) => i.productId).filter((id): id is string => id !== null))];
    if (productIds.length === 0) return new Map<string, { price: string; at: string; supplier: string | null }>();
    const entries = await this.prisma.productPriceEntry.findMany({
      where: {
        productId: { in: productIds },
        OR: [{ quotationId: null }, { quotationId: { not: quotation.id } }],
      },
      include: { supplier: { select: { nomeFantasia: true } } },
      orderBy: { recordedAt: "desc" },
    });
    const latest = new Map<string, { price: string; at: string; supplier: string | null }>();
    for (const entry of entries) {
      if (!latest.has(entry.productId)) {
        latest.set(entry.productId, {
          price: money(entry.price),
          at: entry.recordedAt.toISOString(),
          supplier: entry.supplier?.nomeFantasia ?? null,
        });
      }
    }
    return latest;
  }

  private toDetail(
    quotation: QuotationDetailPayload,
    canManage: boolean,
    preloadedPrices: Awaited<ReturnType<QuotationsService["loadPrices"]>>,
  ): QuotationDetailDto;
  private toDetail(quotation: QuotationDetailPayload, canManage: boolean): Promise<QuotationDetailDto>;
  private toDetail(
    quotation: QuotationDetailPayload,
    canManage: boolean,
    preloadedPrices?: Awaited<ReturnType<QuotationsService["loadPrices"]>>,
  ): QuotationDetailDto | Promise<QuotationDetailDto> {
    if (preloadedPrices) return this.buildDetail(quotation, canManage, preloadedPrices, new Map());
    return Promise.all([this.loadPrices(quotation), this.lastPrices(quotation)]).then(([prices, last]) =>
      this.buildDetail(quotation, canManage, prices, last),
    );
  }

  private buildDetail(
    quotation: QuotationDetailPayload,
    canManage: boolean,
    rawPrices: Awaited<ReturnType<QuotationsService["loadPrices"]>>,
    last: Map<string, { price: string; at: string; supplier: string | null }>,
  ): QuotationDetailDto {
    const items: QuotationItemDto[] = quotation.items.map((item) => {
      const previous = item.productId ? last.get(item.productId) : undefined;
      return {
        id: item.id,
        purchaseRequestItemId: item.purchaseRequestItemId,
        productId: item.productId,
        productCodigo: item.product?.codigo ?? null,
        descricao: item.descricao,
        quantidade: item.quantidade.toString(),
        unidade: item.unidade,
        marca: item.marca,
        referencia: item.referencia,
        vencedorId: item.vencedorId,
        ultimoPreco: previous?.price ?? null,
        ultimoPrecoEm: previous?.at ?? null,
        ultimoFornecedor: previous?.supplier ?? null,
      };
    });
    const suppliers: QuotationSupplierDto[] = quotation.suppliers.map((s) => {
      const email = s.supplier.contacts.find((c) => c.type === "EMAIL");
      const phone = s.supplier.contacts.find((c) => c.type === "PHONE");
      return {
        id: s.id,
        supplierId: s.supplierId,
        supplierName: s.supplier.nomeFantasia,
        supplierCnpj: s.supplier.cnpj,
        contatoNome: s.supplier.responsavel,
        contatoEmail: email?.value ?? null,
        contatoTelefone: phone?.value ?? null,
        status: s.status,
        respondidoEm: s.respondidoEm?.toISOString() ?? null,
        respondidoPor: s.respondidoPor,
        prazoEntregaDias: s.prazoEntregaDias,
        condicaoPagamento: s.condicaoPagamento,
        validadeProposta: toDateOnlyOrNull(s.validadeProposta),
        frete: s.frete ? money(s.frete) : null,
        observacoes: s.observacoes,
        linkToken: canManage && quotation.status === "ABERTA" ? buildLinkToken(this.linkSecret, s.id, s.linkNonce) : null,
      };
    });
    const prices: QuotationPriceDto[] = rawPrices.map((p) => ({
      quotationSupplierId: p.quotationSupplierId,
      quotationItemId: p.quotationItemId,
      precoUnitario: p.precoUnitario ? money(p.precoUnitario) : null,
      marca: p.marca,
      referencia: p.referencia,
      disponivel: p.disponivel,
      observacao: p.observacao,
    }));

    return {
      id: quotation.id,
      numero: quotation.numero,
      titulo: quotation.titulo,
      status: quotation.status,
      prazoResposta: toDateOnlyString(quotation.prazoResposta),
      purchaseRequestId: quotation.purchaseRequestId,
      purchaseRequestTitle: quotation.purchaseRequest.title,
      itens: items.length,
      convidados: suppliers.length,
      respondidos: suppliers.filter((s) => s.status === "RESPONDIDO").length,
      createdByName: quotation.createdBy.name,
      createdAt: quotation.createdAt.toISOString(),
      observacoes: quotation.observacoes,
      encerradaEm: quotation.encerradaEm?.toISOString() ?? null,
      purchaseRequest: {
        id: quotation.purchaseRequest.id,
        title: quotation.purchaseRequest.title,
        status: quotation.purchaseRequest.status,
        costCenter: quotation.purchaseRequest.costCenter,
        requesterName: quotation.purchaseRequest.requester.name,
      },
      items,
      suppliers,
      prices,
      analysis: analyzeQuotation({ items, suppliers, prices }),
    };
  }
}
