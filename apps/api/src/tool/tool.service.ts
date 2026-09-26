import { Injectable, Logger } from "@nestjs/common";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const EDGE_TTS_VOICE = "en-US-AriaNeural";

@Injectable()
export class ToolService {
  private readonly logger = new Logger(ToolService.name);
  private edgeTtsClient: MsEdgeTTS | null = null;

  /** 微软 Edge 神经语音合成（en-US-AriaNeural），返回 mp3 的 base64。任意长度句子均可 */
  /** 合成结果缓存：key = `${text}|${rate}`，重播同一句子时秒级回放，也减少对微软接口的请求 */
  private static readonly SYNTHESIS_CACHE_LIMIT = 50;
  private synthesisCache = new Map<string, string>();

  async synthesizeEdge(text: string, rate = 1) {
    const cacheKey = `${text}|${rate}`;
    const cached = this.synthesisCache.get(cacheKey);
    if (cached) {
      // LRU：命中后移到末尾
      this.synthesisCache.delete(cacheKey);
      this.synthesisCache.set(cacheKey, cached);
      return { base64: cached };
    }

    try {
      const client = await this.getEdgeTtsClient();
      const { audioStream } = await client.toStream(text, { rate });
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      const base64 = Buffer.concat(chunks).toString("base64");

      if (this.synthesisCache.size >= ToolService.SYNTHESIS_CACHE_LIMIT) {
        const oldest = this.synthesisCache.keys().next().value;
        if (oldest !== undefined) this.synthesisCache.delete(oldest);
      }
      this.synthesisCache.set(cacheKey, base64);

      return { base64 };
    } catch (error) {
      this.logger.error(`Edge TTS 合成失败: ${error}`);
      return { base64: "" };
    }
  }

  private async getEdgeTtsClient() {
    if (!this.edgeTtsClient) {
      const client = new MsEdgeTTS();
      await client.setMetadata(EDGE_TTS_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      this.edgeTtsClient = client;
    }
    return this.edgeTtsClient;
  }
}
