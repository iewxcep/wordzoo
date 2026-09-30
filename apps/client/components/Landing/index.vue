<template>
  <div class="font-customFont">
    <LandingBanner @start-earthworm="startWordZoo" />
    <LandingFeatures />
    <LandingComments />
    <CommonBackTop class="sticky bottom-28 ml-auto flex justify-end sm:block" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import { cancelShortcut, registerShortcut } from "~/utils/keyboardShortcuts";

const { startWordZoo } = useShortcutToGame();

function useShortcutToGame() {
  const router = useRouter();

  async function startWordZoo() {
    router.push(`/course-pack`);
  }

  onMounted(() => {
    registerShortcut("enter", startWordZoo);
  });

  onUnmounted(() => {
    cancelShortcut("enter", startWordZoo);
  });

  return {
    startWordZoo,
  };
}
</script>
