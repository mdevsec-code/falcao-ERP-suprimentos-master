import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from "class-validator";
import { DocumentCategory } from "@falcao-erp/shared-types";
import { DATE_ONLY_PATTERN } from "../../../common/utils/date-only";

/** Campos de formulário multipart chegam como texto; vazio = não informado. */
const emptyToUndefined = ({ value }: { value: unknown }) => (value === "" ? undefined : value);

/** Aceita `"a, b"` (multipart) ou `["a", "b"]` (JSON); normaliza para minúsculas sem repetição. */
const toTags = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return [];
  const raw = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(raw.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))];
};

export class DocumentFieldsDto {
  @IsString()
  @Length(2, 180)
  titulo: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @Length(0, 2000)
  descricao?: string;

  @IsEnum(DocumentCategory)
  categoria: DocumentCategory;

  @IsOptional()
  @Transform(toTags)
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @Length(1, 40, { each: true })
  tags?: string[];

  @IsOptional()
  @Transform(emptyToUndefined)
  @Matches(DATE_ONLY_PATTERN, { message: "validoAte deve estar no formato AAAA-MM-DD." })
  validoAte?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  contractId?: string;
}
