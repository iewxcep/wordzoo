import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/** 与导出格式一致：包 → 课程（可选描述/视频）→ 语句数组 */
export class ImportStatementDto {
  @IsString()
  @IsNotEmpty({ message: "语句缺少中文" })
  chinese: string;

  @IsString()
  @IsNotEmpty({ message: "语句缺少英文" })
  english: string;

  @IsOptional()
  @IsString()
  soundmark?: string;
}

export class ImportCourseDto {
  @IsString()
  @IsNotEmpty({ message: "课程标题不能为空" })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsArray({ message: "statements 必须是数组" })
  @ValidateNested({ each: true })
  @Type(() => ImportStatementDto)
  statements: ImportStatementDto[];
}

export class ImportCoursePackDto {
  @IsString()
  @Length(1, 255, { message: "课程包标题不能为空" })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray({ message: "courses 必须是数组" })
  @ValidateNested({ each: true })
  @Type(() => ImportCourseDto)
  courses: ImportCourseDto[];
}
