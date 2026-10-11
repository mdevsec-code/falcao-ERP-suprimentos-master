import { IsString, Length } from "class-validator";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@falcao-erp/shared-types";

export class ResetPasswordDto {
  @IsString()
  @Length(MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, {
    message: `A senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`,
  })
  password: string;
}
