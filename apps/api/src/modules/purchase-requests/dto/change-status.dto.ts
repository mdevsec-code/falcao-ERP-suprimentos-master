import { IsEnum, IsOptional, IsString } from "class-validator";
import { PurchaseRequestStatus } from "@falcao-erp/shared-types";

export class ChangeStatusDto {
  @IsEnum(PurchaseRequestStatus)
  status: PurchaseRequestStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
