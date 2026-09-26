import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class EdgeTtsDto {
  @IsString()
  @MaxLength(2000, { message: "文本过长" })
  text: string;

  /** 语速倍率，1 = 正常（映射到 SSML prosody rate） */
  @IsOptional()
  @IsNumber()
  rate?: number;
}
