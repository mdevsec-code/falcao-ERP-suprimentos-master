import { Type } from "class-transformer";
import { IsEmail, IsEnum, IsIn, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { BRAZILIAN_STATES, SupplierCategory } from "@falcao-erp/shared-types";
import { IsCnpj } from "../../../common/validators/is-cnpj";

/** Cadastro mínimo que o fornecedor preenche quando o CNPJ ainda não é conhecido. */
export class PublicSupplierRegistrationDto {
  @IsString()
  @Length(3, 180)
  razaoSocial: string;

  @IsString()
  @Length(2, 180)
  nomeFantasia: string;

  @IsOptional()
  @IsEnum(SupplierCategory)
  categoria?: SupplierCategory;

  @IsString()
  @Length(2, 120)
  cidade: string;

  @IsIn(BRAZILIAN_STATES)
  estado: string;

  @IsEmail({}, { message: "Informe um e-mail válido." })
  @Length(3, 120)
  email: string;

  @IsString()
  @Length(8, 30, { message: "Informe um telefone com DDD." })
  telefone: string;
}

/**
 * Identificação do fornecedor nos links públicos (cotação aberta e catálogo):
 * CNPJ + quem está preenchendo; o cadastro só é exigido para CNPJ novo.
 */
export class PublicSupplierIdentityDto {
  @IsCnpj()
  cnpj: string;

  @IsString()
  @Length(2, 120, { message: "Informe o nome de quem está preenchendo." })
  nomeResponsavel: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PublicSupplierRegistrationDto)
  cadastro?: PublicSupplierRegistrationDto;
}
