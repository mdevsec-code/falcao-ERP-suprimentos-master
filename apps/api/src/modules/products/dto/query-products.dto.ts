import { IsBooleanString, IsEnum, IsIn, IsOptional, IsString, IsUUID, Length, ValidateIf } from "class-validator";
import { ProductCategory } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryProductsDto extends PaginationQueryDto {
  /** Nome, código, marca ou referência. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  categoria?: ProductCategory;

  /** Id da disciplina ou `none` para produtos sem disciplina. */
  @IsOptional()
  @ValidateIf((dto: QueryProductsDto) => dto.disciplineId !== "none")
  @IsUUID()
  disciplineId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  marca?: string;

  @IsOptional()
  @IsUUID()
  primarySupplierId?: string;

  /** Fornecedor principal ou alternativo. */
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsIn(["nome", "codigo", "recentes"])
  sort?: "nome" | "codigo" | "recentes";
}
