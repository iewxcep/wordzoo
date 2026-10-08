import { PronunciationType, usePronunciation, useSpeechRate } from "~/composables/user/pronunciation";
import { toast } from "vue-sonner";

import { EdgeTtsTimeoutError, fetchEdgeTts } from "~/api/tool";

// 便于测试
// 后面不使用 audio 后也可以不破坏业务逻辑
const audio = new Audio();
/** 本地 TTS 模式下当前要朗读的文本（updateSource 时一并传入） */
let currentText = "";

export function updateSource(src: string, text?: string) {
  audio.src = src;
  currentText = text ?? "";
  audio.load();
}

const { getWordAudioUrl, pronunciation } = usePronunciation();
const { speechRate } = useSpeechRate();

/** 未显式传 rate 时使用设置里的语速 */
function withDefaultRate(playOptions?: PlayOptions): PlayOptions {
  if (playOptions?.rate !== undefined) return playOptions;
  return { ...playOptions, rate: speechRate.value };
}

/** Edge 神经语音当前是否在播：同一时间只允许一个 Edge 播放实例，新播放自动接管旧的 */
let activeEdgePlaybackStop: (() => void) | undefined;

/** 整句 TTS 加载失败（有道对部分句子返回 null audio）时，逐词用单词录音兜底 */
const fallbackWordAudio = new Audio();

function playWordsSequentially(text: string, rate: number): () => void {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return () => undefined;
  }

  let index = 0;
  let stopped = false;

  const playNext = () => {
    if (stopped || index >= words.length) return;
    const word = words[index];
    index++;
    fallbackWordAudio.src = getWordAudioUrl(word);
    fallbackWordAudio.onended = () => playNext();
    // 单词也加载失败（如断网）时跳过继续，避免卡死
    fallbackWordAudio.onerror = () => playNext();
    fallbackWordAudio.playbackRate = rate;
    fallbackWordAudio.play();
  };

  playNext();

  return () => {
    stopped = true;
    fallbackWordAudio.pause();
  };
}

let fallbackAttached = false;

function attachSentenceAudioFallback() {
  if (fallbackAttached) return;
  fallbackAttached = true;
  audio.onerror = () => {
    if (!currentText) return;
    // 有道整句失败 → Edge 神经语音 → 逐词有道 → 静默
    playWithEdgeTts(currentText, { rate: audio.playbackRate });
  };
}

function isLocalTTSMode() {
  return pronunciation.value === PronunciationType.LocalTTS;
}

/** 浏览器/Electron 内置语音合成，离线可用；返回取消函数 */
function playWithLocalTts(text: string, playOptions?: PlayOptions) {
  const synth = window.speechSynthesis;
  if (!synth || !text) {
    return () => undefined;
  }

  const { times, rate, interval } = Object.assign({}, DefaultPlayOptions, playOptions);
  synth.cancel();

  let remaining = times;
  let timeoutId: NodeJS.Timeout | undefined;

  const speakOnce = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.onend = () => {
      if (remaining > 1) {
        remaining--;
        timeoutId = setTimeout(speakOnce, interval);
      }
    };
    synth.speak(utterance);
  };

  speakOnce();

  return () => {
    clearTimeout(timeoutId);
    synth.cancel();
  };
}

function isLocalTTSActive(): boolean {
  return pronunciation.value === PronunciationType.LocalTTS;
}

function isEdgeTTSActive(): boolean {
  return pronunciation.value === PronunciationType.EdgeTTS;
}

/**
 * 微软 Edge 神经语音（经后端 /tool/tts-edge 合成），任意长度句子。
 * 合成失败自动降级：有道单词逐词兜底 → 各自失败则静默。
 * 同一时间只有一个 Edge 播放实例：新播放先停掉旧的（修复切换口音/重播时播两次）。
 */
function playWithEdgeTts(text: string, playOptions?: PlayOptions): () => void {
  const { times, rate, interval } = Object.assign({}, DefaultPlayOptions, playOptions);
  let cancelled = false;
  let audioEl: HTMLAudioElement | null = null;
  let timeoutId: NodeJS.Timeout | undefined;

  // 关键：接管上一个播放实例（含其尚未返回的合成请求），避免双播
  activeEdgePlaybackStop?.();
  activeEdgePlaybackStop = () => {
    cancelled = true;
    clearTimeout(timeoutId);
    audioEl?.pause();
  };

  void (async () => {
    try {
      const { base64 } = await fetchEdgeTts(text, rate);
      if (cancelled || !base64) {
        if (!cancelled && !base64) playWordsSequentially(text, rate);
        return;
      }
      audioEl = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioEl.playbackRate = rate;
      let remaining = times;
      audioEl.onended = () => {
        if (cancelled) return;
        remaining--;
        if (remaining > 0) {
          timeoutId = setTimeout(() => {
            if (!audioEl) return;
            audioEl.currentTime = 0;
            void audioEl.play();
          }, interval);
        }
      };
      void audioEl.play();
    } catch (err) {
      console.error("[englishSound] edge tts failed:", err);
      if (!cancelled) {
        if (err instanceof EdgeTtsTimeoutError) {
          // 超时提示：右下角，3 秒自动关闭；同一 id 保证旧提示先消失，避免连播多条
          toast.info("在线语音请求超时，本次改用单词录音", {
            id: "edge-tts-timeout",
            position: "bottom-right",
            duration: 3000,
          });
        }
        playWordsSequentially(text, rate);
      }
    }
  })();

  return () => {
    activeEdgePlaybackStop?.();
  };
}

export function usePlayWordSound() {
  const wordAudio = new Audio();
  let lastWord = "";
  let isPlaying = false;

  wordAudio.onplay = () => {
    isPlaying = true;
  };

  wordAudio.onended = () => {
    isPlaying = false;
  };

  function handlePlayWordSound(word: string) {
    if (isPlaying && lastWord === word) {
      // skip
      return;
    }
    lastWord = word;

    if (isLocalTTSMode()) {
      isPlaying = true;
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.onend = utterance.onerror = () => {
        isPlaying = false;
      };
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.speak(utterance);
      return;
    }

    wordAudio.src = getWordAudioUrl(word);
    wordAudio.play();
  }

  return {
    handlePlayWordSound,
  };
}

export interface PlayOptions {
  times?: number;
  rate?: number;
  interval?: number;
}

const DefaultPlayOptions = {
  times: 1,
  rate: 1,
  interval: 500,
};

export function play(playOptions?: PlayOptions) {
  const merged = withDefaultRate(playOptions);

  if (isLocalTTSActive()) {
    return playWithLocalTts(currentText, merged);
  }

  if (isEdgeTTSActive()) {
    return playWithEdgeTts(currentText, merged);
  }

  attachSentenceAudioFallback();

  const { times, rate, interval } = Object.assign({}, DefaultPlayOptions, merged);

  audio.playbackRate = rate;
  audio.play();
  if (times > 1) {
    audio.addEventListener("ended", handleEnded, false);
  }

  let index = 1;
  let timeoutId: NodeJS.Timeout;
  function handleEnded() {
    timeoutId = setTimeout(() => {
      if (index < times) {
        audio.play();
        index++;
      } else {
        index = 1;
        audio.removeEventListener("ended", handleEnded);
      }
    }, interval);
  }

  return () => {
    audio.pause();
    audio.currentTime = 0;
    audio.removeEventListener("ended", handleEnded);
    timeoutId && clearTimeout(timeoutId);
  };
}
