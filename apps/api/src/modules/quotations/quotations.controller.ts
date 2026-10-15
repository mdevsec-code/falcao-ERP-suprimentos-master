import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from "@nestjs/common";
import { QUOTATION_READ_ROLES, QUOTATION_WRITE_ROLES } from "../../common/constants/module-roles";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import {
  AddQuotationSupplierDto,
  CreateQuotationDto,
  QueryQuotationsDto,
  SetWinnerDto,
  SubmitQuotationPricesDto,
  UpdateQuotationDto,
} from "./dto/quotation.dto";
import { QuotationsService } from "./quotations.service";

@Roles(...QUOTATION_READ_ROLES)
@Controller("quotations")
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryQuotationsDto) {
    return this.quotationsService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.quotationsService.stats(user.companyId);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.quotationsService.getById(user, id);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuotationDto) {
    return this.quotationsService.create(user, dto);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotationsService.update(user, id, dto);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Post(":id/suppliers")
  addSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddQuotationSupplierDto,
  ) {
    return this.quotationsService.addSupplier(user, id, dto);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Delete(":id/suppliers/:quotationSupplierId")
  removeSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("quotationSupplierId", ParseUUIDPipe) quotationSupplierId: string,
  ) {
    return this.quotationsService.removeSupplier(user, id, quotationSupplierId);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Post(":id/suppliers/:quotationSupplierId/link")
  regenerateLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("quotationSupplierId", ParseUUIDPipe) quotationSupplierId: string,
  ) {
    return this.quotationsService.regenerateLink(user, id, quotationSupplierId);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Post(":id/open-link")
  enableOpenLink(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.quotationsService.enableOpenLink(user, id);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Delete(":id/open-link")
  disableOpenLink(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.quotationsService.disableOpenLink(user, id);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Put(":id/suppliers/:quotationSupplierId/prices")
  submitPrices(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("quotationSupplierId", ParseUUIDPipe) quotationSupplierId: string,
    @Body() dto: SubmitQuotationPricesDto,
  ) {
    return this.quotationsService.submitPricesInternally(user, id, quotationSupplierId, dto);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Patch(":id/items/:itemId/winner")
  setWinner(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Body() dto: SetWinnerDto,
  ) {
    return this.quotationsService.setWinner(user, id, itemId, dto);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Post(":id/pick-cheapest")
  pickCheapest(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.quotationsService.pickCheapest(user, id);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Post(":id/close")
  close(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.quotationsService.close(user, id);
  }

  @Roles(...QUOTATION_WRITE_ROLES)
  @AuditLog("Quotation", "UPDATE")
  @Post(":id/cancel")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.quotationsService.cancel(user, id);
  }
}
