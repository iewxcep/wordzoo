import { IsOptional, IsString, Length, MaxLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 20, { message: "用户名长度为2-20位" })
  username?: string;

  /** data URL（头像经客户端压缩后 ~100KB 内，这里留出余量） */
  @IsOptional()
  @IsString()
  @MaxLength(1024 * 1024, { message: "头像数据过大" })
  avatar?: string;
}
