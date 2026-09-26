import { getHttp } from "./http";

export interface EdgeTtsApiResponse {
  base64: string;
}

export async function fetchEdgeTts(text: string, rate = 1) {
  const http = getHttp();
  return (await http<EdgeTtsApiResponse>("/tool/tts-edge", {
    method: "post",
    body: { text, rate },
  })) as EdgeTtsApiResponse;
}
