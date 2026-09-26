<template>
  <div class="font-customFont">
    <LandingBanner @start-earthworm="startElearn" />
    <LandingFeatures />
    <LandingComments />
    <CommonBackTop class="sticky bottom-28 ml-auto flex justify-end sm:block" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import { cancelShortcut, registerShortcut } from "~/utils/keyboardShortcuts";

const { startElearn } = useShortcutToGame();

function useShortcutToGame() {
  const router = useRouter();

  async function startElearn() {
    router.push(`/course-pack`);
  }

  onMounted(() => {
    registerShortcut("enter", startElearn);
  });

  onUnmounted(() => {
    cancelShortcut("enter", startElearn);
  });

  return {
    startElearn,
  };
}
</script>
