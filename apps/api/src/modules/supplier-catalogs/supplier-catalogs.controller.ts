import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { CATALOG_WRITE_ROLES, QUOTATION_READ_ROLES } from "../../common/constants/module-roles";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { MAX_UPLOAD_BYTES } from "../storage/upload-policy";
import {
  CreateProductFromCatalogItemDto,
  QuerySupplierCatalogsDto,
  RejectSupplierCatalogDto,
  ReviewSupplierCatalogDto,
} from "./dto/supplier-catalog.dto";
import { SupplierCatalogsService } from "./supplier-catalogs.service";

@Roles(...QUOTATION_READ_ROLES)
@Controller("supplier-catalogs")
export class SupplierCatalogsController {
  constructor(private readonly catalogsService: SupplierCatalogsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QuerySupplierCatalogsDto) {
    return this.catalogsService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogsService.stats(user.companyId);
  }

  @Roles(...CATALOG_WRITE_ROLES)
  @Get("link")
  getLink(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogsService.getLink(user.companyId);
  }

  @Roles(...CATALOG_WRITE_ROLES)
  @Post("link")
  regenerateLink(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogsService.regenerateLink(user.companyId);
  }

  @Roles(...CATALOG_WRITE_ROLES)
  @Delete("link")
  disableLink(@CurrentUser() user: AuthenticatedUser) {
    return this.catalogsService.disableLink(user.companyId);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.catalogsService.getById(user.companyId, id);
  }

  @Roles(...CATALOG_WRITE_ROLES)
  @AuditLog("SupplierCatalog", "UPDATE")
  @Post(":id/review")
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewSupplierCatalogDto,
  ) {
    return this.catalogsService.review(user, id, dto);
  }

  @Roles(...CATALOG_WRITE_ROLES)
  @AuditLog("SupplierCatalog", "UPDATE")
  @Post(":id/items/:itemId/product")
  createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Body() dto: CreateProductFromCatalogItemDto,
  ) {
    return this.catalogsService.createProductFromItem(user, id, itemId, dto);
  }

  @Roles(...CATALOG_WRITE_ROLES)
  @AuditLog("SupplierCatalog", "UPDATE")
  @Post(":id/reject")
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RejectSupplierCatalogDto,
  ) {
    return this.catalogsService.reject(user, id, dto);
  }
}

/** Link público da empresa para fornecedores enviarem catálogo — sem login, autorizado pelo token. */
@Public()
@Controller("public/catalogs")
export class PublicCatalogsController {
  constructor(private readonly catalogsService: SupplierCatalogsService) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(":token")
  view(@Param("token") token: string) {
    return this.catalogsService.publicView(token);
  }

  /** Multipart: `dados` (JSON) + `file` opcional. Limite baixo — cria cadastro e grava arquivo. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(":token")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  submit(
    @Param("token") token: string,
    @Body("dados") dados: unknown,
    @UploadedFile(
      new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: MAX_UPLOAD_BYTES }).build({ fileIsRequired: false }),
    )
    file: Express.Multer.File | undefined,
  ) {
    return this.catalogsService.publicSubmit(token, dados, file);
  }
}
