import { PartialType } from "@nestjs/mapped-types";
import { DocumentFieldsDto } from "./document-fields.dto";

/**
 * Edição só de metadados (o arquivo é imutável — para trocar, envie outro).
 * `null` em `validoAte`, `supplierId` ou `contractId` remove o valor.
 */
export class UpdateDocumentDto extends PartialType(DocumentFieldsDto) {}
