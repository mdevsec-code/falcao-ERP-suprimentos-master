import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { CreateEvaluationDto } from "./dto/create-evaluation.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { QuerySuppliersDto } from "./dto/query-suppliers.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { SuppliersService } from "./suppliers.service";

const WRITE_ROLES = ["ADMIN", "MANAGER", "BUYER"] as const;

@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QuerySuppliersDto) {
    return this.suppliersService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.stats(user.companyId);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.suppliersService.getById(user.companyId, id);
  }

  @Roles(...WRITE_ROLES)
  @AuditLog("Supplier", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(user.companyId, dto);
  }

  @Roles(...WRITE_ROLES)
  @AuditLog("Supplier", "UPDATE")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(user.companyId, id, dto);
  }

  @Roles(...WRITE_ROLES)
  @AuditLog("Supplier", "DELETE")
  @HttpCode(HttpStatus.OK)
  @Delete(":id")
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.suppliersService.deactivate(user.companyId, id);
  }

  @Roles(...WRITE_ROLES)
  @Patch(":id/reactivate")
  reactivate(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.suppliersService.reactivate(user.companyId, id);
  }

  @Post(":id/evaluations")
  addEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.suppliersService.addEvaluation(user.companyId, id, user.userId, dto.score, dto.comment);
  }

  @Roles(...WRITE_ROLES)
  @Post(":id/documents")
  @UseInterceptors(FileInterceptor("file"))
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.suppliersService.uploadDocument(user.companyId, id, user.userId, dto.category, file);
  }

  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id/documents/:documentId")
  removeDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("documentId") documentId: string,
  ) {
    return this.suppliersService.removeDocument(user.companyId, id, documentId);
  }
}
