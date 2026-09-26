<template>
  <div
    ref="cardEl"
    class="course-pack-card"
    @click="$emit('cardClick', coursePack)"
  >
    <!-- 标题+简介整体垂直水平居中 -->
    <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4">
      <h2
        ref="titleEl"
        class="title-fit whitespace-nowrap text-lg font-semibold"
      >{{ coursePack.title }}</h2>
      <p
        v-if="coursePack.description"
        class="description-text"
        :title="coursePack.description"
      >
        {{ coursePack.description }}
      </p>
    </div>
    <div class="card-body">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { useFitTitle } from "~/composables/courses/fitTitle";

interface Props {
  coursePack: {
    id: string;
    title: string;
    description: string;
    cover: string;
    isFree: boolean;
  };
}

const props = defineProps<Props>();

defineEmits<{
  (e: "cardClick", coursePack: any): void;
}>();

const cardEl = ref<HTMLElement | null>(null);
const titleEl = ref<HTMLElement | null>(null);

useFitTitle(cardEl, titleEl, () => props.coursePack.title);
</script>

<style scoped>
.course-pack-card {
  @apply flex cursor-pointer flex-col overflow-hidden rounded-md rounded-t-xl border bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-900;
  @apply hover:text-purple-500 hover:shadow-even-lg hover:shadow-gray-300 hover:dark:text-purple-400 dark:hover:shadow-gray-500;
  width: 100%;
  max-width: 100%; /* 在移动端允许卡片占满整个宽度 */
  height: 100%;
}

.card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 0;
}

/* 名称居中且不换行；字号由 fitTitle() 按容器宽度调整 */
.title-fit {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.description-text {
  @apply line-clamp-2 text-center text-sm text-gray-500;
  flex-grow: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  position: relative;
}

@media (hover: hover) {
  .description-text:hover::after {
    content: attr(title);
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 10;
    background: white;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
    white-space: normal;
    word-wrap: break-word;
    max-width: 300px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .description-text:hover::after {
    background: #1a202c;
    border-color: #4a5568;
    color: white;
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .course-pack-card {
    max-width: 100%; /* 确保在小屏幕上占满宽度 */
  }

  .card-body {
    padding: 0.75rem; /* 稍微减少内边距 */
  }

  .description-text {
    @apply text-xs; /* 减小描述文字大小 */
  }
}
</style>
