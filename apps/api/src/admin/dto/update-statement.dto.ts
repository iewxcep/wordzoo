import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateStatementDto {
  @IsOptional()
  @IsString()
  chinese?: string;

  @IsOptional()
  @IsString()
  english?: string;

  @IsOptional()
  @IsString()
  soundmark?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
