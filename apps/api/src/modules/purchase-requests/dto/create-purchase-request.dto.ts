import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

/** Foto enviada antes por `POST /purchase-requests/item-photos` (a empresa é conferida no serviço). */
export const ITEM_PHOTO_PATTERN = /^item-photos\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/;

export class PurchaseRequestItemInputDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  @Length(2, 200)
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @IsString()
  @Length(1, 20)
  unit: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedPrice?: number;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  marca?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  referencia?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  especificacao?: string;

  /** Em kg. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(99_999_999)
  pesoTotal?: number;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  localUso?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  setorSolicitante?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: "Data necessária inválida (AAAA-MM-DD)." })
  dataNecessaria?: string;

  @IsOptional()
  @Matches(ITEM_PHOTO_PATTERN, { message: "Foto do item inválida — envie a foto novamente." })
  photoPath?: string;
}

export class CreatePurchaseRequestDto {
  @IsString()
  @Length(3, 180)
  title: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  costCenter?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  requesterContact?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Informe ao menos um item." })
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemInputDto)
  items: PurchaseRequestItemInputDto[];
}
