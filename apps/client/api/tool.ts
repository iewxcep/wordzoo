import { getHttp } from "./http";

export interface EdgeTtsApiResponse {
  base64: string;
}

/** 整句 TTS 请求超时时间：正常合成 <3s，超时视为语音服务不可用并立即降级 */
export const EDGE_TTS_TIMEOUT_MS = 10_000;

/** /tool/tts-edge 请求超时（未收到响应即中止），供播放层提示并走逐词兜底 */
export class EdgeTtsTimeoutError extends Error {
  constructor() {
    super("Edge TTS synthesis timed out");
    this.name = "EdgeTtsTimeoutError";
  }
}

export async function fetchEdgeTts(
  text: string,
  rate = 1,
  timeoutMs = EDGE_TTS_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const http = getHttp();
    return (await http<EdgeTtsApiResponse>("/tool/tts-edge", {
      method: "post",
      body: { text, rate },
      signal: controller.signal,
    })) as EdgeTtsApiResponse;
  } catch (err) {
    if (controller.signal.aborted) throw new EdgeTtsTimeoutError();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
