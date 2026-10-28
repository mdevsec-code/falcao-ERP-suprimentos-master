import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { daysBetween, deadlineState, toDateOnly } from "@falcao-erp/shared-types";
import type {
  ContractDetailDto,
  ContractStatsDto,
  ContractStatus,
  ContractSummaryDto,
  PaginatedResult,
} from "@falcao-erp/shared-types";
import { fromDateOnly, money, toDateOnlyOrNull, toDateOnlyString } from "../../common/utils/date-only";
import { CreateAmendmentDto } from "./dto/create-amendment.dto";
import { CreateContractDto } from "./dto/create-contract.dto";
import { QueryContractsDto } from "./dto/query-contracts.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import {
  ContractsRepository,
  type ContractDetailPayload,
  type ContractListItemPayload,
  type ContractWriteData,
} from "./contracts.repository";
import { fileUrl } from "../../common/utils/file-url";

/** Contratos encerrados/cancelados ficam congelados (sem edição nem aditivo). */
const EDITABLE_STATUSES: ContractStatus[] = ["VIGENTE", "SUSPENSO"];

const ALLOWED_STATUS_CHANGES: Record<ContractStatus, ContractStatus[]> = {
  VIGENTE: ["SUSPENSO", "ENCERRADO", "CANCELADO"],
  SUSPENSO: ["VIGENTE", "ENCERRADO", "CANCELADO"],
  ENCERRADO: [],
  CANCELADO: [],
};

@Injectable()
export class ContractsService {
  constructor(private readonly repository: ContractsRepository) {}

  async list(companyId: string, query: QueryContractsDto): Promise<PaginatedResult<ContractSummaryDto>> {
    const today = toDateOnly();
    const { data, total } = await this.repository.findMany(companyId, {
      search: query.search,
      status: query.status,
      supplierId: query.supplierId,
      prazo: query.prazo,
      today,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      data: data.map((contract) => this.toSummaryDto(contract, today)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async stats(companyId: string): Promise<ContractStatsDto> {
    const stats = await this.repository.stats(companyId, toDateOnly());
    return { ...stats, valorVigente: money(stats.valorVigente) };
  }

  async getById(companyId: string, id: string): Promise<ContractDetailDto> {
    return this.toDetailDto(companyId, await this.repository.findByIdOrThrow(companyId, id));
  }

  async create(companyId: string, userId: string, dto: CreateContractDto): Promise<ContractDetailDto> {
    this.assertPeriod(dto.dataInicio, dto.dataFim);
    await this.assertSupplier(companyId, dto.supplierId);
    await this.assertNumeroAvailable(companyId, dto.numero);

    const contract = await this.repository.create(companyId, userId, {
      supplierId: dto.supplierId,
      numero: dto.numero.trim(),
      objeto: dto.objeto,
      descricao: dto.descricao || null,
      costCenter: dto.costCenter || null,
      valorTotal: dto.valorTotal,
      dataInicio: fromDateOnly(dto.dataInicio),
      dataFim: fromDateOnly(dto.dataFim),
      assinadoEm: dto.assinadoEm ? fromDateOnly(dto.assinadoEm) : null,
      alertaDias: dto.alertaDias,
    });
    return this.toDetailDto(companyId, contract);
  }

  async update(companyId: string, id: string, dto: UpdateContractDto): Promise<ContractDetailDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    this.assertEditable(existing.status);

    const dataInicio = dto.dataInicio ?? toDateOnlyString(existing.dataInicio);
    const dataFim = dto.dataFim ?? toDateOnlyString(existing.dataFim);
    this.assertPeriod(dataInicio, dataFim);

    if (dto.supplierId && dto.supplierId !== existing.supplierId) {
      await this.assertSupplier(companyId, dto.supplierId);
    }
    if (dto.numero && dto.numero.trim() !== existing.numero) {
      await this.assertNumeroAvailable(companyId, dto.numero);
    }

    const data: ContractWriteData = {
      supplierId: dto.supplierId,
      numero: dto.numero?.trim(),
      objeto: dto.objeto,
      descricao: dto.descricao === undefined ? undefined : dto.descricao || null,
      costCenter: dto.costCenter === undefined ? undefined : dto.costCenter || null,
      valorTotal: dto.valorTotal,
      dataInicio: dto.dataInicio ? fromDateOnly(dto.dataInicio) : undefined,
      dataFim: dto.dataFim ? fromDateOnly(dto.dataFim) : undefined,
      assinadoEm:
        dto.assinadoEm === undefined ? undefined : dto.assinadoEm ? fromDateOnly(dto.assinadoEm) : null,
      alertaDias: dto.alertaDias,
    };
    return this.toDetailDto(companyId, await this.repository.update(companyId, id, data));
  }

  async changeStatus(companyId: string, id: string, status: ContractStatus): Promise<ContractDetailDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    if (!ALLOWED_STATUS_CHANGES[existing.status].includes(status)) {
      throw new BadRequestException(`Não é possível mover o contrato de "${existing.status}" para "${status}".`);
    }
    return this.toDetailDto(companyId, await this.repository.setStatus(companyId, id, status));
  }

  async addAmendment(
    companyId: string,
    id: string,
    authorId: string,
    dto: CreateAmendmentDto,
  ): Promise<ContractDetailDto> {
    const existing = await this.repository.findByIdOrThrow(companyId, id);
    this.assertEditable(existing.status);

    if (dto.valorDelta === undefined && !dto.novaDataFim) {
      throw new BadRequestException("Informe a alteração de valor e/ou a nova data de término.");
    }
    if (dto.novaDataFim && dto.novaDataFim < toDateOnlyString(existing.dataInicio)) {
      throw new BadRequestException("A nova data de término não pode ser anterior ao início do contrato.");
    }

    const novoValorTotal = Number(existing.valorTotal) + (dto.valorDelta ?? 0);
    if (novoValorTotal < 0) {
      throw new BadRequestException("A supressão deixaria o valor do contrato negativo.");
    }

    await this.repository.addAmendment(id, authorId, dto, Number(novoValorTotal.toFixed(2)));
    return this.getById(companyId, id);
  }

  private assertEditable(status: ContractStatus) {
    if (!EDITABLE_STATUSES.includes(status)) {
      throw new BadRequestException("Contratos encerrados ou cancelados não podem ser alterados.");
    }
  }

  private assertPeriod(dataInicio: string, dataFim: string) {
    if (dataFim < dataInicio) {
      throw new BadRequestException("A data de término deve ser igual ou posterior à data de início.");
    }
  }

  private async assertSupplier(companyId: string, supplierId: string) {
    if (!(await this.repository.supplierExists(companyId, supplierId))) {
      throw new BadRequestException("Fornecedor não encontrado.");
    }
  }

  private async assertNumeroAvailable(companyId: string, numero: string) {
    if (await this.repository.findByNumero(companyId, numero.trim())) {
      throw new ConflictException("Já existe um contrato com este número.");
    }
  }

  private toSummaryDto(contract: ContractListItemPayload, today: string): ContractSummaryDto {
    const dataFim = toDateOnlyString(contract.dataFim);
    return {
      id: contract.id,
      numero: contract.numero,
      objeto: contract.objeto,
      supplierId: contract.supplierId,
      supplierName: contract.supplier.nomeFantasia,
      costCenter: contract.costCenter,
      valorTotal: money(contract.valorTotal),
      dataInicio: toDateOnlyString(contract.dataInicio),
      dataFim,
      status: contract.status,
      alertaDias: contract.alertaDias,
      prazo: contract.status === "VIGENTE" ? deadlineState(dataFim, contract.alertaDias, today) : null,
      diasRestantes: daysBetween(today, dataFim),
      amendmentCount: contract._count.amendments,
    };
  }

  private async toDetailDto(companyId: string, contract: ContractDetailPayload): Promise<ContractDetailDto> {
    const totals = await this.repository.payableTotals(companyId, contract.id);
    return {
      ...this.toSummaryDto(contract, toDateOnly()),
      descricao: contract.descricao,
      assinadoEm: toDateOnlyOrNull(contract.assinadoEm),
      createdByName: contract.createdBy.name,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      amendments: contract.amendments.map((amendment) => ({
        id: amendment.id,
        numero: amendment.numero,
        descricao: amendment.descricao,
        valorDelta: amendment.valorDelta ? money(amendment.valorDelta) : null,
        novaDataFim: toDateOnlyOrNull(amendment.novaDataFim),
        authorId: amendment.authorId,
        authorName: amendment.author.name,
        createdAt: amendment.createdAt.toISOString(),
      })),
      documents: contract.documents.map((document) => ({
        id: document.id,
        titulo: document.titulo,
        fileName: document.fileName,
        size: document.size,
        url: fileUrl(document.filePath),
        uploadedByName: document.uploadedBy.name,
        createdAt: document.createdAt.toISOString(),
      })),
      totalLancado: money(totals.lancado),
      totalPago: money(totals.pago),
    };
  }
}
