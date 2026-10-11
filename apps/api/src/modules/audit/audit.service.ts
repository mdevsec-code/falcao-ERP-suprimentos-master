import { Injectable } from "@nestjs/common";
import type {
  AuditLogEntryDto,
  AuditLogStatsDto,
  PaginatedResult,
} from "@falcao-erp/shared-types";
import { AuditRepository, type AuditLogPayload } from "./audit.repository";
import { QueryAuditLogsDto } from "./dto/query-audit-logs.dto";

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async list(
    companyId: string,
    query: QueryAuditLogsDto,
  ): Promise<PaginatedResult<AuditLogEntryDto>> {
    const { data, total } = await this.repository.findMany(companyId, {
      search: query.search,
      action: query.action,
      entityType: query.entityType,
      userId: query.userId,
      from: query.from ? startOfDay(query.from) : undefined,
      to: query.to ? endOfDay(query.to) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      data: data.map(toEntryDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  stats(companyId: string): Promise<AuditLogStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.repository.stats(companyId, today);
  }
}

/** `YYYY-MM-DD` → 00:00:00.000 no fuso do servidor. */
function startOfDay(date: string): Date {
  return new Date(`${date.slice(0, 10)}T00:00:00`);
}

/** `YYYY-MM-DD` → 23:59:59.999 no fuso do servidor (o filtro "até" é inclusivo). */
function endOfDay(date: string): Date {
  return new Date(`${date.slice(0, 10)}T23:59:59.999`);
}

function toEntryDto(log: AuditLogPayload): AuditLogEntryDto {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    changes: (log.changes as { after?: unknown } | null) ?? null,
    userId: log.userId,
    userName: log.user.name,
    userEmail: log.user.email,
    createdAt: log.createdAt.toISOString(),
  };
}
