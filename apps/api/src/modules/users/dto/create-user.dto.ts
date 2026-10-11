import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsString, Length } from "class-validator";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, Role } from "@falcao-erp/shared-types";

export class CreateUserDto {
  @IsString()
  @Length(3, 120)
  name: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: "Informe um e-mail válido." })
  email: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @Length(MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, {
    message: `A senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`,
  })
  password: string;
}
