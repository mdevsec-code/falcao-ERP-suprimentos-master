import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Role } from "@falcao-erp/shared-types";
import type { AuthenticatedUser } from "../../../common/types/auth-request";
import { UsersService } from "../../users/users.service";

interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET")!,
    });
  }

  /**
   * Confere o usuário no banco a cada requisição: quem foi desativado perde o
   * acesso na hora, e uma troca de perfil vale imediatamente — sem isso o
   * access token antigo seguiria valendo (com o papel antigo) até expirar.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Sessão inválida. Entre novamente.");
    }
    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };
  }
}
