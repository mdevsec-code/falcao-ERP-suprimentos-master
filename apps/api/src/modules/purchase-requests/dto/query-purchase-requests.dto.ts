import { IsEnum, IsOptional, IsString } from "class-validator";
import { PurchaseRequestStatus } from "@falcao-erp/shared-types";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryPurchaseRequestsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PurchaseRequestStatus)
  status?: PurchaseRequestStatus;
}
