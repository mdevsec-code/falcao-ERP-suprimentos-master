import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { AuditAction } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryAuditLogsDto extends PaginationQueryDto {
  /** Busca por nome/e-mail de quem fez a ação ou pelo id do registro. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  /** Início do período (inclusive), `YYYY-MM-DD`. */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Fim do período (inclusive), `YYYY-MM-DD`. */
  @IsOptional()
  @IsDateString()
  to?: string;
}
