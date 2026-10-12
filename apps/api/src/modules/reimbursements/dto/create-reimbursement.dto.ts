import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";
import { ExpenseCategory } from "@falcao-erp/shared-types";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class ReimbursementItemInputDto {
  @Matches(DATE_ONLY_PATTERN, { message: "data deve estar no formato AAAA-MM-DD." })
  data: string;

  @IsEnum(ExpenseCategory)
  categoria: ExpenseCategory;

  @IsString()
  @Length(2, 200)
  descricao: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor: number;
}

export class CreateReimbursementDto {
  @IsString()
  @Length(3, 180)
  titulo: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  costCenter?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Informe ao menos uma despesa." })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReimbursementItemInputDto)
  items: ReimbursementItemInputDto[];
}
