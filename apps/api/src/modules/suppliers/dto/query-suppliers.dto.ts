import { IsBooleanString, IsIn, IsEnum, IsOptional, IsString } from "class-validator";
import { BRAZILIAN_STATES, SupplierCategory } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QuerySuppliersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SupplierCategory)
  categoria?: SupplierCategory;

  @IsOptional()
  @IsIn(BRAZILIAN_STATES)
  estado?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
