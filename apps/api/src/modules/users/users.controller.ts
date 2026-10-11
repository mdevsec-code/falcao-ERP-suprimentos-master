import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Perfil do próprio usuário (qualquer papel) — declarado antes de ":id" ──

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getById(user.companyId, user.userId);
  }

  @AuditLog("User", "UPDATE")
  @Patch("me")
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.companyId, user.userId, dto.name);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch("me/password")
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.companyId, user.userId, dto);
  }

  // ── Administração (somente ADMIN) ──

  @Roles("ADMIN")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryUsersDto) {
    return this.usersService.list(user.companyId, query);
  }

  @Roles("ADMIN")
  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.stats(user.companyId);
  }

  @Roles("ADMIN")
  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.getById(user.companyId, id);
  }

  @Roles("ADMIN")
  @AuditLog("User", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.companyId, dto);
  }

  @Roles("ADMIN")
  @AuditLog("User", "UPDATE")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.companyId, user.userId, id, dto);
  }

  @Roles("ADMIN")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(":id/password")
  resetPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(user.companyId, id, dto.password);
  }
}
