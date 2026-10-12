import { IsIn, IsOptional, IsString, Length, Matches } from "class-validator";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class DecideReimbursementDto {
  @IsIn(["APPROVE", "REJECT"])
  decision: "APPROVE" | "REJECT";

  /** Obrigatório ao rejeitar. */
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  comment?: string;

  /** Vencimento da conta a pagar gerada na aprovação (padrão: hoje + 7 dias). */
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: "vencimento deve estar no formato AAAA-MM-DD." })
  vencimento?: string;
}
