import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { QuotationStatus } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class CreateQuotationDto {
  @IsUUID()
  purchaseRequestId: string;

  @IsOptional()
  @IsString()
  @Length(3, 180)
  titulo?: string;

  @Matches(DATE_ONLY_PATTERN, { message: "Informe o prazo de resposta (AAAA-MM-DD)." })
  prazoResposta: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  observacoes?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Convide ao menos um fornecedor." })
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  supplierIds: string[];

  /** Itens da solicitação a cotar; vazio = todos. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  itemIds?: string[];
}

export class UpdateQuotationDto {
  @IsOptional()
  @IsString()
  @Length(3, 180)
  titulo?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  prazoResposta?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  observacoes?: string;
}

export class QueryQuotationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @IsOptional()
  @IsUUID()
  purchaseRequestId?: string;
}

export class AddQuotationSupplierDto {
  @IsUUID()
  supplierId: string;
}

export class SetWinnerDto {
  /** `null` desfaz a escolha. */
  @ValidateIf((dto: SetWinnerDto) => dto.quotationSupplierId !== null)
  @IsUUID()
  quotationSupplierId: string | null;
}

export class QuotationPriceInputDto {
  @IsUUID()
  itemId: string;

  @IsBoolean()
  disponivel: boolean;

  @ValidateIf((dto: QuotationPriceInputDto) => dto.disponivel)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Preço com no máximo 2 casas decimais." })
  @Min(0.01, { message: "Informe o preço unitário." })
  @Max(99_999_999)
  precoUnitario?: number | null;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  marca?: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  referencia?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  observacao?: string;
}

/** Resposta do fornecedor — a mesma forma serve para o link público e para o lançamento manual. */
export class SubmitQuotationPricesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => QuotationPriceInputDto)
  precos: QuotationPriceInputDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3650)
  prazoEntregaDias?: number;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  condicaoPagamento?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  validadeProposta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999)
  frete?: number;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  observacoes?: string;
}

export class PublicSubmitQuotationDto extends SubmitQuotationPricesDto {
  @IsString()
  @Length(2, 120, { message: "Informe o nome de quem está respondendo." })
  nomeResponsavel: string;
}

export class PublicDeclineQuotationDto {
  @IsString()
  @Length(2, 120, { message: "Informe o nome de quem está respondendo." })
  nomeResponsavel: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  motivo?: string;
}
