import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateCoursePackDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
