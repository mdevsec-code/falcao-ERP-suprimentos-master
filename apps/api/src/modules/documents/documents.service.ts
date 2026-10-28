import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { extname } from "node:path";
import { addDays, DOCUMENT_ALERT_DAYS, deadlineState, toDateOnly } from "@falcao-erp/shared-types";
import type { DocumentDto, DocumentStatsDto, PaginatedResult } from "@falcao-erp/shared-types";
import { DOCUMENT_MANAGE_ROLES } from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { fromDateOnly, toDateOnlyOrNull } from "../../common/utils/date-only";
import { decodeUploadName } from "../../common/utils/file-name";
import { STORAGE_PROVIDER, type IStorageProvider } from "../storage/storage-provider.interface";
import { DocumentFieldsDto } from "./dto/document-fields.dto";
import { QueryDocumentsDto } from "./dto/query-documents.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { canSeeSensitiveDocuments, documentVisibilityWhere, isSensitiveDocument } from "./document-access";
import { DocumentsRepository, type DocumentPayload, type DocumentWriteData } from "./documents.repository";
import { fileUrl } from "../../common/utils/file-url";

/** Extensões cujo texto é indexado para a busca por conteúdo. */
const TEXT_EXTENSIONS = new Set([".txt", ".csv", ".md", ".json", ".xml", ".log"]);
const MAX_INDEXED_CHARS = 500_000;

function extractText(fileName: string, mimeType: string, buffer: Buffer): string | null {
  const isText = mimeType.startsWith("text/") || TEXT_EXTENSIONS.has(extname(fileName).toLowerCase());
  if (!isText) return null;
  // Postgres não aceita o caractere NUL em colunas de texto.
  const text = buffer.toString("utf8").split("\u0000").join("").trim();
  return text ? text.slice(0, MAX_INDEXED_CHARS) : null;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly repository: DocumentsRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async list(user: AuthenticatedUser, query: QueryDocumentsDto): Promise<PaginatedResult<DocumentDto>> {
    const today = toDateOnly();
    const { data, total } = await this.repository.findMany(user.companyId, {
      search: query.search,
      categoria: query.categoria,
      tag: query.tag,
      validade: query.validade,
      supplierId: query.supplierId,
      contractId: query.contractId,
      today,
      alertUntil: addDays(today, DOCUMENT_ALERT_DAYS),
      page: query.page,
      pageSize: query.pageSize,
    }, documentVisibilityWhere(user.role));
    return {
      data: data.map((document) => this.toDto(document, today)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async stats(user: AuthenticatedUser): Promise<DocumentStatsDto> {
    const today = toDateOnly();
    return this.repository.stats(user.companyId, today, addDays(today, DOCUMENT_ALERT_DAYS), documentVisibilityWhere(user.role));
  }

  tags(user: AuthenticatedUser) {
    return this.repository.tags(user.companyId, !canSeeSensitiveDocuments(user.role));
  }

  async getById(user: AuthenticatedUser, id: string): Promise<DocumentDto> {
    return this.toDto(await this.findVisibleOrThrow(user, id));
  }

  /** O documento, se o perfil pode vê-lo; senão o mesmo 404 de um id inexistente. */
  private async findVisibleOrThrow(user: AuthenticatedUser, id: string): Promise<DocumentPayload> {
    const document = await this.repository.findByIdOrThrow(user.companyId, id);
    if (isSensitiveDocument(document) && !canSeeSensitiveDocuments(user.role)) {
      throw new NotFoundException("Documento não encontrado.");
    }
    return document;
  }

  /** Quem não vê documentos sigilosos também não cria nem transforma um documento em sigiloso. */
  private assertCanWriteSensitive(user: AuthenticatedUser, document: { categoria: string; contractId: string | null | undefined }) {
    if (isSensitiveDocument(document) && !canSeeSensitiveDocuments(user.role)) {
      throw new ForbiddenException("Documentos de contrato e notas fiscais são enviados por compras, financeiro ou gestão.");
    }
  }

  async upload(
    user: AuthenticatedUser,
    dto: DocumentFieldsDto,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<DocumentDto> {
    this.assertCanWriteSensitive(user, { categoria: dto.categoria, contractId: dto.contractId });
    await this.assertLinks(user.companyId, dto.supplierId, dto.contractId);

    const fileName = decodeUploadName(file.originalname);
    const stored = await this.storage.save(file.buffer, { folder: "documents", fileName });
    const document = await this.repository.create(user.companyId, {
      titulo: dto.titulo,
      descricao: dto.descricao || null,
      categoria: dto.categoria,
      tags: dto.tags ?? [],
      validoAte: dto.validoAte ? fromDateOnly(dto.validoAte) : null,
      supplierId: dto.supplierId ?? null,
      contractId: dto.contractId ?? null,
      fileName,
      filePath: stored.path,
      mimeType: file.mimetype,
      size: stored.size,
      conteudo: extractText(fileName, file.mimetype, file.buffer),
      uploadedById: user.userId,
    });
    return this.toDto(document);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateDocumentDto): Promise<DocumentDto> {
    const existing = await this.findVisibleOrThrow(user, id);
    this.assertCanManage(user, existing);
    this.assertCanWriteSensitive(user, {
      categoria: dto.categoria ?? existing.categoria,
      contractId: dto.contractId === undefined ? existing.contractId : dto.contractId || null,
    });
    await this.assertLinks(user.companyId, dto.supplierId ?? undefined, dto.contractId ?? undefined);

    const data: DocumentWriteData = {
      titulo: dto.titulo,
      categoria: dto.categoria,
      tags: dto.tags,
      descricao: dto.descricao === undefined ? undefined : dto.descricao || null,
      validoAte: dto.validoAte === undefined ? undefined : dto.validoAte ? fromDateOnly(dto.validoAte) : null,
      supplierId: dto.supplierId === undefined ? undefined : dto.supplierId || null,
      contractId: dto.contractId === undefined ? undefined : dto.contractId || null,
    };
    return this.toDto(await this.repository.update(user.companyId, id, data));
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const existing = await this.findVisibleOrThrow(user, id);
    this.assertCanManage(user, existing);
    await this.repository.delete(user.companyId, id);
    await this.storage.delete(existing.filePath);
  }

  private assertCanManage(user: AuthenticatedUser, document: DocumentPayload) {
    if (document.uploadedById !== user.userId && !DOCUMENT_MANAGE_ROLES.includes(user.role)) {
      throw new ForbiddenException("Só quem enviou o documento (ou um gestor) pode alterá-lo.");
    }
  }

  private async assertLinks(companyId: string, supplierId?: string, contractId?: string) {
    if (supplierId && !(await this.repository.supplierExists(companyId, supplierId))) {
      throw new BadRequestException("Fornecedor não encontrado.");
    }
    if (contractId && !(await this.repository.contractExists(companyId, contractId))) {
      throw new BadRequestException("Contrato não encontrado.");
    }
  }

  private toDto(document: DocumentPayload, today: string = toDateOnly()): DocumentDto {
    const validoAte = toDateOnlyOrNull(document.validoAte);
    return {
      id: document.id,
      titulo: document.titulo,
      descricao: document.descricao,
      categoria: document.categoria,
      tags: document.tags,
      validoAte,
      validade: validoAte ? deadlineState(validoAte, DOCUMENT_ALERT_DAYS, today) : "SEM_VALIDADE",
      fileName: document.fileName,
      mimeType: document.mimeType,
      size: document.size,
      url: fileUrl(document.filePath),
      conteudoIndexado: document.conteudo !== null,
      supplierId: document.supplierId,
      supplierName: document.supplier?.nomeFantasia ?? null,
      contractId: document.contractId,
      contractNumero: document.contract?.numero ?? null,
      uploadedById: document.uploadedById,
      uploadedByName: document.uploadedBy.name,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
