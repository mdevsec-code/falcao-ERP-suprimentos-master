import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { fromDateOnly } from "../../common/utils/date-only";

const eventInclude = { supplier: true } satisfies Prisma.AgendaEventInclude;
export type AgendaEventPayload = Prisma.AgendaEventGetPayload<{ include: typeof eventInclude }>;

export interface AgendaEventWriteData {
  titulo?: string;
  descricao?: string | null;
  tipo?: Prisma.AgendaEventCreateInput["tipo"];
  inicio?: Date;
  fim?: Date | null;
  diaInteiro?: boolean;
  obra?: string | null;
  local?: string | null;
  supplierId?: string | null;
  purchaseRequestId?: string | null;
}

@Injectable()
export class AgendaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Eventos que tocam o intervalo `[start, end)` (início antes do fim do intervalo e término depois do começo). */
  async events(companyId: string, start: Date, end: Date, obra?: string) {
    const events = await this.prisma.forCompany(companyId).agendaEvent.findMany({
      where: {
        obra,
        inicio: { lt: end },
        OR: [{ fim: { gte: start } }, { fim: null, inicio: { gte: start } }],
      },
      include: eventInclude,
      orderBy: { inicio: "asc" },
    });
    return events as unknown as AgendaEventPayload[];
  }

  async payablesDue(companyId: string, from: string, to: string, costCenter?: string) {
    return this.prisma.forCompany(companyId).payable.findMany({
      where: {
        status: "ABERTO",
        costCenter,
        vencimento: { gte: fromDateOnly(from), lte: fromDateOnly(to) },
      },
      include: { supplier: true },
      orderBy: { vencimento: "asc" },
    });
  }

  async contractsEnding(companyId: string, from: string, to: string, costCenter?: string) {
    return this.prisma.forCompany(companyId).contract.findMany({
      where: {
        status: { in: ["VIGENTE", "SUSPENSO"] },
        costCenter,
        dataFim: { gte: fromDateOnly(from), lte: fromDateOnly(to) },
      },
      include: { supplier: true },
      orderBy: { dataFim: "asc" },
    });
  }

  /** Prazo de resposta das cotações abertas. */
  async quotationsDue(companyId: string, from: string, to: string) {
    return this.prisma.forCompany(companyId).quotation.findMany({
      where: { status: "ABERTA", prazoResposta: { gte: fromDateOnly(from), lte: fromDateOnly(to) } },
      include: {
        purchaseRequest: { select: { id: true, costCenter: true } },
        plan: { select: { obra: true } },
      },
      orderBy: { prazoResposta: "asc" },
    });
  }

  async documentsExpiring(companyId: string, from: string, to: string) {
    return this.prisma.forCompany(companyId).document.findMany({
      where: { validoAte: { gte: fromDateOnly(from), lte: fromDateOnly(to) } },
      include: { supplier: true },
      orderBy: { validoAte: "asc" },
    });
  }

  async findEventOrThrow(companyId: string, id: string) {
    const event = await this.prisma.forCompany(companyId).agendaEvent.findUnique({
      where: { id },
      include: eventInclude,
    });
    if (!event) throw new NotFoundException("Evento não encontrado.");
    return event as unknown as AgendaEventPayload;
  }

  async createEvent(
    companyId: string,
    createdById: string,
    data: AgendaEventWriteData & Required<Pick<AgendaEventWriteData, "titulo" | "tipo" | "inicio">>,
  ) {
    const event = await this.prisma.forCompany(companyId).agendaEvent.create({
      data: { ...data, companyId, createdById },
      include: eventInclude,
    });
    return event as unknown as AgendaEventPayload;
  }

  async updateEvent(companyId: string, id: string, data: AgendaEventWriteData) {
    const event = await this.prisma.forCompany(companyId).agendaEvent.update({
      where: { id },
      data,
      include: eventInclude,
    });
    return event as unknown as AgendaEventPayload;
  }

  async deleteEvent(companyId: string, id: string) {
    await this.prisma.forCompany(companyId).agendaEvent.delete({ where: { id } });
  }

  async supplierExists(companyId: string, id: string) {
    return (await this.prisma.forCompany(companyId).supplier.count({ where: { id } })) > 0;
  }

  async purchaseRequestExists(companyId: string, id: string) {
    return (await this.prisma.forCompany(companyId).purchaseRequest.count({ where: { id } })) > 0;
  }

  /** Obras conhecidas: obras dos eventos + centros de custo usados nos demais módulos. */
  async obras(companyId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ obra: string }>>(Prisma.sql`
      SELECT obra FROM agenda_events WHERE company_id = ${companyId} AND obra IS NOT NULL
      UNION SELECT cost_center FROM payables WHERE company_id = ${companyId} AND cost_center IS NOT NULL
      UNION SELECT cost_center FROM contracts WHERE company_id = ${companyId} AND cost_center IS NOT NULL
      UNION SELECT cost_center FROM purchase_requests WHERE company_id = ${companyId} AND cost_center IS NOT NULL
      ORDER BY 1`);
    return rows.map((row) => row.obra);
  }
}
