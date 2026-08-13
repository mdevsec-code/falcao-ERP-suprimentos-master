import { IsString, Length } from "class-validator";

export class AddCommentDto {
  @IsString()
  @Length(1, 2000)
  message: string;
}
