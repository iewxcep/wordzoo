import { ref } from "vue";

/**
 * 发音源：
 * - 句子朗读：微软 Edge 神经语音（经后端 /tool/tts-edge 合成）
 * - 单词朗读/兜底：有道 Web 发音 API 真人录音
 *   https://dict.youdao.com/dictvoice?type=2&audio=word
 * - 本地TTS（speechSynthesis）功能保留，暂不作为可选项
 */

export enum PronunciationType {
  American = "American",
  British = "British",
  EdgeTTS = "EdgeTTS",
  LocalTTS = "LocalTTS",
}

export const pronunciationLabels: { [key in PronunciationType]: string } = {
  [PronunciationType.American]: "美音",
  [PronunciationType.British]: "英音",
  [PronunciationType.EdgeTTS]: "微软Edge TTS",
  [PronunciationType.LocalTTS]: "本地TTS",
};

const PRONUNCIATION_TYPE = "pronunciationType";
const SPEECH_RATE = "speechRate";
const pronunciation = ref(PronunciationType.EdgeTTS);
const speechRate = ref(1); // 语速倍率，1 = 正常

export function useSpeechRate() {
  const stored = Number(localStorage.getItem(SPEECH_RATE));
  if (stored > 0 && stored <= 2) {
    speechRate.value = stored;
  }

  function setRate(value: number) {
    speechRate.value = value;
    localStorage.setItem(SPEECH_RATE, String(value));
  }

  return {
    speechRate,
    setRate,
  };
}

/** 有道单词真人录音（逐词朗读/兜底用，与整句发音源无关） */
function getWordAudioUrl(word: string | undefined): string {
  return `https://dict.youdao.com/dictvoice?type=2&audio=${word}`;
}

export function usePronunciation() {
  loadCache();

  function loadCache() {
    // 只保留 Edge TTS：任何旧值（美音/英音/本地TTS）一律归一
    setStore(PronunciationType.EdgeTTS);
  }

  function setStore(value: PronunciationType) {
    pronunciation.value = value;
    localStorage.setItem(PRONUNCIATION_TYPE, value);
  }

  function getStore(): PronunciationType {
    return localStorage.getItem(PRONUNCIATION_TYPE) as PronunciationType;
  }

  function getPronunciationOptions() {
    // 仅保留 Edge TTS；本地TTS 功能保留但暂不提供选择
    return Object.entries(pronunciationLabels)
      .filter(([key]) => key === PronunciationType.EdgeTTS)
      .map(([key, value]) => {
        return {
          label: value,
          value: key,
        };
      });
  }

  /** 句子发音是否走 Edge TTS（当前唯一整句源） */
  function isEdgeTTS(): boolean {
    return pronunciation.value === PronunciationType.EdgeTTS;
  }

  // 切换发音
  function togglePronunciation(type: PronunciationType) {
    if (type !== pronunciation.value) setStore(type);
  }

  return {
    pronunciation,
    getPronunciationOptions,
    isEdgeTTS,
    getWordAudioUrl,
    togglePronunciation,
  };
}
