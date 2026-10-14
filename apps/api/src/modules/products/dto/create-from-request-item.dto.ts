import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { ProductCategory, UnitOfMeasure } from "@falcao-erp/shared-types";

/** Inclui no catálogo um item que o solicitante digitou à mão. */
export class CreateFromRequestItemDto {
  @IsUUID()
  purchaseRequestItemId: string;

  @IsString()
  @Length(2, 40)
  codigo: string;

  @IsString()
  @Length(2, 180)
  nome: string;

  @IsEnum(ProductCategory)
  categoria: ProductCategory;

  @IsEnum(UnitOfMeasure)
  unidade: UnitOfMeasure;

  @IsOptional()
  @IsUUID()
  disciplineId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  marca?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  referencia?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  observacoes?: string;
}
