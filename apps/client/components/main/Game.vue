<template>
  <div class="flex w-full flex-1 flex-col">
    <template v-if="isDictationMode()">
      <ModeDictationMode />
    </template>
    <template v-else-if="isChineseToEnglishMode()">
      <ModeChineseToEnglishMode />
    </template>

    <MainSummary />
    <GamePauseModal></GamePauseModal>
    <MainGameSettingModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

import GamePauseModal from "~/components/main/GamePauseModal.vue";
import { courseTimer } from "~/composables/courses/courseTimer";
import { useGamePlayMode } from "~/composables/user/gamePlayMode";
import { useGameStore } from "~/store/game";

const { isChineseToEnglishMode, isDictationMode } = useGamePlayMode();
const gameStore = useGameStore();

onMounted(() => {
  courseTimer.reset();
  gameStore.startGame();
});

onUnmounted(() => {
  gameStore.exitGame();
});
</script>
