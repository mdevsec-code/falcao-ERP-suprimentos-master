import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import { ContractStatus } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryContractsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  /** Só contratos vigentes: dentro da janela de alerta ou já vencidos. */
  @IsOptional()
  @IsIn(["VENCENDO", "VENCIDO"])
  prazo?: "VENCENDO" | "VENCIDO";
}
