import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AGENDA_WRITE_ROLES } from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { CreateAgendaEventDto, UpdateAgendaEventDto } from "./dto/agenda-event.dto";
import { QueryAgendaDto } from "./dto/query-agenda.dto";
import { AgendaService } from "./agenda.service";

@Controller("agenda")
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryAgendaDto) {
    return this.agendaService.list(user, query);
  }

  @Get("obras")
  obras(@CurrentUser() user: AuthenticatedUser) {
    return this.agendaService.obras(user.companyId);
  }

  @Roles(...AGENDA_WRITE_ROLES)
  @AuditLog("AgendaEvent", "CREATE")
  @Post("events")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAgendaEventDto) {
    return this.agendaService.createEvent(user, dto);
  }

  @Roles(...AGENDA_WRITE_ROLES)
  @AuditLog("AgendaEvent", "UPDATE")
  @Patch("events/:id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateAgendaEventDto) {
    return this.agendaService.updateEvent(user, id, dto);
  }

  @Roles(...AGENDA_WRITE_ROLES)
  @AuditLog("AgendaEvent", "DELETE")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("events/:id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.agendaService.deleteEvent(user, id);
  }
}
