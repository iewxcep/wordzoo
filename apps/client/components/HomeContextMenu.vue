<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50"
      @click="close"
      @contextmenu.prevent="reposition($event.clientX, $event.clientY)"
    >
      <div
        class="absolute w-36 rounded-xl bg-white p-2 shadow-even-lg dark:bg-gray-800 dark:shadow-gray-700"
        :style="{ left: `${menuX}px`, top: `${menuY}px` }"
      >
        <button
          class="flex w-full items-center rounded-lg p-2 text-gray-500 transition-all duration-200 ease-in-out hover:bg-base-200 hover:shadow-md dark:text-gray-300 dark:hover:bg-gray-600"
          tabindex="-1"
          @click="goHome"
        >
          <UIcon
            name="i-ph-house"
            class="mr-3 h-7 w-7"
          ></UIcon>
          <span class="font-medium">返回首页</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { navigateTo } from "#imports";
import { useRoute } from "vue-router";

const MENU_WIDTH = 144; // w-36
const MENU_HEIGHT = 56;

const route = useRoute();
const isOpen = ref(false);
const menuX = ref(0);
const menuY = ref(0);

onMounted(() => {
  window.addEventListener("contextmenu", handleContextMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener("contextmenu", handleContextMenu);
});

function handleContextMenu(event: MouseEvent) {
  // 首页无需“返回首页”入口，保留默认右键菜单
  if (route.path === "/") {
    return;
  }
  event.preventDefault();
  reposition(event.clientX, event.clientY);
  isOpen.value = true;
}

function reposition(x: number, y: number) {
  // 菜单以鼠标位置为左上角，靠近视口边缘时向内收拢
  menuX.value = Math.max(0, Math.min(x, window.innerWidth - MENU_WIDTH - 8));
  menuY.value = Math.max(0, Math.min(y, window.innerHeight - MENU_HEIGHT - 8));
}

function close() {
  isOpen.value = false;
}

function goHome() {
  close();
  navigateTo("/");
}
</script>

<style scoped></style>
