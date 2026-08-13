import { Injectable } from "@nestjs/common";
import type { PaginatedResult, ProductDetailDto, ProductSummaryDto } from "@falcao-erp/shared-types";
import { AddPriceEntryDto } from "./dto/add-price-entry.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { QueryProductsDto } from "./dto/query-products.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import {
  ProductsRepository,
  type ProductDetailPayload,
  type ProductListItemPayload,
} from "./products.repository";

@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  async list(companyId: string, query: QueryProductsDto): Promise<PaginatedResult<ProductSummaryDto>> {
    const { data, total } = await this.repository.findMany(companyId, {
      search: query.search,
      categoria: query.categoria,
      primarySupplierId: query.primarySupplierId,
      isActive: query.isActive === undefined ? undefined : query.isActive === "true",
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data: data.map((product) => this.toSummaryDto(product)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getById(companyId: string, id: string): Promise<ProductDetailDto> {
    const product = await this.repository.findByIdOrThrow(companyId, id);
    return this.toDetailDto(product);
  }

  async create(companyId: string, dto: CreateProductDto): Promise<ProductDetailDto> {
    const product = await this.repository.create(companyId, dto);
    return this.toDetailDto(product);
  }

  async update(companyId: string, id: string, dto: UpdateProductDto): Promise<ProductDetailDto> {
    const product = await this.repository.update(companyId, id, dto);
    return this.toDetailDto(product);
  }

  async deactivate(companyId: string, id: string): Promise<ProductDetailDto> {
    const product = await this.repository.setActive(companyId, id, false);
    return this.toDetailDto(product);
  }

  async reactivate(companyId: string, id: string): Promise<ProductDetailDto> {
    const product = await this.repository.setActive(companyId, id, true);
    return this.toDetailDto(product);
  }

  async addPriceEntry(companyId: string, productId: string, dto: AddPriceEntryDto) {
    const entry = await this.repository.addPriceEntry(companyId, productId, dto);
    return {
      id: entry.id,
      price: entry.price.toString(),
      supplierId: entry.supplierId,
      supplierName: entry.supplier?.nomeFantasia ?? null,
      recordedAt: entry.recordedAt.toISOString(),
    };
  }

  async stats(companyId: string) {
    return this.repository.stats(companyId);
  }

  private toSummaryDto(product: ProductListItemPayload): ProductSummaryDto {
    return {
      id: product.id,
      codigo: product.codigo,
      nome: product.nome,
      categoria: product.categoria,
      marca: product.marca,
      unidade: product.unidade,
      leadTimeDays: product.leadTimeDays,
      isActive: product.isActive,
      primarySupplier: product.primarySupplier
        ? { id: product.primarySupplier.id, nomeFantasia: product.primarySupplier.nomeFantasia }
        : null,
      lastPrice: product.priceHistory[0]?.price.toString() ?? null,
      createdAt: product.createdAt.toISOString(),
    };
  }

  private toDetailDto(product: ProductDetailPayload): ProductDetailDto {
    return {
      id: product.id,
      codigo: product.codigo,
      nome: product.nome,
      categoria: product.categoria,
      marca: product.marca,
      unidade: product.unidade,
      leadTimeDays: product.leadTimeDays,
      observacoes: product.observacoes,
      isActive: product.isActive,
      primarySupplier: product.primarySupplier
        ? { id: product.primarySupplier.id, nomeFantasia: product.primarySupplier.nomeFantasia }
        : null,
      lastPrice: product.priceHistory[0]?.price.toString() ?? null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      alternativeSuppliers: product.alternativeSuppliers.map((entry) => ({
        id: entry.supplier.id,
        nomeFantasia: entry.supplier.nomeFantasia,
      })),
      priceHistory: product.priceHistory.map((entry) => ({
        id: entry.id,
        price: entry.price.toString(),
        supplierId: entry.supplierId,
        supplierName: entry.supplier?.nomeFantasia ?? null,
        recordedAt: entry.recordedAt.toISOString(),
      })),
    };
  }
}
