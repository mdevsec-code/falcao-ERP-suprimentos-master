import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { FINANCE_READ_ROLES, FINANCE_WRITE_ROLES } from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { CashFlowQueryDto } from "./dto/cash-flow-query.dto";
import { CreatePayableDto } from "./dto/create-payable.dto";
import { InvoiceDto } from "./dto/invoice.dto";
import { PayPayableDto } from "./dto/pay-payable.dto";
import { QueryPayablesDto } from "./dto/query-payables.dto";
import { UpdatePayableDto } from "./dto/update-payable.dto";
import { PayablesService } from "./payables.service";

@Roles(...FINANCE_READ_ROLES)
@Controller("payables")
export class PayablesController {
  constructor(private readonly payablesService: PayablesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryPayablesDto) {
    return this.payablesService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.payablesService.stats(user.companyId);
  }

  @Get("cash-flow")
  cashFlow(@CurrentUser() user: AuthenticatedUser, @Query() query: CashFlowQueryDto) {
    return this.payablesService.cashFlow(user.companyId, query);
  }

  @Get("by-cost-center")
  byCostCenter(@CurrentUser() user: AuthenticatedUser) {
    return this.payablesService.byCostCenter(user.companyId);
  }

  @Get("cost-centers")
  costCenters(@CurrentUser() user: AuthenticatedUser) {
    return this.payablesService.costCenters(user.companyId);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.payablesService.getById(user.companyId, id);
  }

  @Roles(...FINANCE_WRITE_ROLES)
  @AuditLog("Payable", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePayableDto) {
    return this.payablesService.create(user.companyId, user.userId, dto);
  }

  @Roles(...FINANCE_WRITE_ROLES)
  @AuditLog("Payable", "UPDATE")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdatePayableDto) {
    return this.payablesService.update(user.companyId, id, dto);
  }

  @Roles(...FINANCE_WRITE_ROLES)
  @AuditLog("Payable", "UPDATE")
  @Patch(":id/pay")
  pay(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: PayPayableDto) {
    return this.payablesService.pay(user.companyId, id, dto);
  }

  @Roles(...FINANCE_WRITE_ROLES)
  @AuditLog("Payable", "UPDATE")
  @Patch(":id/invoice")
  registerInvoice(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: InvoiceDto) {
    return this.payablesService.registerInvoice(user.companyId, id, dto);
  }

  @Roles(...FINANCE_WRITE_ROLES)
  @AuditLog("Payable", "UPDATE")
  @Patch(":id/cancel")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.payablesService.cancel(user.companyId, id);
  }
}
