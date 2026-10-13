import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type DocumentCategory } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { fromDateOnly } from "../../common/utils/date-only";

export interface DocumentFilters {
  search?: string;
  categoria?: DocumentCategory;
  tag?: string;
  validade?: "OK" | "VENCENDO" | "VENCIDO" | "SEM_VALIDADE";
  supplierId?: string;
  contractId?: string;
  today: string;
  alertUntil: string;
  page: number;
  pageSize: number;
}

const include = {
  supplier: true,
  contract: true,
  uploadedBy: true,
} satisfies Prisma.DocumentInclude;

export type DocumentPayload = Prisma.DocumentGetPayload<{ include: typeof include }>;

export interface DocumentWriteData {
  titulo?: string;
  descricao?: string | null;
  categoria?: DocumentCategory;
  tags?: string[];
  validoAte?: Date | null;
  supplierId?: string | null;
  contractId?: string | null;
}

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: DocumentFilters) {
    const today = fromDateOnly(filters.today);
    const alertUntil = fromDateOnly(filters.alertUntil);
    const validoAte: Record<NonNullable<DocumentFilters["validade"]>, Prisma.DocumentWhereInput["validoAte"]> = {
      VENCIDO: { lt: today },
      VENCENDO: { gte: today, lte: alertUntil },
      OK: { gt: alertUntil },
      SEM_VALIDADE: null,
    };

    const search = filters.search?.trim();
    const where: Prisma.DocumentWhereInput = {
      categoria: filters.categoria,
      supplierId: filters.supplierId,
      contractId: filters.contractId,
      ...(filters.tag ? { tags: { has: filters.tag.toLowerCase() } } : {}),
      ...(filters.validade ? { validoAte: validoAte[filters.validade] } : {}),
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: "insensitive" } },
              { descricao: { contains: search, mode: "insensitive" } },
              { fileName: { contains: search, mode: "insensitive" } },
              { conteudo: { contains: search, mode: "insensitive" } },
              { tags: { has: search.toLowerCase() } },
            ],
          }
        : {}),
    };

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.document.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.document.count({ where }),
    ]);
    return { data: data as unknown as DocumentPayload[], total };
  }

  async findByIdOrThrow(companyId: string, id: string): Promise<DocumentPayload> {
    const document = await this.prisma.forCompany(companyId).document.findUnique({ where: { id }, include });
    if (!document) throw new NotFoundException("Documento não encontrado.");
    return document as unknown as DocumentPayload;
  }

  async create(
    companyId: string,
    data: DocumentWriteData & {
      titulo: string;
      categoria: DocumentCategory;
      fileName: string;
      filePath: string;
      mimeType: string;
      size: number;
      conteudo: string | null;
      uploadedById: string;
    },
  ) {
    const document = await this.prisma.forCompany(companyId).document.create({
      data: { ...data, companyId },
      include,
    });
    return document as unknown as DocumentPayload;
  }

  async update(companyId: string, id: string, data: DocumentWriteData) {
    const document = await this.prisma.forCompany(companyId).document.update({ where: { id }, data, include });
    return document as unknown as DocumentPayload;
  }

  async delete(companyId: string, id: string) {
    await this.prisma.forCompany(companyId).document.delete({ where: { id } });
  }

  async supplierExists(companyId: string, id: string) {
    return (await this.prisma.forCompany(companyId).supplier.count({ where: { id } })) > 0;
  }

  async contractExists(companyId: string, id: string) {
    return (await this.prisma.forCompany(companyId).contract.count({ where: { id } })) > 0;
  }

  async tags(companyId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ tag: string; count: bigint }>>(Prisma.sql`
      SELECT tag, COUNT(*) AS count
      FROM documents, unnest(tags) AS tag
      WHERE company_id = ${companyId}
      GROUP BY tag
      ORDER BY count DESC, tag ASC`);
    return rows.map((row) => ({ tag: row.tag, count: Number(row.count) }));
  }

  async stats(companyId: string, today: string, alertUntil: string) {
    const client = this.prisma.forCompany(companyId);
    const [total, vencidos, vencendo, byCategory] = await Promise.all([
      client.document.count({}),
      client.document.count({ where: { validoAte: { lt: fromDateOnly(today) } } }),
      client.document.count({
        where: { validoAte: { gte: fromDateOnly(today), lte: fromDateOnly(alertUntil) } },
      }),
      this.prisma.document.groupBy({ by: ["categoria"], where: { companyId }, _count: { _all: true } }),
    ]);
    return {
      total,
      vencidos,
      vencendo,
      byCategory: byCategory.map((row) => ({ categoria: row.categoria, count: row._count._all })),
    };
  }
}
