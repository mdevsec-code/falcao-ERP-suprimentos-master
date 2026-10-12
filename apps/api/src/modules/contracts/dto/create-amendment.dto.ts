import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Length, Matches } from "class-validator";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class CreateAmendmentDto {
  @IsString()
  @Length(3, 2000)
  descricao: string;

  /** Acréscimo (positivo) ou supressão (negativo) no valor do contrato. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  valorDelta?: number;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: "novaDataFim deve estar no formato AAAA-MM-DD." })
  novaDataFim?: string;
}
