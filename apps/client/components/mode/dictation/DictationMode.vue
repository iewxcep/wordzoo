<template>
  <div class="flex h-full flex-col items-center justify-center">
    <div class="flex flex-1 items-center justify-center">
      <div v-if="!isStart">
        <button
          class="btn"
          v-if="isMobile"
          @click="startGame"
        >
          准备好了吗？ 点我开始
        </button>
        <p v-else>准备好了吗？(按任意键开启游戏)</p>
      </div>
      <div v-else>
        <template v-if="isQuestion()">
          <ModeDictationQuestion />
          <MainAnswerTip v-show="isAnswerTip()" />
        </template>
        <template v-else-if="isAnswer()">
          <MainAnswer />
        </template>
      </div>
    </div>
    <!-- 时间与快捷键控制区固定在页面底部 -->
    <div class="mb-2 flex w-full flex-col items-center gap-2">
      <MainLearningTimer></MainLearningTimer>
      <div class="relative flex w-full items-center justify-center">
        <div class="z-10 hidden items-center justify-center min-[780px]:flex">
          <button
            v-for="keybinding in keybindings"
            @click="keybinding.eventFn"
            class="btn btn-ghost"
          >
            <div class="flex items-center gap-0.5">
              <UKbd v-for="keyStr in parseShortcutKeys(keybinding.keys)">
                {{ keyStr }}
              </UKbd>
            </div>
            <span>{{ keybinding.text }}</span>
          </button>
        </div>

        <MainPrevAndNextBtn />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

import { useAnswerTip } from "~/composables/main/answerTip";
import { useCurrentStatementEnglishSound } from "~/composables/main/englishSound";
import { useGameMode } from "~/composables/main/game";
import { useSummary } from "~/composables/main/summary";
import { useMastered } from "~/composables/main/useMastered";
import { useDevice } from "~/utils/detectDevice";
import { cancelShortcut, parseShortcutKeys, registerShortcut } from "~/utils/keyboardShortcuts";
import { useAnswer } from "~/components/main/QuestionInput/useAnswer";
import { useWrapperQuestionInput } from "~/components/main/QuestionInput/useWrapperQuestionInput";
import { useGamePlayMode } from "~/composables/user/gamePlayMode";
import { useShortcutKeyMode } from "~/composables/user/shortcutKey";

const { isMobile } = useDevice();
const { isAnswer, isQuestion } = useGameMode();
const { toggleAnswerTip, isAnswerTip } = useAnswerTip();
const { isStart, startGame } = useStartGame();
const { isDictationMode } = useGamePlayMode();
const { showQuestion } = useGameMode();
const { goToNextQuestion } = useAnswer();
const { submitAnswer } = useWrapperQuestionInput();
const { shortcutKeys } = useShortcutKeyMode();

const { playSound } = usePlaySound(shortcutKeys.value.sound);
const { handleMastered } = useMasteredShortcut();
useShowAnswer(shortcutKeys.value.answer);

const keybindings = computed(() => {
  const questionItems = [
    {
      keys: "Enter",
      text: "提交",
      eventFn: () => {
        submitAnswer();
      },
    },
    {
      keys: shortcutKeys.value.answer,
      text: isAnswerTip() ? "隐藏答案" : "显示答案",
      eventFn: () => {
        toggleAnswerTip();
      },
    },
  ];

  const answerItems = [
    {
      keys: "Enter",
      text: "下一题",
      eventFn: () => {
        goToNextQuestion();
      },
    },
    {
      keys: shortcutKeys.value.answer,
      text: "再来一次",
      eventFn: () => {
        showQuestion();
      },
    },
  ];

  const normalItems = [
    {
      keys: shortcutKeys.value.sound,
      text: "播放发音",
      eventFn: playSound,
    },
    {
      keys: shortcutKeys.value.mastered,
      text: "掌握",
      eventFn: handleMastered,
    },
  ];

  const resultItems: any = [...normalItems];

  if (isQuestion()) {
    resultItems.push(...questionItems);
  } else {
    resultItems.push(...answerItems);
  }

  return resultItems;
});

function useMasteredShortcut() {
  const { markStatementAsMastered } = useMastered();

  function handleMastered() {
    markStatementAsMastered();
  }

  onMounted(() => {
    registerShortcut(shortcutKeys.value.mastered, handleMastered);
  });

  onUnmounted(() => {
    cancelShortcut(shortcutKeys.value.mastered, handleMastered);
  });

  return {
    handleMastered,
  };
}

function usePlaySound(key: string) {
  const { playSound } = useCurrentStatementEnglishSound();

  onMounted(() => {
    registerShortcut(key, playSoundCommand);
  });

  onUnmounted(() => {
    cancelShortcut(key, playSoundCommand);
  });

  function playSoundCommand(e: KeyboardEvent) {
    e.preventDefault();
    playSound();
  }

  return {
    playSound,
  };
}

function useShowAnswer(key: string) {
  onMounted(() => {
    registerShortcut(key, handleShowAnswer);
  });

  onUnmounted(() => {
    cancelShortcut(key, handleShowAnswer);
  });

  function handleShowAnswer(e: KeyboardEvent) {
    e.preventDefault();
    // NOTE: registerShortcut 事件会记住注册时的面板状态，所以这里要重新获取下面板信息
    const { showModal } = useSummary();
    if (showModal.value) return;

    const { isAnswer } = useGameMode();
    if (isAnswer()) {
      showQuestion();
    } else {
      toggleAnswerTip();
    }
  }
}

function useStartGame() {
  const isStart = ref(false);

  function handleKeyup(e: KeyboardEvent) {
    e.preventDefault();
    startGame();
    cancelShortcut("*", handleKeyup);
  }

  onMounted(() => {
    registerShortcut("*", handleKeyup);
  });

  function startGame() {
    isStart.value = true;
  }

  return {
    isStart,
    startGame,
  };
}
</script>

<style scoped></style>
