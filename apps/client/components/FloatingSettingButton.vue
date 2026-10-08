<template>
  <div
    v-if="onHome"
    class="fixed bottom-6 left-6 z-40"
  >
    <UPopover
      v-model="isOpen"
      :popper="{ placement: 'top-start', offsetDistance: 12 }"
      :ui="{
        width: 'w-36',
        trigger: 'inline-flex',
      }"
    >
      <button
        title="设置"
        class="flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white px-5 text-gray-500 shadow-even-lg transition-all duration-300 hover:scale-110 hover:text-purple-500 dark:bg-gray-800 dark:text-gray-300 dark:shadow-gray-700 dark:hover:text-purple-400"
      >
        <UIcon
          name="i-ph-gear"
          class="h-6 w-6"
        />
        <span class="text-base">设置</span>
      </button>

    <template #panel>
      <!-- 菜单选项 -->
      <div class="p-2">
        <button
          v-for="item in showMenuOptions"
          :key="item.name"
          @click="item.eventName"
          class="mb-1 flex w-full items-center rounded-lg p-2 transition-all duration-200 ease-in-out hover:bg-base-200 hover:shadow-md dark:hover:bg-gray-600"
          tabindex="-1"
        >
          <UIcon
            :name="item.icon"
            class="mr-3 h-7 w-7"
          ></UIcon>
          <span class="font-medium">{{ item.title }}</span>
        </button>
      </div>

      <!-- 底部信息 -->
      <div class="p-3 text-center text-xs opacity-50">版本 v1.0.0</div>
    </template>
    </UPopover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { navigateTo } from "#imports";
import { useRoute } from "vue-router";

import { Theme, useDarkMode } from "~/composables/darkMode";

const route = useRoute();
const onHome = computed(() => route.path === "/");

const isOpen = ref(false);
const { darkMode, toggleDarkMode } = useDarkMode();
const isDarkMode = computed(() => darkMode.value === Theme.DARK);

const showMenuOptions = computed(() => {
  return [
    {
      title: "设置",
      name: "setting",
      eventName: handleSetting,
      icon: "i-ph-gear",
    },
    {
      title: "掌握列表",
      name: "mastered",
      eventName: handleMasteredElements,
      icon: "i-ph-book",
    },
    {
      title: "课程管理",
      name: "admin",
      eventName: handleAdmin,
      icon: "i-ph-pencil-ruler-duotone",
    },
    {
      title: "主题切换",
      name: "changeTheme",
      eventName: toggleDarkMode,
      icon: isDarkMode.value ? "i-ph-moon" : "i-ph-sun",
    },
    {
      title: "关于",
      name: "about",
      eventName: () => navigateAndClose("/user/about"),
      icon: "i-ph-info",
    },
  ];
});

function navigateAndClose(to: string) {
  isOpen.value = false;
  navigateTo(to);
}

function handleSetting() {
  navigateAndClose("/user/setting");
}

function handleMasteredElements() {
  navigateAndClose("/mastered-elements");
}

function handleAdmin() {
  navigateAndClose("/admin");
}
</script>

<style scoped></style>
