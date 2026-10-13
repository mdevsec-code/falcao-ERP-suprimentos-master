import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type ContractStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { fromDateOnly } from "../../common/utils/date-only";

export interface ContractFilters {
  search?: string;
  status?: ContractStatus;
  supplierId?: string;
  prazo?: "VENCENDO" | "VENCIDO";
  today: string;
  page: number;
  pageSize: number;
}

const listInclude = {
  supplier: true,
  _count: { select: { amendments: true } },
} satisfies Prisma.ContractInclude;

const detailInclude = {
  ...listInclude,
  createdBy: true,
  amendments: { include: { author: true }, orderBy: { numero: "desc" as const } },
  documents: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.ContractInclude;

export type ContractListItemPayload = Prisma.ContractGetPayload<{ include: typeof listInclude }>;
export type ContractDetailPayload = Prisma.ContractGetPayload<{ include: typeof detailInclude }>;

export interface ContractWriteData {
  supplierId?: string;
  numero?: string;
  objeto?: string;
  descricao?: string | null;
  costCenter?: string | null;
  valorTotal?: number;
  dataInicio?: Date;
  dataFim?: Date;
  assinadoEm?: Date | null;
  alertaDias?: number;
  status?: ContractStatus;
}

type ContractCreateData = ContractWriteData &
  Required<
    Pick<ContractWriteData, "supplierId" | "numero" | "objeto" | "valorTotal" | "dataInicio" | "dataFim">
  >;

@Injectable()
export class ContractsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: ContractFilters) {
    const where: Prisma.ContractWhereInput = {
      status: filters.status,
      supplierId: filters.supplierId,
      ...(filters.search
        ? {
            OR: [
              { numero: { contains: filters.search, mode: "insensitive" } },
              { objeto: { contains: filters.search, mode: "insensitive" } },
              { supplier: { nomeFantasia: { contains: filters.search, mode: "insensitive" } } },
              { supplier: { razaoSocial: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    if (filters.prazo) {
      where.id = { in: await this.idsByDeadline(companyId, filters.prazo, filters.today) };
    }

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.contract.findMany({
        where,
        include: listInclude,
        orderBy: [{ dataFim: "asc" }, { numero: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.contract.count({ where }),
    ]);
    return { data: data as unknown as ContractListItemPayload[], total };
  }

  /**
   * A janela de alerta é por contrato (`alerta_dias`), então o filtro
   * "vencendo" compara duas colunas — vai em SQL direto.
   */
  async idsByDeadline(companyId: string, prazo: "VENCENDO" | "VENCIDO", today: string) {
    const rows =
      prazo === "VENCIDO"
        ? await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT id FROM contracts
            WHERE company_id = ${companyId} AND status = 'VIGENTE' AND data_fim < ${today}::date`)
        : await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT id FROM contracts
            WHERE company_id = ${companyId} AND status = 'VIGENTE'
              AND data_fim >= ${today}::date
              AND data_fim <= ${today}::date + alerta_dias`);
    return rows.map((row) => row.id);
  }

  async findByIdOrThrow(companyId: string, id: string): Promise<ContractDetailPayload> {
    const contract = await this.prisma.forCompany(companyId).contract.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!contract) throw new NotFoundException("Contrato não encontrado.");
    return contract as unknown as ContractDetailPayload;
  }

  async findByNumero(companyId: string, numero: string) {
    return this.prisma.forCompany(companyId).contract.findFirst({ where: { numero } });
  }

  async supplierExists(companyId: string, supplierId: string) {
    const count = await this.prisma.forCompany(companyId).supplier.count({ where: { id: supplierId } });
    return count > 0;
  }

  async create(companyId: string, createdById: string, data: ContractCreateData) {
    const contract = await this.prisma.forCompany(companyId).contract.create({
      data: { ...data, companyId, createdById },
      include: detailInclude,
    });
    return contract as unknown as ContractDetailPayload;
  }

  async update(companyId: string, id: string, data: ContractWriteData) {
    const contract = await this.prisma.forCompany(companyId).contract.update({
      where: { id },
      data,
      include: detailInclude,
    });
    return contract as unknown as ContractDetailPayload;
  }

  async setStatus(companyId: string, id: string, status: ContractStatus) {
    return this.update(companyId, id, { status });
  }

  /** Grava o aditivo e aplica valor/prazo no contrato, atomicamente. */
  async addAmendment(
    contractId: string,
    authorId: string,
    data: { descricao: string; valorDelta?: number; novaDataFim?: string },
    novoValorTotal: number,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const count = await tx.contractAmendment.count({ where: { contractId } });
      await tx.contractAmendment.create({
        data: {
          contractId,
          authorId,
          numero: count + 1,
          descricao: data.descricao,
          valorDelta: data.valorDelta,
          novaDataFim: data.novaDataFim ? fromDateOnly(data.novaDataFim) : undefined,
        },
      });
      await tx.contract.update({
        where: { id: contractId },
        data: {
          valorTotal: novoValorTotal,
          ...(data.novaDataFim ? { dataFim: fromDateOnly(data.novaDataFim) } : {}),
        },
      });
    });
  }

  async payableTotals(companyId: string, contractId: string) {
    const client = this.prisma.forCompany(companyId);
    const [lancado, pago] = await Promise.all([
      client.payable.aggregate({
        where: { contractId, status: { not: "CANCELADO" } },
        _sum: { valor: true },
      }),
      client.payable.aggregate({
        where: { contractId, status: "PAGO" },
        _sum: { valorPago: true },
      }),
    ]);
    return { lancado: lancado._sum.valor, pago: pago._sum.valorPago };
  }

  async stats(companyId: string, today: string) {
    const client = this.prisma.forCompany(companyId);
    const [vigentes, valorVigente, byStatus, vencendo, vencidos] = await Promise.all([
      client.contract.count({ where: { status: "VIGENTE" } }),
      client.contract.aggregate({ where: { status: "VIGENTE" }, _sum: { valorTotal: true } }),
      this.prisma.contract.groupBy({
        by: ["status"],
        where: { companyId },
        _count: { _all: true },
      }),
      this.idsByDeadline(companyId, "VENCENDO", today),
      this.idsByDeadline(companyId, "VENCIDO", today),
    ]);
    return {
      vigentes,
      valorVigente: valorVigente._sum.valorTotal,
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      vencendo: vencendo.length,
      vencidos: vencidos.length,
    };
  }
}
