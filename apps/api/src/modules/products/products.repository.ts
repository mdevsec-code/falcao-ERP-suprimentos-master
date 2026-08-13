import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, ProductCategory } from "../../../generated/prisma";
import { PrismaService } from "../../database/prisma.service";
import { AddPriceEntryDto } from "./dto/add-price-entry.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

export interface ProductFilters {
  search?: string;
  categoria?: ProductCategory;
  primarySupplierId?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

const detailInclude = {
  primarySupplier: true,
  alternativeSuppliers: { include: { supplier: true } },
  priceHistory: {
    include: { supplier: true },
    orderBy: { recordedAt: "desc" as const },
  },
} satisfies Prisma.ProductInclude;

const listInclude = {
  primarySupplier: true,
  priceHistory: {
    orderBy: { recordedAt: "desc" as const },
    take: 1,
  },
} satisfies Prisma.ProductInclude;

export type ProductDetailPayload = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;
export type ProductListItemPayload = Prisma.ProductGetPayload<{ include: typeof listInclude }>;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: ProductFilters) {
    const where: Prisma.ProductWhereInput = {
      categoria: filters.categoria,
      primarySupplierId: filters.primarySupplierId,
      isActive: filters.isActive,
      ...(filters.search
        ? {
            OR: [
              { nome: { contains: filters.search, mode: "insensitive" } },
              { codigo: { contains: filters.search, mode: "insensitive" } },
              { marca: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.product.findMany({
        where,
        include: listInclude,
        orderBy: { nome: "asc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.product.count({ where }),
    ]);

    return { data: data as unknown as ProductListItemPayload[], total };
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

  async create(companyId: string, dto: CreateProductDto): Promise<ProductDetailPayload> {
    const product = await this.prisma.forCompany(companyId).product.create({
      data: {
        companyId,
        codigo: dto.codigo,
        nome: dto.nome,
        categoria: dto.categoria,
        marca: dto.marca,
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
                create: { price: dto.initialPrice, supplierId: dto.primarySupplierId },
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

  async addPriceEntry(companyId: string, productId: string, dto: AddPriceEntryDto) {
    await this.findByIdOrThrow(companyId, productId);
    return this.prisma.productPriceEntry.create({
      data: { productId, price: dto.price, supplierId: dto.supplierId },
      include: { supplier: true },
    });
  }

  async stats(companyId: string) {
    const client = this.prisma.forCompany(companyId);
    const [total, active, byCategory] = await Promise.all([
      client.product.count({}),
      client.product.count({ where: { isActive: true } }),
      this.prisma.product.groupBy({
        by: ["categoria"],
        where: { companyId },
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      active,
      byCategory: byCategory.map((row) => ({ categoria: row.categoria, count: row._count._all })),
    };
  }
}
