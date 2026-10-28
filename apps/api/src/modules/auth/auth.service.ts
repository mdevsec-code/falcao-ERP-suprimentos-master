import { randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { AuthUserDto, LoginResponseDto, Role } from "@falcao-erp/shared-types";
import { PrismaService } from "../../database/prisma.service";
import { UsersService } from "../users/users.service";
import { hashRefreshToken } from "./refresh-token-hash";

/**
 * Hash de uma senha qualquer: quando o e-mail não existe, comparamos contra
 * ele mesmo assim, para que a resposta demore o mesmo que uma senha errada —
 * sem isso o tempo de resposta revela quais e-mails estão cadastrados.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("falcao-dummy-password", 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(email);
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const tokens = await this.issueTokens(user.id, user.email, user.companyId, user.role);

    return {
      ...tokens,
      user: this.toAuthUserDto(user),
    };
  }

  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado.");
    }

    // Revoga o token usado numa operação só: se ele já foi trocado, revogado
    // (logout, troca de senha) ou usado agora mesmo em outra requisição, nada é
    // atualizado e a renovação é recusada.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: {
        userId: payload.sub,
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
    if (count === 0) {
      throw new UnauthorizedException("Refresh token inválido ou expirado.");
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Usuário inativo ou não encontrado.");
    }

    const tokens = await this.issueTokens(user.id, user.email, user.companyId, user.role);
    return { ...tokens, user: this.toAuthUserDto(user) };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(userId: string, email: string, companyId: string, role: Role) {
    const payload = { sub: userId, email, companyId, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("JWT_SECRET"),
      expiresIn: this.config.get<string>("JWT_ACCESS_EXPIRES_IN"),
    });

    // `jwtid` aleatório: dois tokens emitidos no mesmo segundo nunca são iguais.
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN"),
      jwtid: randomUUID(),
    });

    const decoded = this.jwtService.decode(refreshToken) as { exp: number };
    const tokenHash = hashRefreshToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private toAuthUserDto(user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    companyId: string;
    company: { name: string };
  }): AuthUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
    };
  }
}
