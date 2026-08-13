import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from "class-validator";
import { BRAZILIAN_STATES, ContactType, SupplierCategory } from "@falcao-erp/shared-types";

export class SupplierContactInputDto {
  @IsEnum(ContactType)
  type: ContactType;

  @IsString()
  @Length(1, 60)
  label: string;

  @IsString()
  @Length(3, 120)
  value: string;
}

export class CreateSupplierDto {
  @IsString()
  @Length(3, 180)
  razaoSocial: string;

  @IsString()
  @Length(2, 180)
  nomeFantasia: string;

  @IsString()
  @Length(14, 18)
  cnpj: string;

  @IsOptional()
  @IsString()
  inscricaoEstadual?: string;

  @IsEnum(SupplierCategory)
  categoria: SupplierCategory;

  @IsString()
  @Length(2, 120)
  cidade: string;

  @IsIn(BRAZILIAN_STATES)
  estado: string;

  @IsString()
  @Length(2, 120)
  responsavel: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Informe ao menos um contato." })
  @ValidateNested({ each: true })
  @Type(() => SupplierContactInputDto)
  contacts: SupplierContactInputDto[];
}
