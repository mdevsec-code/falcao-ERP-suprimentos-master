import { Type } from "class-transformer";
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from "class-validator";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class CreateContractDto {
  @IsUUID()
  supplierId: string;

  @IsString()
  @Length(1, 40)
  numero: string;

  @IsString()
  @Length(3, 200)
  objeto: string;

  @IsOptional()
  @IsString()
  @Length(0, 4000)
  descricao?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  costCenter?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorTotal: number;

  @Matches(DATE_ONLY_PATTERN, { message: "dataInicio deve estar no formato AAAA-MM-DD." })
  dataInicio: string;

  @Matches(DATE_ONLY_PATTERN, { message: "dataFim deve estar no formato AAAA-MM-DD." })
  dataFim: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: "assinadoEm deve estar no formato AAAA-MM-DD." })
  assinadoEm?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  alertaDias?: number;
}
