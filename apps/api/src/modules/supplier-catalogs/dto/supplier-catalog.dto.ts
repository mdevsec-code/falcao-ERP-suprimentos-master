import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { MAX_CATALOG_ITEMS, ProductCategory, SupplierCatalogStatus, UnitOfMeasure } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { PublicSupplierIdentityDto } from "../../suppliers/dto/public-supplier-identity.dto";

export class CatalogItemInputDto {
  @IsOptional()
  @IsString()
  @Length(0, 60)
  codigoFornecedor?: string;

  @IsString()
  @Length(2, 300, { message: "Toda linha precisa da descrição do produto." })
  descricao: string;

  @IsString()
  @Length(1, 20, { message: "Toda linha precisa da unidade (UN, KG, M…)." })
  unidade: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  marca?: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  referencia?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Preço com no máximo 2 casas decimais." })
  @Min(0)
  @Max(99_999_999)
  preco?: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  observacao?: string;
}

/** Campo `dados` (JSON) do envio multipart do link de catálogo; o arquivo vai no campo `file`. */
export class PublicCatalogSubmitDto {
  @ValidateNested()
  @Type(() => PublicSupplierIdentityDto)
  identidade: PublicSupplierIdentityDto;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  observacoes?: string;

  @IsArray()
  @ArrayMaxSize(MAX_CATALOG_ITEMS, { message: `No máximo ${MAX_CATALOG_ITEMS} itens por envio.` })
  @ValidateNested({ each: true })
  @Type(() => CatalogItemInputDto)
  itens: CatalogItemInputDto[];
}

export class QuerySupplierCatalogsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SupplierCatalogStatus)
  status?: SupplierCatalogStatus;

  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

export class CatalogItemDecisionDto {
  @IsUUID()
  itemId: string;

  @IsIn(["IMPORTAR", "IGNORAR"])
  acao: "IMPORTAR" | "IGNORAR";

  /** Produto do catálogo vivo que recebe o preço do fornecedor (obrigatório para importar). */
  @ValidateIf((dto: CatalogItemDecisionDto) => dto.acao === "IMPORTAR")
  @IsUUID()
  productId?: string;
}

export class ReviewSupplierCatalogDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_CATALOG_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => CatalogItemDecisionDto)
  decisoes: CatalogItemDecisionDto[];
}

/** Cria um produto novo no catálogo vivo a partir de uma linha do catálogo do fornecedor. */
export class CreateProductFromCatalogItemDto {
  @IsString()
  @Length(2, 40)
  codigo: string;

  @IsString()
  @Length(2, 180)
  nome: string;

  @IsEnum(ProductCategory)
  categoria: ProductCategory;

  @IsEnum(UnitOfMeasure)
  unidade: UnitOfMeasure;

  @IsOptional()
  @IsUUID()
  disciplineId?: string;
}

export class RejectSupplierCatalogDto {
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  motivo?: string;
}
