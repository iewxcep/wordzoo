import { IsNotEmpty } from "class-validator";

export class UpsertUserProgressDto {
  @IsNotEmpty({ message: "课程不能为空" })
  courseId: string;

  @IsNotEmpty({ message: "课程包不能为空" })
  coursePackId: string;

  @IsNotEmpty({ message: "课程进度不能为空" })
  statementIndex: number;
}
