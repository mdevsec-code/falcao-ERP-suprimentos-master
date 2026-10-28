import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Prisma } from "@prisma/client";
import type {
  PaginatedResult,
  PublicCatalogLinkDto,
  PublicCatalogSubmitResultDto,
  SupplierCatalogDetailDto,
  SupplierCatalogItemDto,
  SupplierCatalogSummaryDto,
} from "@falcao-erp/shared-types";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { money } from "../../common/utils/date-only";
import { decodeUploadName } from "../../common/utils/file-name";
import { buildLinkToken, isValidLinkSignature, newLinkNonce, parseLinkToken } from "../../common/utils/signed-link";
import { PrismaService } from "../../database/prisma.service";
import { STORAGE_PROVIDER, type IStorageProvider } from "../storage/storage-provider.interface";
import { SupplierSelfServiceService } from "../suppliers/supplier-self-service.service";
import {
  CreateProductFromCatalogItemDto,
  PublicCatalogSubmitDto,
  QuerySupplierCatalogsDto,
  RejectSupplierCatalogDto,
  ReviewSupplierCatalogDto,
} from "./dto/supplier-catalog.dto";
import { fileUrlOrNull } from "../../common/utils/file-url";

const summaryInclude = {
  supplier: { select: { nomeFantasia: true, cnpj: true, cadastroPendente: true } },
  _count: { select: { items: true } },
} satisfies Prisma.SupplierCatalogInclude;

const detailInclude = {
  supplier: { select: { nomeFantasia: true, cnpj: true, cadastroPendente: true } },
  revisadoPor: { select: { name: true } },
  items: { include: { product: { select: { codigo: true, nome: true } } }, orderBy: { ordem: "asc" as const } },
  _count: { select: { items: true } },
} satisfies Prisma.SupplierCatalogInclude;

type CatalogSummaryPayload = Prisma.SupplierCatalogGetPayload<{ include: typeof summaryInclude }>;
type CatalogDetailPayload = Prisma.SupplierCatalogGetPayload<{ include: typeof detailInclude }>;

type UploadedFile = { originalname: string; mimetype: string; buffer: Buffer };

/** "Cimento CP-II 50kg" ≡ "cimento cp ii 50 kg" para sugerir o produto do catálogo vivo. */
const normalize = (text: string | null | undefined) =>
  (text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/**
 * Catálogo de produtos enviado pelo fornecedor (link público da empresa).
 * Nada entra no catálogo vivo sem revisão: compras vincula cada linha a um
 * produto (ou cria um) e só então o preço vai para o histórico.
 */
@Injectable()
export class SupplierCatalogsService {
  private readonly linkSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly supplierSelfService: SupplierSelfServiceService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
    config: ConfigService,
  ) {
    this.linkSecret = config.getOrThrow<string>("JWT_SECRET");
  }

  // ── Link da empresa ───────────────────────────────────────────────────────

  async getLink(companyId: string): Promise<{ token: string | null }> {
    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    return { token: company.catalogLinkNonce ? this.companyToken(companyId, company.catalogLinkNonce) : null };
  }

  /** Liga ou troca o link (o anterior deixa de funcionar). */
  async regenerateLink(companyId: string): Promise<{ token: string }> {
    const nonce = newLinkNonce();
    await this.prisma.company.update({ where: { id: companyId }, data: { catalogLinkNonce: nonce } });
    return { token: this.companyToken(companyId, nonce) };
  }

  async disableLink(companyId: string): Promise<{ token: null }> {
    await this.prisma.company.update({ where: { id: companyId }, data: { catalogLinkNonce: null } });
    return { token: null };
  }

  // ── Consulta e revisão ────────────────────────────────────────────────────

  async list(companyId: string, query: QuerySupplierCatalogsDto): Promise<PaginatedResult<SupplierCatalogSummaryDto>> {
    const where: Prisma.SupplierCatalogWhereInput = { status: query.status, supplierId: query.supplierId };
    const client = this.prisma.forCompany(companyId);
    const [rows, total] = await Promise.all([
      client.supplierCatalog.findMany({
        where,
        include: summaryInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      client.supplierCatalog.count({ where }),
    ]);
    return {
      data: (rows as unknown as CatalogSummaryPayload[]).map((row) => this.toSummary(row)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async stats(companyId: string): Promise<{ pendentes: number }> {
    const pendentes = await this.prisma.forCompany(companyId).supplierCatalog.count({ where: { status: "PENDENTE" } });
    return { pendentes };
  }

  async getById(companyId: string, id: string): Promise<SupplierCatalogDetailDto> {
    const catalog = await this.findOrThrow(companyId, id);
    return this.toDetail(catalog, await this.suggestions(companyId, catalog));
  }

  /**
   * Aplica as decisões: "importar" grava o preço do fornecedor no histórico do
   * produto e o liga como fornecedor alternativo; "ignorar" só marca a linha.
   */
  async review(user: AuthenticatedUser, id: string, dto: ReviewSupplierCatalogDto): Promise<SupplierCatalogDetailDto> {
    const catalog = await this.findPendingOrThrow(user.companyId, id);
    this.assertApprovedSupplier(catalog);
    const items = new Map(catalog.items.map((item) => [item.id, item]));
    for (const decision of dto.decisoes) {
      const item = items.get(decision.itemId);
      if (!item) throw new BadRequestException("Item não pertence a este catálogo.");
      if (item.status !== "PENDENTE") throw new BadRequestException(`O item "${item.descricao}" já foi revisado.`);
    }
    const productIds = [
      ...new Set(dto.decisoes.map((d) => d.productId).filter((productId): productId is string => !!productId)),
    ];
    const found = await this.prisma.forCompany(user.companyId).product.count({ where: { id: { in: productIds } } });
    if (found !== productIds.length) throw new BadRequestException("Produto do catálogo não encontrado.");

    await this.prisma.$transaction(async (tx) => {
      for (const decision of dto.decisoes) {
        const item = items.get(decision.itemId);
        if (!item) continue;
        if (decision.acao === "IGNORAR") {
          await tx.supplierCatalogItem.update({ where: { id: item.id }, data: { status: "IGNORADO" } });
          continue;
        }
        await this.importItem(tx, catalog, item, decision.productId as string);
      }
      await this.closeIfDone(tx, user, catalog.id);
    });
    return this.getById(user.companyId, id);
  }

  async createProductFromItem(
    user: AuthenticatedUser,
    id: string,
    itemId: string,
    dto: CreateProductFromCatalogItemDto,
  ): Promise<SupplierCatalogDetailDto> {
    const catalog = await this.findPendingOrThrow(user.companyId, id);
    this.assertApprovedSupplier(catalog);
    const item = catalog.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("Item não encontrado neste catálogo.");
    if (item.status !== "PENDENTE") throw new BadRequestException("Este item já foi revisado.");
    if (dto.disciplineId) {
      const discipline = await this.prisma.forCompany(user.companyId).discipline.count({ where: { id: dto.disciplineId } });
      if (discipline === 0) throw new BadRequestException("Disciplina não encontrada.");
    }

    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          companyId: user.companyId,
          codigo: dto.codigo.trim(),
          nome: dto.nome.trim(),
          categoria: dto.categoria,
          unidade: dto.unidade,
          disciplineId: dto.disciplineId ?? null,
          marca: item.marca,
          referencia: item.referencia,
          primarySupplierId: catalog.supplierId,
          observacoes: item.codigoFornecedor ? `Código no fornecedor: ${item.codigoFornecedor}` : null,
        },
      });
      await this.importItem(tx, catalog, item, product.id);
      await this.closeIfDone(tx, user, catalog.id);
    });
    return this.getById(user.companyId, id);
  }

  async reject(user: AuthenticatedUser, id: string, dto: RejectSupplierCatalogDto): Promise<SupplierCatalogDetailDto> {
    await this.findPendingOrThrow(user.companyId, id);
    await this.prisma.$transaction([
      this.prisma.supplierCatalogItem.updateMany({ where: { catalogId: id, status: "PENDENTE" }, data: { status: "IGNORADO" } }),
      this.prisma.supplierCatalog.update({
        where: { id },
        data: {
          status: "REJEITADO",
          motivoRecusa: dto.motivo?.trim() || null,
          revisadoPorId: user.userId,
          revisadoEm: new Date(),
        },
      }),
    ]);
    return this.getById(user.companyId, id);
  }

  // ── Link público ──────────────────────────────────────────────────────────

  async publicView(token: string): Promise<PublicCatalogLinkDto> {
    const company = await this.companyByToken(token);
    return { empresa: company.name };
  }

  /**
   * Envio do fornecedor: `dados` é um JSON (identificação + itens da planilha
   * modelo) e `file` o catálogo em PDF/planilha. Precisa de pelo menos um dos dois.
   */
  async publicSubmit(token: string, rawDados: unknown, file: UploadedFile | undefined): Promise<PublicCatalogSubmitResultDto> {
    const company = await this.companyByToken(token);
    const dto = await this.parseDados(rawDados);
    if (!file && dto.itens.length === 0) {
      throw new BadRequestException("Anexe o arquivo do catálogo ou preencha a planilha de itens.");
    }

    const { supplier, created } = await this.supplierSelfService.resolveOrRegister(company.id, dto.identidade);
    const fileName = file ? decodeUploadName(file.originalname) : null;
    const stored = file
      ? await this.storage.save(file.buffer, { folder: `catalogs/${company.id}`, fileName: fileName as string })
      : null;

    const clean = (text: string | undefined) => text?.trim() || null;
    let catalogId: string;
    try {
      ({ id: catalogId } = await this.prisma.supplierCatalog.create({
        data: {
          companyId: company.id,
          supplierId: supplier.id,
          enviadoPor: dto.identidade.nomeResponsavel.trim(),
          observacoes: clean(dto.observacoes),
          fileName,
          filePath: stored?.path ?? null,
          mimeType: file?.mimetype ?? null,
          size: stored?.size ?? null,
          items: {
            create: dto.itens.map((item, index) => ({
              ordem: index + 1,
              codigoFornecedor: clean(item.codigoFornecedor),
              descricao: item.descricao.trim(),
              unidade: item.unidade.trim().toUpperCase(),
              marca: clean(item.marca),
              referencia: clean(item.referencia),
              preco: item.preco ?? null,
              observacao: clean(item.observacao),
            })),
          },
        },
        select: { id: true },
      }));
    } catch (error) {
      if (stored) await this.storage.delete(stored.path);
      throw error;
    }
    // CNPJ de fornecedor aprovado num link aberto: compras confirma com o contato cadastrado.
    if (!created && !supplier.cadastroPendente) {
      await this.supplierSelfService.alertBuyers(
        company.id,
        supplier,
        dto.identidade.nomeResponsavel,
        { context: "envio de catálogo", path: `/catalogos/${catalogId}` },
        "confirm",
      );
    }
    return { fornecedor: supplier.nomeFantasia, itens: dto.itens.length, cadastroPendente: supplier.cadastroPendente };
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  private companyToken(companyId: string, nonce: string): string {
    return buildLinkToken(this.linkSecret, "catalog-link", companyId, nonce);
  }

  private async companyByToken(token: string) {
    const parsed = parseLinkToken(token);
    const notFound = new NotFoundException("Link de catálogo inválido ou desativado.");
    if (!parsed) throw notFound;
    const company = await this.prisma.company.findUnique({ where: { id: parsed.id } });
    if (
      !company?.isActive ||
      !company.catalogLinkNonce ||
      !isValidLinkSignature(this.linkSecret, "catalog-link", company.id, company.catalogLinkNonce, parsed.signature)
    ) {
      throw notFound;
    }
    return company;
  }

  /** O multipart traz o JSON como texto: valida com as mesmas regras de um corpo JSON. */
  private async parseDados(raw: unknown): Promise<PublicCatalogSubmitDto> {
    let parsed: unknown;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      throw new BadRequestException("Dados do envio inválidos.");
    }
    const dto = plainToInstance(PublicCatalogSubmitDto, parsed ?? {});
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      const messages = errors.flatMap(function collect(error): string[] {
        return [...Object.values(error.constraints ?? {}), ...(error.children ?? []).flatMap(collect)];
      });
      throw new BadRequestException([...new Set(messages)].slice(0, 10));
    }
    return dto;
  }

  private async findOrThrow(companyId: string, id: string): Promise<CatalogDetailPayload> {
    const catalog = await this.prisma.forCompany(companyId).supplierCatalog.findFirst({
      where: { id },
      include: detailInclude,
    });
    if (!catalog) throw new NotFoundException("Catálogo não encontrado.");
    return catalog as unknown as CatalogDetailPayload;
  }

  private async findPendingOrThrow(companyId: string, id: string): Promise<CatalogDetailPayload> {
    const catalog = await this.findOrThrow(companyId, id);
    if (catalog.status !== "PENDENTE") throw new BadRequestException("Este catálogo já foi revisado.");
    return catalog;
  }

  private assertApprovedSupplier(catalog: CatalogDetailPayload): void {
    if (catalog.supplier.cadastroPendente) {
      throw new BadRequestException(
        `Aprove antes o cadastro de ${catalog.supplier.nomeFantasia} (em Fornecedores) — preço de fornecedor não aprovado não entra no catálogo.`,
      );
    }
  }

  private async importItem(
    tx: Prisma.TransactionClient,
    catalog: CatalogDetailPayload,
    item: CatalogDetailPayload["items"][number],
    productId: string,
  ): Promise<void> {
    if (item.preco !== null) {
      await tx.productPriceEntry.create({
        data: {
          productId,
          supplierId: catalog.supplierId,
          price: item.preco,
          marca: item.marca,
          referencia: item.referencia,
          origem: "CATALOGO",
          catalogId: catalog.id,
        },
      });
    }
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { primarySupplierId: true } });
    if (product.primarySupplierId !== catalog.supplierId) {
      await tx.productSupplier.upsert({
        where: { productId_supplierId: { productId, supplierId: catalog.supplierId } },
        create: { productId, supplierId: catalog.supplierId },
        update: {},
      });
    }
    await tx.supplierCatalogItem.update({ where: { id: item.id }, data: { status: "IMPORTADO", productId } });
  }

  /** Quando não sobra linha pendente, o catálogo fica revisado. */
  private async closeIfDone(tx: Prisma.TransactionClient, user: AuthenticatedUser, catalogId: string): Promise<void> {
    const pending = await tx.supplierCatalogItem.count({ where: { catalogId, status: "PENDENTE" } });
    if (pending > 0) return;
    const { count } = await tx.supplierCatalog.updateMany({
      where: { id: catalogId, status: "PENDENTE" },
      data: { status: "REVISADO", revisadoPorId: user.userId, revisadoEm: new Date() },
    });
    if (count === 0) throw new ConflictException("Este catálogo já foi revisado.");
  }

  /** Produto que parece o mesmo: referência do fabricante igual ou, na falta dela, o mesmo nome. */
  private async suggestions(companyId: string, catalog: CatalogDetailPayload) {
    const pending = catalog.items.filter((item) => item.status === "PENDENTE");
    const result = new Map<string, SupplierCatalogItemDto["sugestao"]>();
    if (pending.length === 0) return result;
    const products = await this.prisma.forCompany(companyId).product.findMany({
      where: { isActive: true },
      select: { id: true, codigo: true, nome: true, referencia: true },
    });
    const byReference = new Map<string, (typeof products)[number]>();
    const byName = new Map<string, (typeof products)[number]>();
    for (const product of products) {
      if (product.referencia) byReference.set(normalize(product.referencia), product);
      byName.set(normalize(product.nome), product);
    }
    for (const item of pending) {
      const match =
        (item.referencia ? byReference.get(normalize(item.referencia)) : undefined) ?? byName.get(normalize(item.descricao));
      result.set(item.id, match ? { productId: match.id, codigo: match.codigo, nome: match.nome } : null);
    }
    return result;
  }

  private toSummary(catalog: CatalogSummaryPayload | CatalogDetailPayload): SupplierCatalogSummaryDto {
    return {
      id: catalog.id,
      supplierId: catalog.supplierId,
      supplierName: catalog.supplier.nomeFantasia,
      supplierCnpj: catalog.supplier.cnpj,
      cadastroPendente: catalog.supplier.cadastroPendente,
      status: catalog.status,
      enviadoPor: catalog.enviadoPor,
      itens: catalog._count.items,
      fileName: catalog.fileName,
      fileUrl: fileUrlOrNull(catalog.filePath),
      createdAt: catalog.createdAt.toISOString(),
    };
  }

  private toDetail(
    catalog: CatalogDetailPayload,
    suggestions: Map<string, SupplierCatalogItemDto["sugestao"]>,
  ): SupplierCatalogDetailDto {
    return {
      ...this.toSummary(catalog),
      observacoes: catalog.observacoes,
      revisadoPorName: catalog.revisadoPor?.name ?? null,
      revisadoEm: catalog.revisadoEm?.toISOString() ?? null,
      motivoRecusa: catalog.motivoRecusa,
      items: catalog.items.map((item) => ({
        id: item.id,
        codigoFornecedor: item.codigoFornecedor,
        descricao: item.descricao,
        unidade: item.unidade,
        marca: item.marca,
        referencia: item.referencia,
        preco: item.preco !== null ? money(item.preco) : null,
        observacao: item.observacao,
        status: item.status,
        productId: item.productId,
        productCodigo: item.product?.codigo ?? null,
        productNome: item.product?.nome ?? null,
        sugestao: suggestions.get(item.id) ?? null,
      })),
    };
  }
}
