import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CreateDisciplineDto {
  @IsString()
  @Length(2, 60)
  nome: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  ordem?: number;
}

export class UpdateDisciplineDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  nome?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
