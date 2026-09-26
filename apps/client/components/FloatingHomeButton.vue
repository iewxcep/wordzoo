<template>
  <NuxtLink
    v-if="notOnHome"
    to="/"
    title="回到首页"
    class="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-even-lg transition-all duration-300 hover:scale-110 hover:text-purple-500 dark:bg-gray-800 dark:text-gray-300 dark:shadow-gray-700 dark:hover:text-purple-400"
  >
    <UIcon
      name="i-ph-house"
      class="h-6 w-6"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const notOnHome = computed(() => route.path !== "/");
</script>
