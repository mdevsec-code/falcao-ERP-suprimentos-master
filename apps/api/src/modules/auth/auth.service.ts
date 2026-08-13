import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { AuthUserDto, LoginResponseDto, Role } from "@falcao-erp/shared-types";
import { PrismaService } from "../../database/prisma.service";
import { UsersService } from "../users/users.service";

const REFRESH_TOKEN_ROUNDS = 10;

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
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
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

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    const matching = await this.findMatchingToken(storedTokens, refreshToken);
    if (!matching) {
      throw new UnauthorizedException("Refresh token inválido ou expirado.");
    }

    await this.prisma.refreshToken.update({
      where: { id: matching.id },
      data: { revokedAt: new Date() },
    });

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

  private async findMatchingToken(
    tokens: { id: string; tokenHash: string }[],
    rawToken: string,
  ) {
    for (const token of tokens) {
      if (await bcrypt.compare(rawToken, token.tokenHash)) {
        return token;
      }
    }
    return null;
  }

  private async issueTokens(userId: string, email: string, companyId: string, role: Role) {
    const payload = { sub: userId, email, companyId, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("JWT_SECRET"),
      expiresIn: this.config.get<string>("JWT_ACCESS_EXPIRES_IN"),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN"),
    });

    const decoded = this.jwtService.decode(refreshToken) as { exp: number };
    const tokenHash = await bcrypt.hash(refreshToken, REFRESH_TOKEN_ROUNDS);

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
