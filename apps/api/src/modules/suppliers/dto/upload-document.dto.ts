import { IsEnum } from "class-validator";
import { SupplierDocumentCategory } from "@falcao-erp/shared-types";

export class UploadDocumentDto {
  @IsEnum(SupplierDocumentCategory)
  category: SupplierDocumentCategory;
}
