<template>
  <div
    :ref="isActiveCourse ? 'activeCourseRef' : undefined"
    :class="cardClasses"
  >
    <div
      ref="containerEl"
      class="flex min-h-0 flex-1 items-center justify-center px-1"
    >
      <h3
        ref="titleEl"
        class="title-fit whitespace-nowrap text-base font-bold"
      >
        {{ title }}
      </h3>
    </div>
    <p
      class="mt-2 line-clamp-3 text-sm"
      :class="hasFinished ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'"
      :title="description"
    >
      {{ description }}
    </p>
    <div
      v-if="hasFinished"
      class="absolute bottom-1.5 right-2 h-5 w-7 rounded-md bg-white/25 text-center text-xs leading-5 text-white"
    >
      <UTooltip :text="dataTip">
        {{ count }}
      </UTooltip>
    </div>
    <div
      v-else-if="progress"
      class="absolute bottom-1.5 right-2 text-xs text-gray-500 dark:text-gray-400"
    >
      已学 {{ progress.learned }}/{{ progress.total }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { useFitTitle } from "~/composables/courses/fitTitle";

const props = defineProps<{
  title: string;
  id: string;
  count: number | undefined;
  statementCount: number | undefined;
  progress: { learned: number; total: number } | undefined;
  coursePackId: string;
  description: string;
}>();
const { activeCourseMap } = useActiveCourseMap();

const titleEl = ref<HTMLElement | null>(null);
const containerEl = ref<HTMLElement | null>(null);
// 标题容器自身 px-1（左右各 4px），量宽时扣除
useFitTitle(containerEl, titleEl, computed(() => props.title), {
  base: 16,
  padding: 8,
});

const activeCourseRef = ref<HTMLDivElement>();
const hasFinished = computed(() => !!props.count);
const isActiveCourse = computed(() => activeCourseMap.value[props.coursePackId] == props.id);
const dataTip = computed(() => `恭喜您，当前课程已完成 ${props.count} 次 🎉`);

// 已完成卡片使用与"继续游戏"按钮相同的 daisyUI success 背景（bg-success）
const cardClasses = computed(() => {
  const base =
    "relative flex h-[160px] w-full cursor-pointer flex-col rounded-xl border p-4 pb-6 transition-all duration-300 dark:text-gray-100";
  if (hasFinished.value) {
    return [
      base,
      "bg-success border-2 border-success text-white",
      "hover:shadow-lg hover:shadow-emerald-200 dark:hover:shadow-emerald-700",
    ];
  }
  return [
    base,
    "hover:text-purple-500 hover:shadow-lg hover:shadow-gray-300 hover:dark:text-purple-400 dark:hover:shadow-gray-500",
    isActiveCourse.value
      ? "border-2 border-purple-500 hover:text-purple-500 hover:shadow-purple-200 hover:dark:text-purple-300 dark:hover:shadow-purple-700"
      : "border-gray-400",
  ];
});

onMounted(() => {
  activeCourseRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});
</script>

<style scoped>
/* 名称居中且不换行；字号由 useFitTitle() 按容器宽度调整 */
.title-fit {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
