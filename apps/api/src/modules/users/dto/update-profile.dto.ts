import { IsString, Length } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @Length(3, 120)
  name: string;
}
