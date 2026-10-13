import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import type {
  PaginatedResult,
  UserStatsDto,
  UserSummaryDto,
} from "@falcao-erp/shared-types";
import type { User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersRepository } from "./users.repository";

const PASSWORD_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: UsersRepository,
  ) {}

  // ── Usados pela autenticação (sem escopo de empresa: o login ainda não sabe qual é) ──

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  // ── Administração de usuários (escopo da empresa do administrador) ──

  async list(companyId: string, query: QueryUsersDto): Promise<PaginatedResult<UserSummaryDto>> {
    const { data, total } = await this.repository.findMany(companyId, {
      search: query.search,
      role: query.role,
      isActive: query.isActive === undefined ? undefined : query.isActive === "true",
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      data: data.map(toSummaryDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  stats(companyId: string): Promise<UserStatsDto> {
    return this.repository.stats(companyId);
  }

  async getById(companyId: string, id: string): Promise<UserSummaryDto> {
    return toSummaryDto(await this.repository.findByIdOrThrow(companyId, id));
  }

  async create(companyId: string, dto: CreateUserDto): Promise<UserSummaryDto> {
    if (await this.repository.emailExists(dto.email)) {
      throw new ConflictException("Já existe um usuário com este e-mail.");
    }
    const user = await this.repository.create(companyId, {
      name: dto.name.trim(),
      email: dto.email,
      role: dto.role,
      passwordHash: await bcrypt.hash(dto.password, PASSWORD_ROUNDS),
    });
    return toSummaryDto(user);
  }

  async update(
    companyId: string,
    actorId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserSummaryDto> {
    const target = await this.repository.findByIdOrThrow(companyId, id);

    // Um administrador não pode se trancar para fora do sistema.
    if (id === actorId && (dto.isActive === false || (dto.role && dto.role !== target.role))) {
      throw new BadRequestException(
        "Você não pode desativar nem alterar o perfil do seu próprio usuário.",
      );
    }

    const losesAdmin =
      target.role === "ADMIN" &&
      target.isActive &&
      (dto.isActive === false || (dto.role !== undefined && dto.role !== "ADMIN"));
    if (losesAdmin && (await this.repository.countActiveAdmins(companyId)) <= 1) {
      throw new BadRequestException("A empresa precisa de ao menos um administrador ativo.");
    }

    const user = await this.repository.update(companyId, id, {
      name: dto.name?.trim(),
      role: dto.role,
      isActive: dto.isActive,
    });

    if (dto.isActive === false) {
      await this.repository.revokeSessions(id);
    }
    return toSummaryDto(user);
  }

  async resetPassword(companyId: string, id: string, password: string): Promise<void> {
    await this.repository.update(companyId, id, {
      passwordHash: await bcrypt.hash(password, PASSWORD_ROUNDS),
    });
    await this.repository.revokeSessions(id);
  }

  // ── Perfil do próprio usuário ──

  async updateProfile(companyId: string, userId: string, name: string): Promise<UserSummaryDto> {
    const user = await this.repository.update(companyId, userId, { name: name.trim() });
    return toSummaryDto(user);
  }

  async changePassword(companyId: string, userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.repository.findByIdOrThrow(companyId, userId);
    // 400 (e não 401): o usuário está autenticado, só errou a senha — um 401
    // faria o cliente achar que a sessão expirou e deslogar.
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException("A senha atual está incorreta.");
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException("A nova senha deve ser diferente da atual.");
    }
    await this.repository.update(companyId, userId, {
      passwordHash: await bcrypt.hash(dto.newPassword, PASSWORD_ROUNDS),
    });
  }
}

/** Nunca expõe `passwordHash` — inclusive no snapshot que o AuditLogInterceptor grava. */
function toSummaryDto(user: User): UserSummaryDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
