import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from "class-validator";

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

  @IsArray()
  @ArrayMinSize(1, { message: "Informe ao menos um item." })
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemInputDto)
  items: PurchaseRequestItemInputDto[];
}
