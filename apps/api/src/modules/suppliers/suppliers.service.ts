import { Inject, Injectable } from "@nestjs/common";
import type { PaginatedResult, SupplierDetailDto, SupplierSummaryDto } from "@falcao-erp/shared-types";
import { STORAGE_PROVIDER, type IStorageProvider } from "../storage/storage-provider.interface";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { QuerySuppliersDto } from "./dto/query-suppliers.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import {
  SuppliersRepository,
  type SupplierDetailPayload,
  type SupplierListItemPayload,
} from "./suppliers.repository";

type SupplierWithEvaluations = SupplierListItemPayload;
type SupplierWithDetails = SupplierDetailPayload;

@Injectable()
export class SuppliersService {
  constructor(
    private readonly repository: SuppliersRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async list(companyId: string, query: QuerySuppliersDto): Promise<PaginatedResult<SupplierSummaryDto>> {
    const { data, total } = await this.repository.findMany(companyId, {
      search: query.search,
      categoria: query.categoria,
      estado: query.estado,
      cidade: query.cidade,
      isActive: query.isActive === undefined ? undefined : query.isActive === "true",
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data: data.map((supplier) => this.toSummaryDto(supplier)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getById(companyId: string, id: string): Promise<SupplierDetailDto> {
    const supplier = await this.repository.findByIdOrThrow(companyId, id);
    return this.toDetailDto(supplier);
  }

  async create(companyId: string, dto: CreateSupplierDto): Promise<SupplierDetailDto> {
    const supplier = await this.repository.create(companyId, dto);
    return this.toDetailDto(supplier);
  }

  async update(companyId: string, id: string, dto: UpdateSupplierDto): Promise<SupplierDetailDto> {
    const supplier = await this.repository.update(companyId, id, dto);
    return this.toDetailDto(supplier);
  }

  async deactivate(companyId: string, id: string): Promise<SupplierDetailDto> {
    const supplier = await this.repository.setActive(companyId, id, false);
    return this.toDetailDto(supplier);
  }

  async reactivate(companyId: string, id: string): Promise<SupplierDetailDto> {
    const supplier = await this.repository.setActive(companyId, id, true);
    return this.toDetailDto(supplier);
  }

  async addEvaluation(
    companyId: string,
    supplierId: string,
    authorId: string,
    score: number,
    comment?: string,
  ) {
    const evaluation = await this.repository.addEvaluation(companyId, supplierId, authorId, score, comment);
    return {
      id: evaluation.id,
      score: evaluation.score,
      comment: evaluation.comment,
      authorId: evaluation.authorId,
      authorName: evaluation.author.name,
      createdAt: evaluation.createdAt.toISOString(),
    };
  }

  async uploadDocument(
    companyId: string,
    supplierId: string,
    uploadedById: string,
    category: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    await this.repository.findByIdOrThrow(companyId, supplierId);
    const stored = await this.storage.save(file.buffer, {
      folder: `suppliers/${supplierId}`,
      fileName: file.originalname,
    });

    const document = await this.repository.addDocument(companyId, supplierId, {
      fileName: file.originalname,
      filePath: stored.path,
      mimeType: file.mimetype,
      size: stored.size,
      category,
      uploadedById,
    });

    return {
      id: document.id,
      fileName: document.fileName,
      category: document.category,
      mimeType: document.mimeType,
      size: document.size,
      uploadedById: document.uploadedById,
      uploadedByName: document.uploadedBy.name,
      uploadedAt: document.uploadedAt.toISOString(),
      url: stored.url,
    };
  }

  async removeDocument(companyId: string, supplierId: string, documentId: string) {
    const document = await this.repository.findDocumentOrThrow(companyId, supplierId, documentId);
    await this.repository.removeDocument(documentId);
    await this.storage.delete(document.filePath);
  }

  async stats(companyId: string) {
    return this.repository.stats(companyId);
  }

  private toSummaryDto(supplier: SupplierWithEvaluations): SupplierSummaryDto {
    const scores = supplier.evaluations.map((evaluation) => evaluation.score);
    const averageScore = scores.length
      ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
      : null;

    return {
      id: supplier.id,
      razaoSocial: supplier.razaoSocial,
      nomeFantasia: supplier.nomeFantasia,
      cnpj: supplier.cnpj,
      categoria: supplier.categoria,
      cidade: supplier.cidade,
      estado: supplier.estado as SupplierSummaryDto["estado"],
      isActive: supplier.isActive,
      averageScore,
      createdAt: supplier.createdAt.toISOString(),
    };
  }

  private toDetailDto(supplier: SupplierWithDetails): SupplierDetailDto {
    const scores = supplier.evaluations.map((evaluation) => evaluation.score);
    const averageScore = scores.length
      ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
      : null;

    return {
      id: supplier.id,
      razaoSocial: supplier.razaoSocial,
      nomeFantasia: supplier.nomeFantasia,
      cnpj: supplier.cnpj,
      inscricaoEstadual: supplier.inscricaoEstadual,
      categoria: supplier.categoria,
      cidade: supplier.cidade,
      estado: supplier.estado as SupplierDetailDto["estado"],
      responsavel: supplier.responsavel,
      isActive: supplier.isActive,
      averageScore,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
      contacts: supplier.contacts.map((contact) => ({
        id: contact.id,
        type: contact.type,
        label: contact.label,
        value: contact.value,
      })),
      evaluations: supplier.evaluations.map((evaluation) => ({
        id: evaluation.id,
        score: evaluation.score,
        comment: evaluation.comment,
        authorId: evaluation.authorId,
        authorName: evaluation.author.name,
        createdAt: evaluation.createdAt.toISOString(),
      })),
      documents: supplier.documents.map((document) => ({
        id: document.id,
        fileName: document.fileName,
        category: document.category,
        mimeType: document.mimeType,
        size: document.size,
        uploadedById: document.uploadedById,
        uploadedByName: document.uploadedBy.name,
        uploadedAt: document.uploadedAt.toISOString(),
        url: `/uploads/${document.filePath}`,
      })),
    };
  }
}
