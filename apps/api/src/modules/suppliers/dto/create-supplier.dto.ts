import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
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

  /** Atividades da empresa, em português e em chinês. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  atividades?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  atividadesZh?: string;

  /** Produtos e serviços oferecidos — é por aqui que a busca acha o fornecedor. */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  produtosServicos?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  produtosServicosZh?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Informe ao menos um contato." })
  @ValidateNested({ each: true })
  @Type(() => SupplierContactInputDto)
  contacts: SupplierContactInputDto[];
}
