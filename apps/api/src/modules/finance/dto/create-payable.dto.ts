import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Length, Matches, Min } from "class-validator";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class CreatePayableDto {
  @IsString()
  @Length(3, 200)
  descricao: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor: number;

  @Matches(DATE_ONLY_PATTERN, { message: "vencimento deve estar no formato AAAA-MM-DD." })
  vencimento: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsOptional()
  @IsUUID()
  purchaseRequestId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  costCenter?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  notaFiscal?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: "notaFiscalEmissao deve estar no formato AAAA-MM-DD." })
  notaFiscalEmissao?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  observacoes?: string;
}
