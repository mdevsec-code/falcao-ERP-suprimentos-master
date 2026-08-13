import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ProductCategory } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryProductsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  categoria?: ProductCategory;

  @IsOptional()
  @IsUUID()
  primarySupplierId?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
