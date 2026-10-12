import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Matches, Min } from "class-validator";
import { PaymentMethod } from "@falcao-erp/shared-types";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

export class PayPayableDto {
  @Matches(DATE_ONLY_PATTERN, { message: "pagoEm deve estar no formato AAAA-MM-DD." })
  pagoEm: string;

  /** Padrão: o valor da conta (juros/descontos entram aqui). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valorPago?: number;

  @IsEnum(PaymentMethod)
  formaPagamento: PaymentMethod;
}
