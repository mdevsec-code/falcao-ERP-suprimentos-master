import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { DISCIPLINE_WRITE_ROLES } from "../../common/constants/module-roles";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { DisciplinesService } from "./disciplines.service";
import { CreateDisciplineDto, UpdateDisciplineDto } from "./dto/discipline.dto";

@Controller("disciplines")
export class DisciplinesController {
  constructor(private readonly disciplinesService: DisciplinesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query("includeInactive") includeInactive?: string) {
    return this.disciplinesService.list(user.companyId, includeInactive === "true");
  }

  @Roles(...DISCIPLINE_WRITE_ROLES)
  @AuditLog("Discipline", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDisciplineDto) {
    return this.disciplinesService.create(user.companyId, dto);
  }

  @Roles(...DISCIPLINE_WRITE_ROLES)
  @AuditLog("Discipline", "UPDATE")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisciplineDto,
  ) {
    return this.disciplinesService.update(user.companyId, id, dto);
  }
}
