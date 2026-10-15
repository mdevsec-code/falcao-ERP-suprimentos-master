import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Length, Matches, MaxLength, ValidateIf } from "class-validator";
import { SignatureDecision } from "@falcao-erp/shared-types";

/** PNG em data URL, até ~300 KB (uma assinatura desenhada fica em 5–40 KB). */
export const SIGNATURE_PATTERN = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
export const MAX_SIGNATURE_LENGTH = 400_000;

export class SignPurchaseRequestDto {
  @IsEnum(SignatureDecision)
  decision: SignatureDecision;

  @IsString()
  @MaxLength(MAX_SIGNATURE_LENGTH, { message: "Assinatura grande demais — limpe e desenhe de novo." })
  @Matches(SIGNATURE_PATTERN, { message: "Desenhe a assinatura antes de confirmar." })
  signatureData: string;

  /** Obrigatório ao recusar. */
  @ValidateIf((dto: SignPurchaseRequestDto) => dto.decision === "RECUSADO" || dto.comment !== undefined)
  @IsString()
  @Length(3, 1000, { message: "Explique o motivo (mínimo 3 caracteres)." })
  comment?: string;

  /** Guarda a assinatura no perfil para as próximas aprovações. */
  @IsOptional()
  @IsBoolean()
  saveSignature?: boolean;
}

export class SetStepApproversDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  userIds: string[];
}
