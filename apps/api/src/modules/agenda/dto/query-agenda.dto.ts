import { IsOptional, IsString, Matches } from "class-validator";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class QueryAgendaDto {
  @Matches(DATE_ONLY_PATTERN, { message: "from deve estar no formato AAAA-MM-DD." })
  from: string;

  @Matches(DATE_ONLY_PATTERN, { message: "to deve estar no formato AAAA-MM-DD." })
  to: string;

  /** Visão por obra: filtra eventos pela obra e prazos pelo centro de custo. */
  @IsOptional()
  @IsString()
  obra?: string;
}
