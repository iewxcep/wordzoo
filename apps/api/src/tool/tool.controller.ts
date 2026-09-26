import { Body, Controller, Post } from "@nestjs/common";

import { EdgeTtsDto } from "./dto/edge-tts.dto";
import { ToolService } from "./tool.service";

@Controller("tool")
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @Post("tts-edge")
  ttsEdge(@Body() dto: EdgeTtsDto) {
    return this.toolService.synthesizeEdge(dto.text, dto.rate ?? 1);
  }
}
