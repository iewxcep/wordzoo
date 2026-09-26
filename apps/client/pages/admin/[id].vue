<template>
  <div class="flex w-full flex-col">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin"
          class="btn btn-ghost btn-sm"
        >
          ← 返回
        </NuxtLink>
        <h2 class="text-2xl font-bold">课程管理</h2>
      </div>
      <button
        class="btn btn-primary btn-sm"
        @click="openCreateCourseModal"
      >
        新建课程
      </button>
    </div>

    <template v-if="isLoading">
      <Loading></Loading>
    </template>
    <template v-else>
      <div class="flex flex-col gap-6">
        <div
          v-for="course in courses"
          :key="course.id"
          class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
        >
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold">{{ course.title }}</span>
              <span class="text-sm text-gray-400">（{{ course.statements.length }} 句）</span>
            </div>
            <div class="flex gap-1">
              <button
                class="btn btn-ghost btn-xs"
                @click="openEditCourseModal(course)"
              >
                编辑课程信息
              </button>
              <button
                class="btn btn-ghost btn-xs text-error"
                @click="handleDeleteCourse(course)"
              >
                删除课程
              </button>
            </div>
          </div>

          <table class="table table-sm">
            <thead>
              <tr>
                <th class="w-12">#</th>
                <th>英文</th>
                <th>中文</th>
                <th>音标</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="statement in course.statements"
                :key="statement.id"
              >
                <td>{{ statement.order }}</td>
                <td>
                  <input
                    v-model="statement.english"
                    class="input input-bordered input-xs w-full"
                    @change="handleSaveStatement(statement)"
                  />
                </td>
                <td>
                  <input
                    v-model="statement.chinese"
                    class="input input-bordered input-xs w-full"
                    @change="handleSaveStatement(statement)"
                  />
                </td>
                <td>
                  <input
                    v-model="statement.soundmark"
                    class="input input-bordered input-xs w-full"
                    @change="handleSaveStatement(statement)"
                  />
                </td>
                <td class="text-right">
                  <button
                    class="btn btn-ghost btn-xs text-error"
                    @click="handleDeleteStatement(course, statement)"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- 新建课程 / 批量导入 -->
    <UModal v-model="showCreateCourseModal">
      <div class="p-6">
        <h3 class="mb-4 text-lg font-bold">新建课程</h3>
        <div class="flex flex-col gap-3">
          <input
            v-model="courseForm.title"
            class="input input-bordered w-full"
            placeholder="课程标题，如：第 1 课"
          />
          <div>
            <label class="mb-1 block text-sm opacity-75">
              语句 JSON（数组，每项含 chinese / english / soundmark）
            </label>
            <textarea
              v-model="courseForm.statementsJson"
              class="textarea textarea-bordered h-48 w-full font-mono text-sm"
              placeholder='[{"chinese":"你好","english":"Hello","soundmark":"/heləʊ/"}]'
            ></textarea>
            <p
              v-if="parseError"
              class="mt-1 text-sm text-error"
            >
              {{ parseError }}
            </p>
          </div>
          <div class="flex justify-end gap-2">
            <button
              class="btn btn-ghost btn-sm"
              @click="showCreateCourseModal = false"
            >
              取消
            </button>
            <button
              class="btn btn-primary btn-sm"
              :disabled="!courseForm.title.trim()"
              @click="handleCreateCourse"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </UModal>

    <!-- 编辑课程信息 -->
    <UModal v-model="showEditCourseModal">
      <div class="p-6">
        <h3 class="mb-4 text-lg font-bold">编辑课程信息</h3>
        <div class="flex flex-col gap-3">
          <input
            v-model="editCourseForm.title"
            class="input input-bordered w-full"
            placeholder="课程标题"
          />
          <input
            v-model="editCourseForm.description"
            class="input input-bordered w-full"
            placeholder="课程描述（可选）"
          />
          <input
            v-model="editCourseForm.video"
            class="input input-bordered w-full"
            placeholder="教学视频链接（可选）"
          />
          <div class="flex justify-end gap-2">
            <button
              class="btn btn-ghost btn-sm"
              @click="showEditCourseModal = false"
            >
              取消
            </button>
            <button
              class="btn btn-primary btn-sm"
              @click="handleSaveCourse"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useModal } from "#imports";
import { toast } from "vue-sonner";

import ConfirmDialog from "~/components/common/ConfirmDialog.vue";
import {
  createAdminCourse,
  deleteAdminCourse,
  deleteAdminStatement,
  fetchAdminCourses,
  updateAdminCourse,
  updateAdminStatement,
  type AdminCourse,
  type AdminStatement,
} from "~/api/admin";

const route = useRoute();
const coursePackId = route.params.id as string;

const courses = ref<AdminCourse[]>([]);
const isLoading = ref(true);

const showCreateCourseModal = ref(false);
const courseForm = reactive({ title: "", statementsJson: "" });
const parseError = ref("");

const showEditCourseModal = ref(false);
let editingCourse: AdminCourse | null = null;
const editCourseForm = reactive({ title: "", description: "", video: "" });

onMounted(async () => {
  await setup();
});

async function setup() {
  isLoading.value = true;
  courses.value = await fetchAdminCourses(coursePackId);
  isLoading.value = false;
}

function openCreateCourseModal() {
  courseForm.title = "";
  courseForm.statementsJson = "";
  parseError.value = "";
  showCreateCourseModal.value = true;
}

function parseStatementsJson(): { chinese: string; english: string; soundmark: string }[] {
  parseError.value = "";
  const raw = courseForm.statementsJson.trim();
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parseError.value = "JSON 格式错误";
    throw new Error("invalid json");
  }
  if (!Array.isArray(parsed)) {
    parseError.value = "需要是一个数组";
    throw new Error("not an array");
  }
  const statements = parsed.map((item: any) => ({
    chinese: String(item.chinese ?? ""),
    english: String(item.english ?? ""),
    soundmark: String(item.soundmark ?? ""),
  }));
  const invalid = statements.find((s) => !s.chinese.trim() || !s.english.trim());
  if (invalid) {
    parseError.value = "每条语句必须包含 chinese 和 english";
    throw new Error("invalid statement");
  }
  return statements;
}

async function handleCreateCourse() {
  let statements;
  try {
    statements = parseStatementsJson();
  } catch {
    return;
  }
  await createAdminCourse(coursePackId, {
    title: courseForm.title.trim(),
    statements,
  });
  toast.success("课程已创建");
  showCreateCourseModal.value = false;
  await setup();
}

function openEditCourseModal(course: AdminCourse) {
  editingCourse = course;
  editCourseForm.title = course.title;
  editCourseForm.description = course.description;
  editCourseForm.video = course.video;
  showEditCourseModal.value = true;
}

async function handleSaveCourse() {
  if (!editingCourse) return;
  await updateAdminCourse(editingCourse.id, {
    title: editCourseForm.title.trim(),
    description: editCourseForm.description,
    video: editCourseForm.video,
  });
  toast.success("课程信息已更新");
  showEditCourseModal.value = false;
  await setup();
}

const modal = useModal();

function handleDeleteCourse(course: AdminCourse) {
  modal.open(ConfirmDialog, {
    title: "删除课程",
    description: `确定删除课程「${course.title}」？\n其下所有语句将一并删除。`,
    async onConfirm() {
      try {
        await deleteAdminCourse(course.id);
        toast.success("课程已删除");
        await setup();
      } catch {
        toast.error("删除失败");
      }
    },
  });
}

async function handleSaveStatement(statement: AdminStatement) {
  await updateAdminStatement(statement.id, {
    chinese: statement.chinese,
    english: statement.english,
    soundmark: statement.soundmark,
  });
  toast.success("语句已保存");
}

function handleDeleteStatement(course: AdminCourse, statement: AdminStatement) {
  modal.open(ConfirmDialog, {
    title: "删除语句",
    description: `确定删除语句「${statement.english}」？`,
    async onConfirm() {
      try {
        await deleteAdminStatement(statement.id);
        course.statements = course.statements.filter((s) => s.id !== statement.id);
        toast.success("语句已删除");
      } catch {
        toast.error("删除失败");
      }
    },
  });
}
</script>
