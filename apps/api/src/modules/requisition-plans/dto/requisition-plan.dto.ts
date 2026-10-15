import { PartialType } from "@nestjs/mapped-types";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from "class-validator";
import { RequisitionPlanStatus } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class CreateRequisitionPlanDto {
  @IsString()
  @Length(3, 180)
  titulo: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  obra?: string;

  @Matches(DATE_ONLY_PATTERN, { message: "Informe o prazo de resposta (AAAA-MM-DD)." })
  prazoResposta: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  observacoes?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Inclua ao menos uma solicitação no plano." })
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  purchaseRequestIds: string[];
}

/** Só enquanto o plano é rascunho. */
export class UpdateRequisitionPlanDto extends PartialType(CreateRequisitionPlanDto) {}

export class QueryRequisitionPlansDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RequisitionPlanStatus)
  status?: RequisitionPlanStatus;
}

export class QueryPlanCandidatesDto {
  /** Ao editar um rascunho, as solicitações dele continuam disponíveis. */
  @IsOptional()
  @IsUUID()
  planId?: string;
}

export class LaunchRequisitionPlanDto {
  /** Fornecedores convidados direto (opcional) — os demais entram pelo link aberto. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  supplierIds?: string[];
}
