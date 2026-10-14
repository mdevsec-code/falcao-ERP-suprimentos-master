import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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
import { MAX_UPLOAD_BYTES } from "../storage/upload-policy";
import { InvoiceFilesService } from "./invoice-files.service";
import { PayablesService } from "./payables.service";

@Roles(...FINANCE_READ_ROLES)
@Controller("payables")
export class PayablesController {
  constructor(
    private readonly payablesService: PayablesService,
    private readonly invoiceFiles: InvoiceFilesService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryPayablesDto) {
    return this.payablesService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.payablesService.stats(user.companyId);
  }

  /** Lê o XML de uma NF-e sem gravar — para abrir uma conta já preenchida. */
  @Roles(...FINANCE_WRITE_ROLES)
  @Post("invoice-xml/preview")
  @UseInterceptors(FileInterceptor("file"))
  previewInvoiceXml(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: MAX_UPLOAD_BYTES }).build({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.invoiceFiles.preview(user.companyId, file);
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

  @Roles(...FINANCE_WRITE_ROLES)
  @AuditLog("Payable", "UPDATE")
  @Post(":id/invoice-file")
  @UseInterceptors(FileInterceptor("file"))
  uploadInvoiceFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: MAX_UPLOAD_BYTES }).build({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.invoiceFiles.upload(user.companyId, id, file);
  }

  @Roles(...FINANCE_WRITE_ROLES)
  @AuditLog("Payable", "UPDATE")
  @HttpCode(HttpStatus.OK)
  @Delete(":id/invoice-file/:kind")
  removeInvoiceFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("kind", new ParseEnumPipe(["pdf", "xml"])) kind: "pdf" | "xml",
  ) {
    return this.invoiceFiles.remove(user.companyId, id, kind);
  }
}
