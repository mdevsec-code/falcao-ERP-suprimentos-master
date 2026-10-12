import { PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsEnum, IsISO8601, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { AgendaEventType } from "@falcao-erp/shared-types";

export class CreateAgendaEventDto {
  @IsString()
  @Length(2, 180)
  titulo: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  descricao?: string;

  @IsEnum(AgendaEventType)
  tipo: AgendaEventType;

  /** Data/hora ISO. Em eventos de dia inteiro, a meia-noite local do dia. */
  @IsISO8601()
  inicio: string;

  @IsOptional()
  @IsISO8601()
  fim?: string;

  @IsOptional()
  @IsBoolean()
  diaInteiro?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  obra?: string;

  @IsOptional()
  @IsString()
  @Length(1, 180)
  local?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  purchaseRequestId?: string;
}

export class UpdateAgendaEventDto extends PartialType(CreateAgendaEventDto) {}
