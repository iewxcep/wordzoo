<template>
  <div class="flex w-full flex-1 flex-col pb-20">
    <div class="flex w-full justify-between">
      <!-- 左侧头像区域 -->
      <div class="mr-8 hidden w-[144px] shrink-0 self-start md:block">
      <label class="group relative mx-auto block h-[clamp(72px,7.5vw,128px)] w-[clamp(72px,7.5vw,128px)] cursor-pointer">
        <div
          class="h-full w-full overflow-hidden rounded-full border-2 border-gray-300 bg-gray-300 dark:border-gray-700 dark:bg-gray-700"
        >
          <!-- 通过给定高度来自适应拉伸图片，如果图片不存在或者加载失败则显示外层的背景色（没有宽度） -->
          <img
            class="h-full w-full object-cover"
            :src="userStore.user?.avatar"
          />
        </div>
        <div
          class="absolute inset-0 hidden items-center justify-center rounded-full bg-black/40 text-xs text-white group-hover:flex"
        >
          更换头像
        </div>
        <input
          type="file"
          accept="image/*"
          class="hidden"
          @change="onAvatarChange"
        />
      </label>
      <div class="mt-3 truncate">
        <div
          v-if="isEditingName"
          class="flex items-center gap-1"
        >
          <input
            ref="nameInput"
            v-model="draftName"
            maxlength="20"
            class="w-full rounded border border-purple-400 px-1 py-0.5 text-sm focus:outline-none"
            @keydown.enter="saveName"
            @keydown.esc="cancelEditName"
            @blur="saveName"
          />
        </div>
        <div
          v-else
          class="group/name flex cursor-pointer items-center gap-1"
          title="点击修改用户名"
          @click="startEditName"
        >
          <div class="truncate text-lg font-medium">{{ userStore.user?.username }}</div>
          <UIcon
            name="i-ph-pencil-simple"
            class="hidden h-3.5 w-3.5 shrink-0 text-gray-400 group-hover/name:block"
          />
        </div>
        <div class="truncate text-xs text-gray-400">
          {{ userStore.user?.email }}
        </div>
      </div>
      <hr class="my-3 dark:border-gray-700" />
      <!-- TODO: 等后续勋章制作完成再放出来 -->
      <!-- <div class="text-lg font-medium">勋章</div>
      <div class="mt-2 grid grid-cols-4 gap-2">
        <div
          v-for="i in 6"
          class="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700"
        ></div>
      </div> -->
    </div>

    <!-- 右侧课程包区域 -->
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="mb-4 flex justify-between border-b pb-2 dark:border-gray-700">
        <div class="text-xl font-medium">最近使用的课程包</div>
        <NuxtLink
          href="/course-pack"
          class="link text-blue-500 no-underline hover:opacity-75"
          >更多课程包
        </NuxtLink>
      </div>
      <HomeRecentCoursePack />
      <!-- 热力图：窗口有多余高度时贴底显示 -->
      <HomeCalendarGraph
        class="mt-auto pt-10"
        :data="learningDailyTimeList"
        :totalLearningTime="learningDailyTotalTime"
        @toggleYear="toggleYear"
      />
    </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAsyncData } from "#imports";
import { nextTick, ref } from "vue";
import { toast } from "vue-sonner";

import { fetchTodayLearningTime } from "~/api/user-learning-activity";
import { useLearningDailyTime } from "~/composables/learningDailyTime";
import { type CalendarDataItem } from "~/composables/user/calendarGraph";
import { useUserStore } from "~/store/user";
import { useLearningTimeTracker } from "../../composables/main/learningTimeTracker";

const userStore = useUserStore();
const { learningDailyTimeList, learningDailyTotalTime, setupLearningDailyTime } =
  useLearningDailyTime();
const { toggleYear } = useCalendarGraph();

const isEditingName = ref(false);
const draftName = ref("");
const nameInput = ref<HTMLInputElement>();

function startEditName() {
  draftName.value = userStore.user?.username ?? "";
  isEditingName.value = true;
  void nextTick(() => nameInput.value?.focus());
}

function cancelEditName() {
  isEditingName.value = false;
}

async function saveName() {
  if (!isEditingName.value) return;
  isEditingName.value = false;
  const name = draftName.value.trim();
  if (!name || name === userStore.user?.username) return;
  try {
    await userStore.updateUser({ username: name });
    toast.success("用户名已更新");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "用户名更新失败");
  }
}

async function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // 允许重复选择同一文件
  input.value = "";
  if (!file) return;

  try {
    const avatar = await fileToAvatarDataUrl(file);
    await userStore.updateUser({ avatar });
    toast.success("头像已更新");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "头像更新失败");
  }
}

/** 选择图片后压缩为 ≤256px 的 data URL，避免把大图整存进数据库 */
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("图片解析失败"));
    img.src = dataUrl;
  });

  const maxSide = Math.max(img.width, img.height);
  const scale = Math.min(1, 256 / maxSide);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

useAsyncData(async () => {
  // 同步今日的学习总时长
  const { setupLearningTime } = useLearningTimeTracker();
  setupLearningTime(await fetchTodayLearningTime());
});

function useCalendarGraph() {
  const data = ref<CalendarDataItem[]>([]);
  const totalLearningTime = ref<number>(0);

  async function toggleYear(year?: number) {
    await setupLearningDailyTime(year);
  }

  return {
    data,
    totalLearningTime,
    toggleYear,
  };
}
</script>

<style scoped></style>
