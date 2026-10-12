import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CashFlowQueryDto {
  /** Meses para trás, contando o atual. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months: number = 6;

  /** Meses à frente (previsão). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(12)
  ahead: number = 2;

  @IsOptional()
  @IsString()
  costCenter?: string;
}
