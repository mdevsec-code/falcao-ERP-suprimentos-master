import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { addDays, daysBetween } from "@falcao-erp/shared-types";
import type { AgendaItemDto } from "@falcao-erp/shared-types";
import {
  AGENDA_MANAGE_ROLES,
  CONTRACT_READ_ROLES,
  FINANCE_READ_ROLES,
} from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { fromDateOnly, money, toDateOnlyString } from "../../common/utils/date-only";
import { CreateAgendaEventDto, UpdateAgendaEventDto } from "./dto/agenda-event.dto";
import { QueryAgendaDto } from "./dto/query-agenda.dto";
import { AgendaRepository, type AgendaEventPayload, type AgendaEventWriteData } from "./agenda.repository";

/** Um trimestre cobre a visão mensal com folga. */
const MAX_RANGE_DAYS = 92;

@Injectable()
export class AgendaService {
  constructor(private readonly repository: AgendaRepository) {}

  /**
   * Agenda unificada: eventos criados aqui + prazos dos outros módulos
   * (vencimento de contas, término de contratos, validade de documentos),
   * cada um só para quem pode consultar o módulo de origem.
   */
  async list(user: AuthenticatedUser, query: QueryAgendaDto): Promise<AgendaItemDto[]> {
    const span = daysBetween(query.from, query.to);
    if (span < 0) throw new BadRequestException("A data final deve ser igual ou posterior à inicial.");
    if (span > MAX_RANGE_DAYS) throw new BadRequestException(`Consulte no máximo ${MAX_RANGE_DAYS} dias por vez.`);

    const obra = query.obra?.trim() || undefined;
    const canFinance = FINANCE_READ_ROLES.includes(user.role);
    const canContracts = CONTRACT_READ_ROLES.includes(user.role);

    // Eventos com hora: a janela ganha um dia de cada lado para cobrir qualquer
    // fuso; o Web posiciona cada evento pela data local de quem está vendo.
    const [events, payables, contracts, documents] = await Promise.all([
      this.repository.events(
        user.companyId,
        fromDateOnly(addDays(query.from, -1)),
        fromDateOnly(addDays(query.to, 2)),
        obra,
      ),
      canFinance ? this.repository.payablesDue(user.companyId, query.from, query.to, obra) : [],
      canContracts ? this.repository.contractsEnding(user.companyId, query.from, query.to, obra) : [],
      obra ? [] : this.repository.documentsExpiring(user.companyId, query.from, query.to),
    ]);

    const base = {
      fim: null,
      diaInteiro: true,
      tipo: null,
      local: null,
      descricao: null,
      valor: null,
      supplierId: null,
      supplierName: null,
      purchaseRequestId: null,
      createdById: null,
    } satisfies Partial<AgendaItemDto>;

    const items: AgendaItemDto[] = [
      ...events.map((event) => this.toEventItem(event)),
      ...payables.map((payable) => ({
        ...base,
        key: `payable-${payable.id}`,
        kind: "PAYABLE_DUE" as const,
        sourceId: payable.id,
        titulo: payable.descricao,
        inicio: toDateOnlyString(payable.vencimento),
        obra: payable.costCenter,
        valor: money(payable.valor),
        supplierId: payable.supplierId,
        supplierName: payable.supplier?.nomeFantasia ?? null,
      })),
      ...contracts.map((contract) => ({
        ...base,
        key: `contract-${contract.id}`,
        kind: "CONTRACT_END" as const,
        sourceId: contract.id,
        titulo: `${contract.numero} · ${contract.objeto}`,
        inicio: toDateOnlyString(contract.dataFim),
        obra: contract.costCenter,
        valor: money(contract.valorTotal),
        supplierId: contract.supplierId,
        supplierName: contract.supplier.nomeFantasia,
      })),
      ...documents.map((document) => ({
        ...base,
        key: `document-${document.id}`,
        kind: "DOCUMENT_EXPIRY" as const,
        sourceId: document.id,
        titulo: document.titulo,
        inicio: toDateOnlyString(document.validoAte as Date),
        obra: null,
        supplierId: document.supplierId,
        supplierName: document.supplier?.nomeFantasia ?? null,
      })),
    ];

    return items.sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  obras(companyId: string) {
    return this.repository.obras(companyId);
  }

  async createEvent(user: AuthenticatedUser, dto: CreateAgendaEventDto): Promise<AgendaItemDto> {
    const data = await this.toWriteData(user.companyId, dto);
    const event = await this.repository.createEvent(user.companyId, user.userId, {
      ...data,
      titulo: dto.titulo,
      tipo: dto.tipo,
      inicio: new Date(dto.inicio),
    });
    return this.toEventItem(event);
  }

  async updateEvent(user: AuthenticatedUser, id: string, dto: UpdateAgendaEventDto): Promise<AgendaItemDto> {
    const existing = await this.repository.findEventOrThrow(user.companyId, id);
    this.assertCanManage(user, existing);
    const data = await this.toWriteData(user.companyId, {
      ...dto,
      inicio: dto.inicio ?? existing.inicio.toISOString(),
      // `null` limpa o término; ausente mantém o atual.
      fim: dto.fim === undefined ? existing.fim?.toISOString() : dto.fim,
    });
    return this.toEventItem(await this.repository.updateEvent(user.companyId, id, data));
  }

  async deleteEvent(user: AuthenticatedUser, id: string): Promise<void> {
    const existing = await this.repository.findEventOrThrow(user.companyId, id);
    this.assertCanManage(user, existing);
    await this.repository.deleteEvent(user.companyId, id);
  }

  private assertCanManage(user: AuthenticatedUser, event: AgendaEventPayload) {
    if (event.createdById !== user.userId && !AGENDA_MANAGE_ROLES.includes(user.role)) {
      throw new ForbiddenException("Só quem criou o evento (ou um gestor) pode alterá-lo.");
    }
  }

  private async toWriteData(companyId: string, dto: UpdateAgendaEventDto): Promise<AgendaEventWriteData> {
    const inicio = dto.inicio ? new Date(dto.inicio) : undefined;
    const fim = dto.fim ? new Date(dto.fim) : undefined;
    if (inicio && fim && fim < inicio) {
      throw new BadRequestException("O término deve ser igual ou posterior ao início.");
    }
    if (dto.supplierId && !(await this.repository.supplierExists(companyId, dto.supplierId))) {
      throw new BadRequestException("Fornecedor não encontrado.");
    }
    if (dto.purchaseRequestId && !(await this.repository.purchaseRequestExists(companyId, dto.purchaseRequestId))) {
      throw new BadRequestException("Solicitação de compra não encontrada.");
    }
    return {
      titulo: dto.titulo,
      tipo: dto.tipo,
      inicio,
      fim: fim ?? null,
      diaInteiro: dto.diaInteiro,
      descricao: dto.descricao === undefined ? undefined : dto.descricao || null,
      obra: dto.obra === undefined ? undefined : dto.obra.trim() || null,
      local: dto.local === undefined ? undefined : dto.local || null,
      supplierId: dto.supplierId === undefined ? undefined : dto.supplierId || null,
      purchaseRequestId: dto.purchaseRequestId === undefined ? undefined : dto.purchaseRequestId || null,
    };
  }

  private toEventItem(event: AgendaEventPayload): AgendaItemDto {
    return {
      key: `event-${event.id}`,
      kind: "EVENT",
      sourceId: event.id,
      titulo: event.titulo,
      inicio: event.inicio.toISOString(),
      fim: event.fim?.toISOString() ?? null,
      diaInteiro: event.diaInteiro,
      tipo: event.tipo,
      obra: event.obra,
      local: event.local,
      descricao: event.descricao,
      valor: null,
      supplierId: event.supplierId,
      supplierName: event.supplier?.nomeFantasia ?? null,
      purchaseRequestId: event.purchaseRequestId,
      createdById: event.createdById,
    };
  }
}
