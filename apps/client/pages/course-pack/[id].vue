<template>
  <div class="flex w-full flex-col">
    <template v-if="isLoading">
      <Loading></Loading>
    </template>

    <template v-else>
      <h2 class="mb-4 text-center text-3xl dark:border-gray-600">
        {{ coursePackStore.currentCoursePack?.title }}
      </h2>
      <div class="h-full scrollbar-hide">
        <div
          class="grid h-[79vh] grid-cols-1 justify-start gap-4 overflow-y-auto overflow-x-hidden pb-96 pl-0 pr-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
        >
          <template
            v-for="course in coursePackStore.currentCoursePack?.courses"
            :key="course.id"
          >
            <CoursesCourseCard
              :title="course.title"
              :description="course.description"
              :id="course.id"
              :count="course.completionCount"
              :statementCount="course.statementCount"
              :progress="progressOf(course)"
              :coursePackId="course.coursePackId"
              @click="handleChangeCourse(course.id)"
            />
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Course } from "~/types";

import { navigateTo } from "#app";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { fetchUserCourseProgress } from "~/api/user-course-progress";
import { useCoursePackStore } from "~/store/coursePack";

const isLoading = ref(false);
const route = useRoute();
const coursePackStore = useCoursePackStore();
const coursePackId = route.params.id as string;
const { updateActiveCourseMap } = useActiveCourseMap();

const packProgress = ref<{ courseId: string | null; statementIndex: number } | null>(null);
const progressByCourse = computed(() => {
  if (!packProgress.value?.courseId) return {} as Record<string, number>;
  return {
    [packProgress.value.courseId]: packProgress.value.statementIndex,
  } as Record<string, number>;
});

function progressOf(course: Course) {
  const learned = progressByCourse.value[course.id];
  if (!learned || learned <= 0 || !course.statementCount) return undefined;
  return { learned, total: course.statementCount };
}

setup();

async function setup() {
  isLoading.value = true;
  try {
    await coursePackStore.setupCoursePack(coursePackId);
    packProgress.value = await fetchUserCourseProgress(coursePackId);
  } finally {
    isLoading.value = false;
  }
}

function handleChangeCourse(courseId: string) {
  updateActiveCourseMap(coursePackId, courseId);
  navigateTo(`/game/${coursePackId}/${courseId}`);
}
</script>

<style></style>
