import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, ProductCategory } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { AddPriceEntryDto } from "./dto/add-price-entry.dto";
import { CreateFromRequestItemDto } from "./dto/create-from-request-item.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

export interface ProductFilters {
  search?: string;
  categoria?: ProductCategory;
  /** `null` = só produtos sem disciplina. */
  disciplineId?: string | null;
  marca?: string;
  primarySupplierId?: string;
  supplierId?: string;
  isActive?: boolean;
  sort?: "nome" | "codigo" | "recentes";
  page: number;
  pageSize: number;
}

const priceEntryInclude = {
  supplier: true,
  quotation: { select: { numero: true } },
} satisfies Prisma.ProductPriceEntryInclude;

const detailInclude = {
  primarySupplier: true,
  discipline: true,
  alternativeSuppliers: { include: { supplier: true } },
  priceHistory: {
    include: priceEntryInclude,
    orderBy: { recordedAt: "desc" as const },
  },
} satisfies Prisma.ProductInclude;

const listInclude = {
  primarySupplier: true,
  discipline: true,
  priceHistory: {
    include: priceEntryInclude,
    orderBy: { recordedAt: "desc" as const },
    take: 1,
  },
} satisfies Prisma.ProductInclude;

export type ProductDetailPayload = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;
export type ProductListItemPayload = Prisma.ProductGetPayload<{ include: typeof listInclude }>;
export type PriceEntryPayload = Prisma.ProductPriceEntryGetPayload<{ include: typeof priceEntryInclude }>;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: ProductFilters) {
    const and: Prisma.ProductWhereInput[] = [];
    if (filters.search) {
      and.push({
        OR: [
          { nome: { contains: filters.search, mode: "insensitive" } },
          { codigo: { contains: filters.search, mode: "insensitive" } },
          { marca: { contains: filters.search, mode: "insensitive" } },
          { referencia: { contains: filters.search, mode: "insensitive" } },
        ],
      });
    }
    if (filters.supplierId) {
      and.push({
        OR: [
          { primarySupplierId: filters.supplierId },
          { alternativeSuppliers: { some: { supplierId: filters.supplierId } } },
        ],
      });
    }
    const where: Prisma.ProductWhereInput = {
      categoria: filters.categoria,
      disciplineId: filters.disciplineId,
      primarySupplierId: filters.primarySupplierId,
      isActive: filters.isActive,
      ...(filters.marca ? { marca: { contains: filters.marca, mode: "insensitive" } } : {}),
      ...(and.length ? { AND: and } : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filters.sort === "codigo"
        ? { codigo: "asc" }
        : filters.sort === "recentes"
          ? { updatedAt: "desc" }
          : { nome: "asc" };

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.product.findMany({
        where,
        include: listInclude,
        orderBy,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.product.count({ where }),
    ]);

    return { data: data as unknown as ProductListItemPayload[], total };
  }

  async setPhotoPath(companyId: string, id: string, photoPath: string | null): Promise<void> {
    await this.prisma.forCompany(companyId).product.update({ where: { id }, data: { photoPath } });
  }

  async findByIdOrThrow(companyId: string, id: string): Promise<ProductDetailPayload> {
    const product = await this.prisma.forCompany(companyId).product.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!product) {
      throw new NotFoundException("Produto não encontrado.");
    }
    return product as unknown as ProductDetailPayload;
  }

  async assertDiscipline(companyId: string, disciplineId: string | null | undefined): Promise<void> {
    if (!disciplineId) return;
    const discipline = await this.prisma.forCompany(companyId).discipline.findFirst({
      where: { id: disciplineId },
    });
    if (!discipline) {
      throw new BadRequestException("Disciplina não encontrada.");
    }
  }

  async create(companyId: string, dto: CreateProductDto): Promise<ProductDetailPayload> {
    const product = await this.prisma.forCompany(companyId).product.create({
      data: {
        companyId,
        codigo: dto.codigo,
        nome: dto.nome,
        categoria: dto.categoria,
        marca: dto.marca,
        referencia: dto.referencia,
        disciplineId: dto.disciplineId ?? undefined,
        unidade: dto.unidade,
        leadTimeDays: dto.leadTimeDays,
        observacoes: dto.observacoes,
        primarySupplierId: dto.primarySupplierId,
        ...(dto.alternativeSupplierIds?.length
          ? {
              alternativeSuppliers: {
                createMany: {
                  data: dto.alternativeSupplierIds.map((supplierId) => ({ supplierId })),
                },
              },
            }
          : {}),
        ...(dto.initialPrice !== undefined
          ? {
              priceHistory: {
                create: {
                  price: dto.initialPrice,
                  supplierId: dto.primarySupplierId,
                  marca: dto.marca,
                  referencia: dto.referencia,
                },
              },
            }
          : {}),
      },
      include: detailInclude,
    });
    return product as unknown as ProductDetailPayload;
  }

  async update(companyId: string, id: string, dto: UpdateProductDto): Promise<ProductDetailPayload> {
    await this.findByIdOrThrow(companyId, id);

    const product = await this.prisma.forCompany(companyId).product.update({
      where: { id },
      data: {
        codigo: dto.codigo,
        nome: dto.nome,
        categoria: dto.categoria,
        marca: dto.marca,
        referencia: dto.referencia,
        disciplineId: dto.disciplineId,
        unidade: dto.unidade,
        leadTimeDays: dto.leadTimeDays,
        observacoes: dto.observacoes,
        primarySupplierId: dto.primarySupplierId,
        isActive: dto.isActive,
        ...(dto.alternativeSupplierIds
          ? {
              alternativeSuppliers: {
                deleteMany: {},
                createMany: {
                  data: dto.alternativeSupplierIds.map((supplierId) => ({ supplierId })),
                },
              },
            }
          : {}),
      },
      include: detailInclude,
    });
    return product as unknown as ProductDetailPayload;
  }

  async setActive(companyId: string, id: string, isActive: boolean): Promise<ProductDetailPayload> {
    await this.findByIdOrThrow(companyId, id);
    const product = await this.prisma.forCompany(companyId).product.update({
      where: { id },
      data: { isActive },
      include: detailInclude,
    });
    return product as unknown as ProductDetailPayload;
  }

  async addPriceEntry(companyId: string, productId: string, dto: AddPriceEntryDto): Promise<PriceEntryPayload> {
    await this.findByIdOrThrow(companyId, productId);
    if (dto.supplierId) {
      const supplier = await this.prisma.forCompany(companyId).supplier.findFirst({ where: { id: dto.supplierId } });
      if (!supplier) throw new BadRequestException("Fornecedor não encontrado.");
    }
    return this.prisma.productPriceEntry.create({
      data: {
        productId,
        price: dto.price,
        supplierId: dto.supplierId,
        quantity: dto.quantity,
        marca: dto.marca,
        referencia: dto.referencia,
      },
      include: priceEntryInclude,
    });
  }

  /**
   * Cria o produto a partir do item digitado à mão e já liga o item a ele, numa
   * transação: ou os dois acontecem, ou nenhum.
   */
  async createFromRequestItem(companyId: string, dto: CreateFromRequestItemDto): Promise<ProductDetailPayload> {
    const item = await this.prisma.purchaseRequestItem.findFirst({
      where: { id: dto.purchaseRequestItemId, purchaseRequest: { companyId } },
    });
    if (!item) throw new NotFoundException("Item da solicitação não encontrado.");
    if (item.productId) throw new ConflictException("Este item já está ligado a um produto do catálogo.");

    const productId = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          companyId,
          codigo: dto.codigo,
          nome: dto.nome,
          categoria: dto.categoria,
          unidade: dto.unidade,
          disciplineId: dto.disciplineId,
          marca: dto.marca ?? item.marca,
          referencia: dto.referencia ?? item.referencia,
          observacoes: dto.observacoes,
          ...(item.estimatedPrice !== null
            ? { priceHistory: { create: { price: item.estimatedPrice, quantity: item.quantity } } }
            : {}),
        },
      });
      await tx.purchaseRequestItem.update({ where: { id: item.id }, data: { productId: product.id } });
      return product.id;
    });
    return this.findByIdOrThrow(companyId, productId);
  }

  async stats(companyId: string) {
    const client = this.prisma.forCompany(companyId);
    const [total, active, byCategory, byDiscipline, disciplines] = await Promise.all([
      client.product.count({}),
      client.product.count({ where: { isActive: true } }),
      this.prisma.product.groupBy({
        by: ["categoria"],
        where: { companyId },
        _count: { _all: true },
      }),
      this.prisma.product.groupBy({
        by: ["disciplineId"],
        where: { companyId, isActive: true },
        _count: { _all: true },
      }),
      client.discipline.findMany({ select: { id: true, nome: true } }),
    ]);
    const nameOf = new Map(disciplines.map((d) => [d.id, d.nome]));

    return {
      total,
      active,
      byCategory: byCategory.map((row) => ({ categoria: row.categoria, count: row._count._all })),
      byDiscipline: byDiscipline.map((row) => ({
        disciplineId: row.disciplineId,
        nome: row.disciplineId ? (nameOf.get(row.disciplineId) ?? null) : null,
        count: row._count._all,
      })),
    };
  }
}
