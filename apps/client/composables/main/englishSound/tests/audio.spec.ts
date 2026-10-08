import { createTestingPinia } from "@pinia/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EdgeTtsTimeoutError, EDGE_TTS_TIMEOUT_MS, fetchEdgeTts } from "~/api/tool";
import { play, updateSource } from "../audio";

const { httpMock, toastInfo } = vi.hoisted(() => ({
  httpMock: { fetch: vi.fn() },
  toastInfo: vi.fn(),
}));

vi.mock("~/api/http", () => ({ getHttp: () => httpMock.fetch }));

// toast 只断言行为：右下角 + 3s 自动关闭
vi.mock("vue-sonner", () => ({
  toast: { info: toastInfo, success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

/** 一个永不响应、但收到 abort 即以 AbortError 拒绝的 http 实现（模拟语音服务无响应） */
function installHangingHttp() {
  httpMock.fetch.mockImplementation((_url: string, options: { signal: AbortSignal }) => {
    const { promise, reject } = Promise.withResolvers<never>();
    options.signal.addEventListener("abort", () =>
      reject(new DOMException("The operation was aborted.", "AbortError")),
    );
    return promise;
  });
}

describe("fetchEdgeTts 超时", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  it("超过 EDGE_TTS_TIMEOUT_MS 未响应时中止并抛 EdgeTtsTimeoutError", async () => {
    installHangingHttp();

    const promise = fetchEdgeTts("Hello world");
    const assertion = expect(promise).rejects.toBeInstanceOf(EdgeTtsTimeoutError);
    await vi.advanceTimersByTimeAsync(EDGE_TTS_TIMEOUT_MS);
    await assertion;
  });

  it("http 自身报错时原样抛出，不误判为超时", async () => {
    httpMock.fetch.mockRejectedValueOnce(new Error("network down"));

    await expect(fetchEdgeTts("Hello world")).rejects.toThrow("network down");
  });
});

describe("playWithEdgeTts 超时降级", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    createTestingPinia({ createSpy: vi.fn });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockReturnValue(Promise.resolve());
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockReturnValue(undefined);
    installHangingHttp();
  });

  it("超时后右下角弹出提示，3 秒自动关闭，并逐词兜底", async () => {
    updateSource("", "Hello world");
    void play();

    await vi.advanceTimersByTimeAsync(EDGE_TTS_TIMEOUT_MS);

    expect(toastInfo).toHaveBeenCalledWith("在线语音请求超时，本次改用单词录音", {
      id: "edge-tts-timeout",
      position: "bottom-right",
      duration: 3000,
    });
    // 有道逐词兜底开始播放
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it("非超时错误不弹提示", async () => {
    httpMock.fetch.mockRejectedValue(new Error("boom"));

    updateSource("", "Hello world");
    void play();

    await vi.advanceTimersByTimeAsync(1);

    expect(toastInfo).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });
});
