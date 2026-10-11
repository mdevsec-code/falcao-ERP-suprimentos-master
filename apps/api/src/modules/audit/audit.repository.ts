import { Injectable } from "@nestjs/common";
import type { AuditAction, Prisma } from "../../../generated/prisma";
import { PrismaService } from "../../database/prisma.service";

export interface AuditLogFilters {
  search?: string;
  action?: AuditAction;
  entityType?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

const listInclude = {
  user: { select: { name: true, email: true } },
} satisfies Prisma.AuditLogInclude;

export type AuditLogPayload = Prisma.AuditLogGetPayload<{ include: typeof listInclude }>;

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: AuditLogFilters) {
    const where: Prisma.AuditLogWhereInput = {
      action: filters.action,
      entityType: filters.entityType,
      userId: filters.userId,
      createdAt: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined,
      ...(filters.search
        ? {
            OR: [
              { entityId: { contains: filters.search } },
              { user: { name: { contains: filters.search, mode: "insensitive" } } },
              { user: { email: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.auditLog.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.auditLog.count({ where }),
    ]);
    return { data: data as unknown as AuditLogPayload[], total };
  }

  async stats(companyId: string, startOfToday: Date) {
    const client = this.prisma.forCompany(companyId);
    const [total, today, byAction, entityTypes] = await Promise.all([
      client.auditLog.count(),
      client.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
      client.auditLog.groupBy({
        by: ["action"],
        _count: { _all: true },
        orderBy: { action: "asc" },
      }),
      client.auditLog.groupBy({ by: ["entityType"], orderBy: { entityType: "asc" } }),
    ]);
    return {
      total,
      today,
      byAction: (byAction as Array<{ action: AuditAction; _count: { _all: number } }>).map(
        (row) => ({ action: row.action, count: row._count._all }),
      ),
      entityTypes: (entityTypes as Array<{ entityType: string }>).map((row) => row.entityType),
    };
  }
}
