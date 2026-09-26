<template>
  <button
    title="设置"
    class="fixed bottom-6 left-6 z-40 flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-gray-500 shadow-even-lg transition-all duration-300 hover:scale-110 hover:text-purple-500 dark:bg-gray-800 dark:text-gray-300 dark:shadow-gray-700 dark:hover:text-purple-400"
    @click="openUserMenu"
  >
    <UIcon
      name="i-ph-gear"
      class="h-6 w-6"
    />
    <span class="text-base">设置</span>
  </button>
</template>

<script setup lang="ts">
import { useUserMenu } from "~/composables/user/useUserMenu";

const { openUserMenu } = useUserMenu();
</script>
