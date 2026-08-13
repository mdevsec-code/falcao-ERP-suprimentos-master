import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from "class-validator";
import { ProductCategory, UnitOfMeasure } from "@falcao-erp/shared-types";

export class CreateProductDto {
  @IsString()
  @Length(2, 40)
  codigo: string;

  @IsString()
  @Length(2, 180)
  nome: string;

  @IsEnum(ProductCategory)
  categoria: ProductCategory;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  marca?: string;

  @IsEnum(UnitOfMeasure)
  unidade: UnitOfMeasure;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsUUID()
  primarySupplierId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  alternativeSupplierIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  initialPrice?: number;
}
