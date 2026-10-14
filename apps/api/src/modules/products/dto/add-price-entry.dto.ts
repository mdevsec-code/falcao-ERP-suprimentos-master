import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";

export class AddPriceEntryDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity?: number;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  marca?: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  referencia?: string;
}
