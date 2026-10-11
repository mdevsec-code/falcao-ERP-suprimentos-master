import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { AuditService } from "./audit.service";
import { QueryAuditLogsDto } from "./dto/query-audit-logs.dto";

@Roles("ADMIN", "AUDITOR")
@Controller("audit-logs")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryAuditLogsDto) {
    return this.auditService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.auditService.stats(user.companyId);
  }
}
