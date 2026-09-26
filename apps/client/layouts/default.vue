<template>
  <div
    class="h-full w-full bg-white text-slate-600 transition-colors dark:bg-theme-dark dark:text-slate-300"
  >
    <div class="m-auto flex h-fit min-h-screen flex-col items-center">
      <Navbar />
      <!-- 多一层内容的横向内边距是为了和页面边缘对齐 -->
      <div class="flex w-full flex-1 px-5">
        <div class="mx-auto flex w-full flex-1 flex-col">
          <NuxtPage />
        </div>
      </div>
      <FloatingHomeButton />
      <FloatingSettingButton />
    </div>
  </div>
</template>

<script setup lang="ts">
import FloatingHomeButton from "~/components/FloatingHomeButton.vue";
import FloatingSettingButton from "~/components/FloatingSettingButton.vue";
</script>
