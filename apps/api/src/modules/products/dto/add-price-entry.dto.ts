import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class AddPriceEntryDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
