import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, Role, User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export interface UserFilters {
  search?: string;
  role?: Role;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: UserFilters) {
    const where: Prisma.UserWhereInput = {
      role: filters.role,
      isActive: filters.isActive,
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const client = this.prisma.forCompany(companyId);
    const [data, total] = await Promise.all([
      client.user.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      client.user.count({ where }),
    ]);
    return { data: data as User[], total };
  }

  async stats(companyId: string) {
    const client = this.prisma.forCompany(companyId);
    const [total, active, byRole] = await Promise.all([
      client.user.count(),
      client.user.count({ where: { isActive: true } }),
      client.user.groupBy({ by: ["role"], _count: { _all: true }, orderBy: { role: "asc" } }),
    ]);
    return {
      total,
      active,
      byRole: (byRole as Array<{ role: Role; _count: { _all: number } }>).map((row) => ({
        role: row.role,
        count: row._count._all,
      })),
    };
  }

  async findByIdOrThrow(companyId: string, id: string): Promise<User> {
    const user = await this.prisma.forCompany(companyId).user.findFirst({ where: { id } });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado.");
    }
    return user as User;
  }

  /** E-mail é único em toda a base (não só na empresa) — login é por e-mail. */
  emailExists(email: string) {
    return this.prisma.user.findUnique({ where: { email }, select: { id: true } });
  }

  async countActiveAdmins(companyId: string): Promise<number> {
    return this.prisma.forCompany(companyId).user.count({ where: { role: "ADMIN", isActive: true } });
  }

  async create(
    companyId: string,
    data: { name: string; email: string; role: Role; passwordHash: string },
  ): Promise<User> {
    const user = await this.prisma.forCompany(companyId).user.create({
      data: { companyId, ...data },
    });
    return user as User;
  }

  async update(
    companyId: string,
    id: string,
    data: { name?: string; role?: Role; isActive?: boolean; passwordHash?: string },
  ): Promise<User> {
    await this.findByIdOrThrow(companyId, id);
    const user = await this.prisma.forCompany(companyId).user.update({ where: { id }, data });
    return user as User;
  }

  /** Encerra todas as sessões (refresh tokens) do usuário. */
  async revokeSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
