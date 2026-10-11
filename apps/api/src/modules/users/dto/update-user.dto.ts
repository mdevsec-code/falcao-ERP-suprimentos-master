import { IsBoolean, IsEnum, IsOptional, IsString, Length } from "class-validator";
import { Role } from "@falcao-erp/shared-types";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 120)
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
