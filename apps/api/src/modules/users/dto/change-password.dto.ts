import { IsString, Length, MinLength } from "class-validator";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@falcao-erp/shared-types";

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: "Informe a senha atual." })
  currentPassword: string;

  @IsString()
  @Length(MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, {
    message: `A nova senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`,
  })
  newPassword: string;
}
