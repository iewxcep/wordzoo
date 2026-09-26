import { IsInt, IsNotEmpty, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class CreateStatementDto {
  @IsString()
  @IsNotEmpty({ message: "中文不能为空" })
  chinese: string;

  @IsString()
  @IsNotEmpty({ message: "英文不能为空" })
  english: string;

  @IsString()
  @IsNotEmpty({ message: "音标不能为空" })
  soundmark: string;
}

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty({ message: "课程标题不能为空" })
  title: string;

  @ValidateNested({ each: true })
  @Type(() => CreateStatementDto)
  statements: CreateStatementDto[];
}

export class CreateCoursePackDto {
  @IsString()
  @Length(1, 255)
  @IsNotEmpty({ message: "课程包标题不能为空" })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
