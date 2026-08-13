import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateEvaluationDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
