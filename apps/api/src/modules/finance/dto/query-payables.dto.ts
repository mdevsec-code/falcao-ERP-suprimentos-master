import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID, Matches } from "class-validator";
import { PayableSource, PayableStatus } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class QueryPayablesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PayableStatus)
  status?: PayableStatus;

  @IsOptional()
  @IsEnum(PayableSource)
  origem?: PayableSource;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  /** Só abertas com vencimento antes de hoje. */
  @IsOptional()
  @IsBooleanString()
  vencidas?: string;

  /** Só sem nota fiscal (pendentes de conciliação). */
  @IsOptional()
  @IsBooleanString()
  semNota?: string;

  /** Só com nota fiscal informada (exportação de notas). */
  @IsOptional()
  @IsBooleanString()
  comNota?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  to?: string;
}
