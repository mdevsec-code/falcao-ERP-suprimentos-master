import { IsEnum } from "class-validator";
import { ContractStatus } from "@falcao-erp/shared-types";

export class ChangeContractStatusDto {
  @IsEnum(ContractStatus)
  status: ContractStatus;
}
