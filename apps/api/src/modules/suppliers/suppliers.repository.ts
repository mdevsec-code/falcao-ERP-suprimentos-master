import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, SupplierCategory } from "../../../generated/prisma";
import { PrismaService } from "../../database/prisma.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

export interface SupplierFilters {
  search?: string;
  categoria?: SupplierCategory;
  estado?: string;
  cidade?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

const detailInclude = {
  contacts: true,
  evaluations: { include: { author: true }, orderBy: { createdAt: "desc" as const } },
  documents: { include: { uploadedBy: true }, orderBy: { uploadedAt: "desc" as const } },
} satisfies Prisma.SupplierInclude;

const listInclude = {
  evaluations: { select: { score: true } },
} satisfies Prisma.SupplierInclude;

/**
 * Prisma client-extension query hooks (see PrismaService#forCompany) don't
 * propagate the caller's `include` shape through their return type, so the
 * extended client's methods report a looser type than what actually comes
 * back at runtime. These payload types + casts restore precise typing for
 * the rest of the app without weakening the runtime behaviour.
 */
export type SupplierDetailPayload = Prisma.SupplierGetPayload<{ include: typeof detailInclude }>;
export type SupplierListItemPayload = Prisma.SupplierGetPayload<{ include: typeof listInclude }>;

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: SupplierFilters) {
    const where: Prisma.SupplierWhereInput = {
      categoria: filters.categoria,
      estado: filters.estado,
      cidade: filters.cidade ? { contains: filters.cidade, mode: "insensitive" } : undefined,
      isActive: filters.isActive,
      ...(filters.search
        ? {
            OR: [
              { razaoSocial: { contains: filters.search, mode: "insensitive" } },
              { nomeFantasia: { contains: filters.search, mode: "insensitive" } },
              { cnpj: { contains: filters.search } },
            ],
          }
        : {}),
    };

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.supplier.findMany({
        where,
        include: listInclude,
        orderBy: { razaoSocial: "asc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.supplier.count({ where }),
    ]);

    return { data: data as unknown as SupplierListItemPayload[], total };
  }

  async findByIdOrThrow(companyId: string, id: string): Promise<SupplierDetailPayload> {
    const supplier = await this.prisma.forCompany(companyId).supplier.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!supplier) {
      throw new NotFoundException("Fornecedor não encontrado.");
    }
    return supplier as unknown as SupplierDetailPayload;
  }

  async create(companyId: string, dto: CreateSupplierDto): Promise<SupplierDetailPayload> {
    const supplier = await this.prisma.forCompany(companyId).supplier.create({
      data: {
        companyId,
        razaoSocial: dto.razaoSocial,
        nomeFantasia: dto.nomeFantasia,
        cnpj: dto.cnpj,
        inscricaoEstadual: dto.inscricaoEstadual,
        categoria: dto.categoria,
        cidade: dto.cidade,
        estado: dto.estado,
        responsavel: dto.responsavel,
        contacts: { createMany: { data: dto.contacts } },
      },
      include: detailInclude,
    });
    return supplier as unknown as SupplierDetailPayload;
  }

  async update(companyId: string, id: string, dto: UpdateSupplierDto): Promise<SupplierDetailPayload> {
    await this.findByIdOrThrow(companyId, id);

    const supplier = await this.prisma.forCompany(companyId).supplier.update({
      where: { id },
      data: {
        razaoSocial: dto.razaoSocial,
        nomeFantasia: dto.nomeFantasia,
        cnpj: dto.cnpj,
        inscricaoEstadual: dto.inscricaoEstadual,
        categoria: dto.categoria,
        cidade: dto.cidade,
        estado: dto.estado,
        responsavel: dto.responsavel,
        isActive: dto.isActive,
        ...(dto.contacts
          ? { contacts: { deleteMany: {}, createMany: { data: dto.contacts } } }
          : {}),
      },
      include: detailInclude,
    });
    return supplier as unknown as SupplierDetailPayload;
  }

  async setActive(companyId: string, id: string, isActive: boolean): Promise<SupplierDetailPayload> {
    await this.findByIdOrThrow(companyId, id);
    const supplier = await this.prisma.forCompany(companyId).supplier.update({
      where: { id },
      data: { isActive },
      include: detailInclude,
    });
    return supplier as unknown as SupplierDetailPayload;
  }

  async addEvaluation(companyId: string, supplierId: string, authorId: string, score: number, comment?: string) {
    await this.findByIdOrThrow(companyId, supplierId);
    return this.prisma.supplierEvaluation.create({
      data: { supplierId, authorId, score, comment },
      include: { author: true },
    });
  }

  async addDocument(
    companyId: string,
    supplierId: string,
    data: {
      fileName: string;
      filePath: string;
      mimeType: string;
      size: number;
      category: string;
      uploadedById: string;
    },
  ) {
    await this.findByIdOrThrow(companyId, supplierId);
    return this.prisma.supplierDocument.create({
      data: { supplierId, ...data } as Prisma.SupplierDocumentUncheckedCreateInput,
      include: { uploadedBy: true },
    });
  }

  async findDocumentOrThrow(companyId: string, supplierId: string, documentId: string) {
    await this.findByIdOrThrow(companyId, supplierId);
    const document = await this.prisma.supplierDocument.findFirst({
      where: { id: documentId, supplierId },
    });
    if (!document) {
      throw new NotFoundException("Documento não encontrado.");
    }
    return document;
  }

  async removeDocument(documentId: string) {
    return this.prisma.supplierDocument.delete({ where: { id: documentId } });
  }

  async stats(companyId: string) {
    const client = this.prisma.forCompany(companyId);
    const [total, active, byCategory, byState] = await Promise.all([
      client.supplier.count({}),
      client.supplier.count({ where: { isActive: true } }),
      this.prisma.supplier.groupBy({
        by: ["categoria"],
        where: { companyId },
        _count: { _all: true },
      }),
      this.prisma.supplier.groupBy({
        by: ["estado"],
        where: { companyId },
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      active,
      byCategory: byCategory.map((row) => ({ categoria: row.categoria, count: row._count._all })),
      byState: byState.map((row) => ({ estado: row.estado, count: row._count._all })),
    };
  }
}
