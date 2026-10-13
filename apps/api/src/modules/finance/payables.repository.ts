import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type PayableSource, type PayableStatus, type PaymentMethod } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { fromDateOnly } from "../../common/utils/date-only";

export interface PayableFilters {
  search?: string;
  status?: PayableStatus;
  origem?: PayableSource;
  costCenter?: string;
  supplierId?: string;
  contractId?: string;
  vencidas?: boolean;
  semNota?: boolean;
  from?: string;
  to?: string;
  today: string;
  page: number;
  pageSize: number;
}

const include = {
  supplier: true,
  contract: true,
  purchaseRequest: true,
  createdBy: true,
} satisfies Prisma.PayableInclude;

export type PayablePayload = Prisma.PayableGetPayload<{ include: typeof include }>;

export interface PayableWriteData {
  descricao?: string;
  origem?: PayableSource;
  valor?: number;
  vencimento?: Date;
  supplierId?: string | null;
  contractId?: string | null;
  purchaseRequestId?: string | null;
  reimbursementId?: string | null;
  costCenter?: string | null;
  notaFiscal?: string | null;
  notaFiscalEmissao?: Date | null;
  observacoes?: string | null;
}

@Injectable()
export class PayablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: PayableFilters) {
    const vencimento: Prisma.DateTimeFilter = {};
    if (filters.from) vencimento.gte = fromDateOnly(filters.from);
    if (filters.to) vencimento.lte = fromDateOnly(filters.to);
    if (filters.vencidas) vencimento.lt = fromDateOnly(filters.today);

    let status: Prisma.PayableWhereInput["status"] = filters.status;
    if (filters.vencidas) status = "ABERTO";
    else if (filters.semNota && !status) status = { not: "CANCELADO" };

    const where: Prisma.PayableWhereInput = {
      status,
      origem: filters.origem,
      costCenter: filters.costCenter,
      supplierId: filters.supplierId,
      contractId: filters.contractId,
      ...(Object.keys(vencimento).length > 0 ? { vencimento } : {}),
      ...(filters.semNota ? { notaFiscal: null } : {}),
      ...(filters.search
        ? {
            OR: [
              { descricao: { contains: filters.search, mode: "insensitive" } },
              { notaFiscal: { contains: filters.search, mode: "insensitive" } },
              { supplier: { nomeFantasia: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.payable.findMany({
        where,
        include,
        orderBy: [{ vencimento: "asc" }, { createdAt: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.payable.count({ where }),
    ]);
    return { data: data as unknown as PayablePayload[], total };
  }

  async findByIdOrThrow(companyId: string, id: string): Promise<PayablePayload> {
    const payable = await this.prisma.forCompany(companyId).payable.findUnique({ where: { id }, include });
    if (!payable) throw new NotFoundException("Conta a pagar não encontrada.");
    return payable as unknown as PayablePayload;
  }

  async create(companyId: string, createdById: string, data: PayableWriteData & { descricao: string; valor: number; vencimento: Date }) {
    const payable = await this.prisma.forCompany(companyId).payable.create({
      data: { ...data, companyId, createdById },
      include,
    });
    return payable as unknown as PayablePayload;
  }

  async update(companyId: string, id: string, data: PayableWriteData) {
    const payable = await this.prisma.forCompany(companyId).payable.update({ where: { id }, data, include });
    return payable as unknown as PayablePayload;
  }

  async cancel(companyId: string, id: string) {
    const { count } = await this.prisma.forCompany(companyId).payable.updateMany({
      where: { id, status: "ABERTO" },
      data: { status: "CANCELADO" },
    });
    if (count === 0) throw new ConflictException("Esta conta já foi baixada ou cancelada.");
    return this.findByIdOrThrow(companyId, id);
  }

  /** Baixa a conta e, se ela veio de um reembolso, marca o reembolso como pago. */
  async pay(
    id: string,
    data: { pagoEm: Date; valorPago: number; formaPagamento: PaymentMethod },
    reimbursementId: string | null,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // Condicional: dois cliques/abas não baixam a mesma conta duas vezes.
      const { count } = await tx.payable.updateMany({
        where: { id, status: "ABERTO" },
        data: { ...data, status: "PAGO" },
      });
      if (count === 0) throw new ConflictException("Esta conta já foi baixada ou cancelada.");
      if (reimbursementId) {
        await tx.reimbursement.update({ where: { id: reimbursementId }, data: { status: "PAGO" } });
      }
    });
  }

  async findLinkedContract(companyId: string, id: string) {
    return this.prisma.forCompany(companyId).contract.findUnique({ where: { id } });
  }

  async findLinkedPurchaseRequest(companyId: string, id: string) {
    return this.prisma.forCompany(companyId).purchaseRequest.findUnique({ where: { id } });
  }

  async supplierExists(companyId: string, id: string) {
    return (await this.prisma.forCompany(companyId).supplier.count({ where: { id } })) > 0;
  }

  async stats(companyId: string, today: string, in7Days: string, monthStart: string) {
    const client = this.prisma.forCompany(companyId);
    const [aPagar, vencido, proximos, pagoNoMes, semNotaCount] = await Promise.all([
      client.payable.aggregate({ where: { status: "ABERTO" }, _sum: { valor: true }, _count: { _all: true } }),
      client.payable.aggregate({
        where: { status: "ABERTO", vencimento: { lt: fromDateOnly(today) } },
        _sum: { valor: true },
        _count: { _all: true },
      }),
      client.payable.aggregate({
        where: { status: "ABERTO", vencimento: { gte: fromDateOnly(today), lte: fromDateOnly(in7Days) } },
        _sum: { valor: true },
        _count: { _all: true },
      }),
      client.payable.aggregate({
        where: { status: "PAGO", pagoEm: { gte: fromDateOnly(monthStart), lte: fromDateOnly(today) } },
        _sum: { valorPago: true },
        _count: { _all: true },
      }),
      client.payable.count({ where: { status: { not: "CANCELADO" }, notaFiscal: null } }),
    ]);
    return { aPagar, vencido, proximos, pagoNoMes, semNotaCount };
  }

  async cashFlow(companyId: string, from: string, toExclusive: string, costCenter?: string) {
    const ccFilter = costCenter ? Prisma.sql`AND cost_center = ${costCenter}` : Prisma.empty;
    const [previsto, pago] = await Promise.all([
      this.prisma.$queryRaw<Array<{ month: string; total: Prisma.Decimal }>>(Prisma.sql`
        SELECT to_char(vencimento, 'YYYY-MM') AS month, SUM(valor) AS total
        FROM payables
        WHERE company_id = ${companyId} AND status <> 'CANCELADO'
          AND vencimento >= ${from}::date AND vencimento < ${toExclusive}::date ${ccFilter}
        GROUP BY 1`),
      this.prisma.$queryRaw<Array<{ month: string; total: Prisma.Decimal }>>(Prisma.sql`
        SELECT to_char(pago_em, 'YYYY-MM') AS month, SUM(COALESCE(valor_pago, valor)) AS total
        FROM payables
        WHERE company_id = ${companyId} AND status = 'PAGO'
          AND pago_em >= ${from}::date AND pago_em < ${toExclusive}::date ${ccFilter}
        GROUP BY 1`),
    ]);
    return { previsto, pago };
  }

  async byCostCenter(companyId: string, limit: number) {
    return this.prisma.$queryRaw<Array<{ cost_center: string; aberto: Prisma.Decimal; pago: Prisma.Decimal }>>(
      Prisma.sql`
        SELECT COALESCE(cost_center, '') AS cost_center,
               SUM(CASE WHEN status = 'ABERTO' THEN valor ELSE 0 END) AS aberto,
               SUM(CASE WHEN status = 'PAGO' THEN COALESCE(valor_pago, valor) ELSE 0 END) AS pago
        FROM payables
        WHERE company_id = ${companyId} AND status <> 'CANCELADO'
        GROUP BY 1
        ORDER BY SUM(COALESCE(valor_pago, valor)) DESC
        LIMIT ${limit}`,
    );
  }

  async costCenters(companyId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ cost_center: string }>>(Prisma.sql`
      SELECT DISTINCT cost_center FROM payables
      WHERE company_id = ${companyId} AND cost_center IS NOT NULL
      ORDER BY cost_center`);
    return rows.map((row) => row.cost_center);
  }
}
