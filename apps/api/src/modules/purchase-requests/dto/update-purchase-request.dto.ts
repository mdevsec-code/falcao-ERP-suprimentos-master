import { PartialType } from "@nestjs/mapped-types";
import { CreatePurchaseRequestDto } from "./create-purchase-request.dto";

export class UpdatePurchaseRequestDto extends PartialType(CreatePurchaseRequestDto) {}
