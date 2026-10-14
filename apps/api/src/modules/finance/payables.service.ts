import { BadRequestException, Injectable } from "@nestjs/common";
import { addDays, toDateOnly } from "@falcao-erp/shared-types";
import type {
  CashFlowPointDto,
  CostCenterTotalDto,
  PaginatedResult,
  PayableDto,
  PayableSource,
  PayableStatsDto,
} from "@falcao-erp/shared-types";
import { fromDateOnly, money, toDateOnlyOrNull, toDateOnlyString } from "../../common/utils/date-only";
import { CashFlowQueryDto } from "./dto/cash-flow-query.dto";
import { CreatePayableDto } from "./dto/create-payable.dto";
import { InvoiceDto } from "./dto/invoice.dto";
import { PayPayableDto } from "./dto/pay-payable.dto";
import { QueryPayablesDto } from "./dto/query-payables.dto";
import { UpdatePayableDto } from "./dto/update-payable.dto";
import { PayablesRepository, type PayablePayload, type PayableWriteData } from "./payables.repository";

/** `YYYY-MM` deslocado `delta` meses. */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

@Injectable()
export class PayablesService {
  constructor(private readonly repository: PayablesRepository) {}

  async list(companyId: string, query: QueryPayablesDto): Promise<PaginatedResult<PayableDto>> {
    const today = toDateOnly();
    const { data, total } = await this.repository.findMany(companyId, {
      search: query.search,
      status: query.status,
      origem: query.origem,
      costCenter: query.costCenter,
      supplierId: query.supplierId,
      contractId: query.contractId,
      vencidas: query.vencidas === "true",
      semNota: query.semNota === "true",
      comNota: query.comNota === "true",
      from: query.from,
      to: query.to,
      today,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      data: data.map((payable) => this.toDto(payable, today)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getById(companyId: string, id: string): Promise<PayableDto> {
    return this.toDto(await this.repository.findByIdOrThrow(companyId, id));
  }

  async create(companyId: string, userId: string, dto: CreatePayableDto): Promise<PayableDto> {
    const links = await this.resolveLinks(companyId, dto);
    const payable = await this.repository.create(companyId, userId, {
      descricao: dto.descricao,
      valor: dto.valor,
      vencimento: fromDateOnly(dto.vencimento),
      notaFiscal: dto.notaFiscal || null,
      notaFiscalEmissao: dto.notaFiscalEmissao ? fromDateOnly(dto.notaFiscalEmissao) : null,
      observacoes: dto.observacoes || null,
      ...links,
    });
    return this.toDto(payable);
  }

  async update(companyId: string, id: string, dto: UpdatePayableDto): Promise<PayableDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    if (existing.status !== "ABERTO") {
      throw new BadRequestException("Só contas em aberto podem ser editadas.");
    }

    const data: PayableWriteData = {
      descricao: dto.descricao,
      vencimento: dto.vencimento ? fromDateOnly(dto.vencimento) : undefined,
      notaFiscal: dto.notaFiscal === undefined ? undefined : dto.notaFiscal || null,
      notaFiscalEmissao:
        dto.notaFiscalEmissao === undefined
          ? undefined
          : dto.notaFiscalEmissao
            ? fromDateOnly(dto.notaFiscalEmissao)
            : null,
      observacoes: dto.observacoes === undefined ? undefined : dto.observacoes || null,
    };

    // Conta gerada por reembolso: valor e vínculos vêm do reembolso aprovado.
    if (existing.origem === "REEMBOLSO") {
      if (dto.valor !== undefined || dto.contractId || dto.purchaseRequestId || dto.supplierId) {
        throw new BadRequestException("O valor e os vínculos de uma conta de reembolso não podem ser alterados.");
      }
    } else {
      data.valor = dto.valor;
      Object.assign(
        data,
        await this.resolveLinks(companyId, {
          supplierId: dto.supplierId ?? existing.supplierId ?? undefined,
          contractId: dto.contractId ?? existing.contractId ?? undefined,
          purchaseRequestId: dto.purchaseRequestId ?? existing.purchaseRequestId ?? undefined,
          costCenter: dto.costCenter ?? existing.costCenter ?? undefined,
        }),
      );
    }

    return this.toDto(await this.repository.update(companyId, id, data));
  }

  async pay(companyId: string, id: string, dto: PayPayableDto): Promise<PayableDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    if (existing.status !== "ABERTO") {
      throw new BadRequestException("Só contas em aberto podem ser baixadas.");
    }
    if (dto.pagoEm > toDateOnly()) {
      throw new BadRequestException("A data de pagamento não pode estar no futuro.");
    }
    await this.repository.pay(
      id,
      {
        pagoEm: fromDateOnly(dto.pagoEm),
        valorPago: dto.valorPago ?? Number(existing.valor),
        formaPagamento: dto.formaPagamento,
      },
      existing.reimbursementId,
    );
    return this.getById(companyId, id);
  }

  async registerInvoice(companyId: string, id: string, dto: InvoiceDto): Promise<PayableDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    if (existing.status === "CANCELADO") {
      throw new BadRequestException("Contas canceladas não recebem nota fiscal.");
    }
    const payable = await this.repository.update(companyId, id, {
      notaFiscal: dto.notaFiscal,
      notaFiscalEmissao: dto.notaFiscalEmissao ? fromDateOnly(dto.notaFiscalEmissao) : null,
    });
    return this.toDto(payable);
  }

  async cancel(companyId: string, id: string): Promise<PayableDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    if (existing.status !== "ABERTO") {
      throw new BadRequestException("Só contas em aberto podem ser canceladas.");
    }
    if (existing.origem === "REEMBOLSO") {
      throw new BadRequestException("Contas de reembolso aprovado não podem ser canceladas.");
    }
    return this.toDto(await this.repository.cancel(companyId, id));
  }

  async stats(companyId: string): Promise<PayableStatsDto> {
    const today = toDateOnly();
    const { aPagar, vencido, proximos, pagoNoMes, semNotaCount } = await this.repository.stats(
      companyId,
      today,
      addDays(today, 7),
      `${today.slice(0, 7)}-01`,
    );
    return {
      aPagar: money(aPagar._sum.valor),
      aPagarCount: aPagar._count._all,
      vencido: money(vencido._sum.valor),
      vencidoCount: vencido._count._all,
      proximos7Dias: money(proximos._sum.valor),
      proximos7DiasCount: proximos._count._all,
      pagoNoMes: money(pagoNoMes._sum.valorPago),
      pagoNoMesCount: pagoNoMes._count._all,
      semNotaCount,
    };
  }

  async cashFlow(companyId: string, query: CashFlowQueryDto): Promise<CashFlowPointDto[]> {
    const currentMonth = toDateOnly().slice(0, 7);
    const firstMonth = shiftMonth(currentMonth, -(query.months - 1));
    const afterLast = shiftMonth(currentMonth, query.ahead + 1);
    const { previsto, pago } = await this.repository.cashFlow(
      companyId,
      `${firstMonth}-01`,
      `${afterLast}-01`,
      query.costCenter,
    );

    const previstoByMonth = new Map(previsto.map((row) => [row.month, row.total]));
    const pagoByMonth = new Map(pago.map((row) => [row.month, row.total]));
    const points: CashFlowPointDto[] = [];
    for (let month = firstMonth; month < afterLast; month = shiftMonth(month, 1)) {
      points.push({
        month,
        previsto: money(previstoByMonth.get(month)),
        pago: money(pagoByMonth.get(month)),
      });
    }
    return points;
  }

  async byCostCenter(companyId: string): Promise<CostCenterTotalDto[]> {
    const rows = await this.repository.byCostCenter(companyId, 8);
    return rows.map((row) => ({ costCenter: row.cost_center, aberto: money(row.aberto), pago: money(row.pago) }));
  }

  costCenters(companyId: string) {
    return this.repository.costCenters(companyId);
  }

  /**
   * Valida os vínculos e deriva a origem: pedido > contrato > manual. Fornecedor
   * e centro de custo são herdados do contrato/pedido quando não informados.
   */
  private async resolveLinks(
    companyId: string,
    input: { supplierId?: string; contractId?: string; purchaseRequestId?: string; costCenter?: string },
  ): Promise<Pick<PayableWriteData, "origem" | "supplierId" | "contractId" | "purchaseRequestId" | "costCenter">> {
    let origem: PayableSource = "MANUAL";
    let supplierId = input.supplierId;
    let costCenter = input.costCenter;

    if (input.contractId) {
      const contract = await this.repository.findLinkedContract(companyId, input.contractId);
      if (!contract) throw new BadRequestException("Contrato não encontrado.");
      if (contract.status === "CANCELADO") {
        throw new BadRequestException("Não é possível lançar contas em um contrato cancelado.");
      }
      origem = "CONTRATO";
      supplierId ??= contract.supplierId;
      costCenter ??= contract.costCenter ?? undefined;
    }

    if (input.purchaseRequestId) {
      const request = await this.repository.findLinkedPurchaseRequest(companyId, input.purchaseRequestId);
      if (!request) throw new BadRequestException("Solicitação de compra não encontrada.");
      if (request.status === "REJEITADO") {
        throw new BadRequestException("Não é possível lançar contas de uma solicitação rejeitada.");
      }
      origem = "PEDIDO";
      costCenter ??= request.costCenter ?? undefined;
    }

    if (supplierId && !(await this.repository.supplierExists(companyId, supplierId))) {
      throw new BadRequestException("Fornecedor não encontrado.");
    }

    return {
      origem,
      supplierId: supplierId ?? null,
      contractId: input.contractId ?? null,
      purchaseRequestId: input.purchaseRequestId ?? null,
      costCenter: costCenter || null,
    };
  }

  private toDto(payable: PayablePayload, today: string = toDateOnly()): PayableDto {
    const vencimento = toDateOnlyString(payable.vencimento);
    return {
      id: payable.id,
      descricao: payable.descricao,
      origem: payable.origem,
      supplierId: payable.supplierId,
      supplierName: payable.supplier?.nomeFantasia ?? null,
      contractId: payable.contractId,
      contractNumero: payable.contract?.numero ?? null,
      purchaseRequestId: payable.purchaseRequestId,
      purchaseRequestTitle: payable.purchaseRequest?.title ?? null,
      reimbursementId: payable.reimbursementId,
      costCenter: payable.costCenter,
      valor: money(payable.valor),
      vencimento,
      status: payable.status,
      vencida: payable.status === "ABERTO" && vencimento < today,
      notaFiscal: payable.notaFiscal,
      notaFiscalEmissao: toDateOnlyOrNull(payable.notaFiscalEmissao),
      notaFiscalChave: payable.notaFiscalChave,
      notaFiscalPdfUrl: payable.notaFiscalPdfPath ? `/uploads/${payable.notaFiscalPdfPath}` : null,
      notaFiscalPdfName: payable.notaFiscalPdfName,
      notaFiscalXmlUrl: payable.notaFiscalXmlPath ? `/uploads/${payable.notaFiscalXmlPath}` : null,
      notaFiscalXmlName: payable.notaFiscalXmlName,
      pagoEm: toDateOnlyOrNull(payable.pagoEm),
      valorPago: payable.valorPago ? money(payable.valorPago) : null,
      formaPagamento: payable.formaPagamento,
      observacoes: payable.observacoes,
      createdByName: payable.createdBy.name,
      createdAt: payable.createdAt.toISOString(),
    };
  }
}
