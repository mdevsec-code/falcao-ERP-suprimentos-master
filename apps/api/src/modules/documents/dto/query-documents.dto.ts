import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import { DocumentCategory } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryDocumentsDto extends PaginationQueryDto {
  /** Título, descrição, nome do arquivo, etiqueta exata ou conteúdo (arquivos de texto). */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  categoria?: DocumentCategory;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsIn(["OK", "VENCENDO", "VENCIDO", "SEM_VALIDADE"])
  validade?: "OK" | "VENCENDO" | "VENCIDO" | "SEM_VALIDADE";

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;
}
