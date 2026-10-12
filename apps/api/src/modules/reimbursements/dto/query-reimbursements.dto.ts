import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ReimbursementStatus } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryReimbursementsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ReimbursementStatus)
  status?: ReimbursementStatus;

  /** Histórico de um colaborador (só para quem vê os reembolsos de todos). */
  @IsOptional()
  @IsUUID()
  requesterId?: string;

  /** Só os meus. */
  @IsOptional()
  @IsBooleanString()
  mine?: string;
}
