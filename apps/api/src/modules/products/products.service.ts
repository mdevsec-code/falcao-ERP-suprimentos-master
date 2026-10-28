import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type {
  PaginatedResult,
  ProductDetailDto,
  ProductPriceEntryDto,
  ProductSummaryDto,
} from "@falcao-erp/shared-types";
import { STORAGE_PROVIDER, type IStorageProvider } from "../storage/storage-provider.interface";
import { AddPriceEntryDto } from "./dto/add-price-entry.dto";
import { CreateFromRequestItemDto } from "./dto/create-from-request-item.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { QueryProductsDto } from "./dto/query-products.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import {
  ProductsRepository,
  type PriceEntryPayload,
  type ProductDetailPayload,
  type ProductListItemPayload,
} from "./products.repository";

/** Fotos de produto: só imagens que o navegador e o PDF mostram. */
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
export const MAX_PRODUCT_PHOTO_BYTES = 8 * 1024 * 1024;

@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  /** Troca a foto do produto (a anterior é apagada do disco). */
  async setPhoto(
    companyId: string,
    id: string,
    file: { mimetype: string; buffer: Buffer },
  ): Promise<ProductDetailDto> {
    const extension = PHOTO_TYPES[file.mimetype];
    if (!extension) throw new BadRequestException("Envie a foto em JPG, PNG ou WebP.");
    const current = await this.repository.findByIdOrThrow(companyId, id);
    const stored = await this.storage.save(file.buffer, { folder: `product-photos/${companyId}`, fileName: `foto${extension}` });
    await this.repository.setPhotoPath(companyId, id, stored.path);
    if (current.photoPath) await this.storage.delete(current.photoPath);
    return this.getById(companyId, id);
  }

  async removePhoto(companyId: string, id: string): Promise<ProductDetailDto> {
    const current = await this.repository.findByIdOrThrow(companyId, id);
    await this.repository.setPhotoPath(companyId, id, null);
    if (current.photoPath) await this.storage.delete(current.photoPath);
    return this.getById(companyId, id);
  }

  async list(companyId: string, query: QueryProductsDto): Promise<PaginatedResult<ProductSummaryDto>> {
    const { data, total } = await this.repository.findMany(companyId, {
      search: query.search,
      categoria: query.categoria,
      disciplineId: query.disciplineId === "none" ? null : query.disciplineId,
      marca: query.marca,
      primarySupplierId: query.primarySupplierId,
      supplierId: query.supplierId,
      sort: query.sort,
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
    await this.repository.assertDiscipline(companyId, dto.disciplineId);
    await this.repository.assertSuppliers(companyId, [dto.primarySupplierId, ...(dto.alternativeSupplierIds ?? [])]);
    const product = await this.repository.create(companyId, dto);
    return this.toDetailDto(product);
  }

  async update(companyId: string, id: string, dto: UpdateProductDto): Promise<ProductDetailDto> {
    await this.repository.assertDiscipline(companyId, dto.disciplineId);
    await this.repository.assertSuppliers(companyId, [dto.primarySupplierId, ...(dto.alternativeSupplierIds ?? [])]);
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

  async addPriceEntry(companyId: string, productId: string, dto: AddPriceEntryDto): Promise<ProductPriceEntryDto> {
    const entry = await this.repository.addPriceEntry(companyId, productId, dto);
    return this.toPriceEntryDto(entry);
  }

  async createFromRequestItem(companyId: string, dto: CreateFromRequestItemDto): Promise<ProductDetailDto> {
    await this.repository.assertDiscipline(companyId, dto.disciplineId);
    const product = await this.repository.createFromRequestItem(companyId, dto);
    return this.toDetailDto(product);
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
      referencia: product.referencia,
      discipline: product.discipline ? { id: product.discipline.id, nome: product.discipline.nome } : null,
      unidade: product.unidade,
      leadTimeDays: product.leadTimeDays,
      isActive: product.isActive,
      photoUrl: product.photoPath ? `/uploads/${product.photoPath}` : null,
      primarySupplier: product.primarySupplier
        ? { id: product.primarySupplier.id, nomeFantasia: product.primarySupplier.nomeFantasia }
        : null,
      ...this.lastPriceFields(product.priceHistory[0]),
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
      referencia: product.referencia,
      discipline: product.discipline ? { id: product.discipline.id, nome: product.discipline.nome } : null,
      unidade: product.unidade,
      leadTimeDays: product.leadTimeDays,
      observacoes: product.observacoes,
      isActive: product.isActive,
      photoUrl: product.photoPath ? `/uploads/${product.photoPath}` : null,
      primarySupplier: product.primarySupplier
        ? { id: product.primarySupplier.id, nomeFantasia: product.primarySupplier.nomeFantasia }
        : null,
      ...this.lastPriceFields(product.priceHistory[0]),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      alternativeSuppliers: product.alternativeSuppliers.map((entry) => ({
        id: entry.supplier.id,
        nomeFantasia: entry.supplier.nomeFantasia,
      })),
      priceHistory: product.priceHistory.map((entry) => this.toPriceEntryDto(entry)),
    };
  }

  private lastPriceFields(entry: PriceEntryPayload | undefined) {
    return {
      lastPrice: entry?.price.toString() ?? null,
      lastQuantity: entry?.quantity?.toString() ?? null,
      lastPriceAt: entry?.recordedAt.toISOString() ?? null,
      lastSupplierName: entry?.supplier?.nomeFantasia ?? null,
    };
  }

  private toPriceEntryDto(entry: PriceEntryPayload): ProductPriceEntryDto {
    return {
      id: entry.id,
      price: entry.price.toString(),
      supplierId: entry.supplierId,
      supplierName: entry.supplier?.nomeFantasia ?? null,
      quantity: entry.quantity?.toString() ?? null,
      marca: entry.marca,
      referencia: entry.referencia,
      origem: entry.origem,
      quotationId: entry.quotationId,
      quotationNumero: entry.quotation?.numero ?? null,
      recordedAt: entry.recordedAt.toISOString(),
    };
  }
}
