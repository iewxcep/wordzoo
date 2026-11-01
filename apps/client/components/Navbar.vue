<template>
  <!-- 顶部占位 header：仅保留高度，防止内容顶到最上面 -->
  <header class="w-full">
    <div class="mx-auto w-full">
      <div class="flex h-16 items-center pl-5">
        <!-- 点击 logo 返回首页（悬停有提示）；右键菜单返回入口仍保留 -->
        <img
          src="/eyes-dark.png"
          alt="logo"
          class="h-12 cursor-pointer transition-opacity hover:opacity-80"
          title="返回首页"
          @click="goHome"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { navigateTo } from "#imports";

function goHome() {
  navigateTo("/");
}
</script>
