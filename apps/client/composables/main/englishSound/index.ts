import { watchEffect } from "vue";

import type { PlayOptions } from "./audio";
import { useToolbar } from "~/composables/main/dictation";
import { useGamePlayMode } from "~/composables/user/gamePlayMode";
import { usePronunciation } from "~/composables/user/pronunciation";
import { useCourseStore } from "~/store/course";
import { play, updateSource } from "./audio";

const { getWordAudioUrl, isEdgeTTS } = usePronunciation();

export function useCurrentStatementEnglishSound() {
  const courseStore = useCourseStore();
  const { toolBarData } = useToolbar();
  const { isDictationMode } = useGamePlayMode();

  watchEffect(() => {
    const word = courseStore.currentStatement?.english;
    // 始终更新：Edge 模式下不预载有道音频（整句走 /tool/tts-edge），只更新朗读文本
    updateSource(isEdgeTTS() ? "" : getWordAudioUrl(word), word);
  });

  return {
    playSound: (options?: PlayOptions) => {
      if (isDictationMode()) {
        const { times, rate, interval } = toolBarData;
        return play({ times, rate, interval });
      } else {
        return play(options);
      }
    },
  };
}

export function playEnglish(english: string) {
  const pronunciationUrl = getWordAudioUrl(english);
  updateSource(pronunciationUrl, english);
  play();
}
