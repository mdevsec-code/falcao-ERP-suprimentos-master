import { IsEmail, IsEnum, IsIn, IsOptional, IsString, Length, MaxLength } from "class-validator";
import { BRAZILIAN_STATES, SupplierCategory } from "@falcao-erp/shared-types";
import { IsCnpj } from "../../../common/validators/is-cnpj";

/**
 * Cadastro que o próprio fornecedor preenche pelo link da empresa. Atividades
 * e produtos podem vir em português, em chinês ou nos dois; os produtos são
 * obrigatórios em pelo menos um idioma (conferido no serviço).
 */
export class PublicSupplierSignupDto {
  @IsCnpj()
  cnpj: string;

  @IsString()
  @Length(3, 180)
  razaoSocial: string;

  @IsString()
  @Length(2, 180)
  nomeFantasia: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
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

  @IsEmail({}, { message: "Informe um e-mail válido." })
  @Length(3, 120)
  email: string;

  @IsString()
  @Length(8, 30, { message: "Informe um telefone com DDD." })
  telefone: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  atividades?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  atividadesZh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  produtosServicos?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  produtosServicosZh?: string;
}
