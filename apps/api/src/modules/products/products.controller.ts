import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { AddPriceEntryDto } from "./dto/add-price-entry.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { QueryProductsDto } from "./dto/query-products.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

const WRITE_ROLES = ["ADMIN", "MANAGER", "BUYER"] as const;

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryProductsDto) {
    return this.productsService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.stats(user.companyId);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.productsService.getById(user.companyId, id);
  }

  @Roles(...WRITE_ROLES)
  @AuditLog("Product", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.companyId, dto);
  }

  @Roles(...WRITE_ROLES)
  @AuditLog("Product", "UPDATE")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(user.companyId, id, dto);
  }

  @Roles(...WRITE_ROLES)
  @AuditLog("Product", "DELETE")
  @HttpCode(HttpStatus.OK)
  @Delete(":id")
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.productsService.deactivate(user.companyId, id);
  }

  @Roles(...WRITE_ROLES)
  @Patch(":id/reactivate")
  reactivate(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.productsService.reactivate(user.companyId, id);
  }

  @Roles(...WRITE_ROLES)
  @Post(":id/price-entries")
  addPriceEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AddPriceEntryDto,
  ) {
    return this.productsService.addPriceEntry(user.companyId, id, dto);
  }
}
