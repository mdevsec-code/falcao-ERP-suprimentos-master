import { IsOptional, IsString, Length, Matches } from "class-validator";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

/** Conciliação: vincula a nota fiscal à conta (aberta ou já paga). */
export class InvoiceDto {
  @IsString()
  @Length(1, 60)
  notaFiscal: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: "notaFiscalEmissao deve estar no formato AAAA-MM-DD." })
  notaFiscalEmissao?: string;
}
