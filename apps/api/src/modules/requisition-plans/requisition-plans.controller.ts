import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { QUOTATION_READ_ROLES, QUOTATION_WRITE_ROLES } from "../../common/constants/module-roles";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import {
  CreateRequisitionPlanDto,
  LaunchRequisitionPlanDto,
  QueryPlanCandidatesDto,
  QueryRequisitionPlansDto,
  UpdateRequisitionPlanDto,
} from "./dto/requisition-plan.dto";
import { RequisitionPlansService } from "./requisition-plans.service";

/** Plano de requisição: mesmos papéis das cotações (é a porta de entrada delas). */
@Roles(...QUOTATION_READ_ROLES)
@Controller("requisition-plans")
export class RequisitionPlansController {
  constructor(private readonly plansService: RequisitionPlansService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryRequisitionPlansDto) {
    return this.plansService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.plansService.stats(user.companyId);
  }

  @Get("candidates")
  candidates(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryPlanCandidatesDto) {
    return this.plansService.candidates(user.companyId, query);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.plansService.getById(user, id);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("RequisitionPlan", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRequisitionPlanDto) {
    return this.plansService.create(user, dto);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("RequisitionPlan", "UPDATE")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequisitionPlanDto,
  ) {
    return this.plansService.update(user, id, dto);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("RequisitionPlan", "UPDATE")
  @Post(":id/launch")
  launch(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: LaunchRequisitionPlanDto,
  ) {
    return this.plansService.launch(user, id, dto);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("RequisitionPlan", "UPDATE")
  @Post(":id/cancel")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.plansService.cancel(user, id);
  }
}
