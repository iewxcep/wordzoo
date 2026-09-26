<template>
  <div class="flex w-full flex-col">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-2xl font-bold">课程包管理</h2>
      <div class="flex items-center gap-2">
        <button
          class="btn btn-primary btn-sm"
          @click="openCreateModal"
        >
          新建课程包
        </button>
        <button
          class="btn btn-sm"
          @click="importInput?.click()"
        >
          导入课程包
        </button>
        <input
          ref="importInput"
          type="file"
          accept=".json,application/json"
          class="hidden"
          @change="onImportFileChange"
        />
      </div>
    </div>

    <template v-if="isLoading">
      <Loading></Loading>
    </template>
    <template v-else>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>描述</th>
              <th>排序</th>
              <th>课程数</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="coursePack in coursePacks"
              :key="coursePack.id"
            >
              <td>{{ coursePack.title }}</td>
              <td class="max-w-xs truncate">{{ coursePack.description }}</td>
              <td>{{ coursePack.order }}</td>
              <td>{{ coursePack.courseCount }}</td>
              <td class="text-right">
                <NuxtLink
                  :href="`/admin/${coursePack.id}`"
                  class="btn btn-ghost btn-xs mr-1"
                >
                  管理课程
                </NuxtLink>
                <button
                  class="btn btn-ghost btn-xs mr-1"
                  @click="openEditModal(coursePack)"
                >
                  编辑
                </button>
                <button
                  class="btn btn-ghost btn-xs mr-1"
                  @click="handleExport(coursePack)"
                >
                  导出
                </button>
                <button
                  class="btn btn-ghost btn-xs text-error"
                  @click="handleDelete(coursePack)"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <UModal v-model="showModal">
      <div class="p-6">
        <h3 class="mb-4 text-lg font-bold">
          {{ editingPack ? "编辑课程包" : "新建课程包" }}
        </h3>
        <div class="flex flex-col gap-3">
          <input
            v-model="form.title"
            class="input input-bordered w-full"
            placeholder="课程包标题"
          />
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered w-full"
            placeholder="课程包描述（可选）"
          ></textarea>
          <div class="flex justify-end gap-2">
            <button
              class="btn btn-ghost btn-sm"
              @click="showModal = false"
            >
              取消
            </button>
            <button
              class="btn btn-primary btn-sm"
              :disabled="!form.title.trim()"
              @click="handleSave"
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
import { useModal } from "#imports";
import { toast } from "vue-sonner";

import ConfirmDialog from "~/components/common/ConfirmDialog.vue";
import {
  createAdminCoursePack,
  deleteAdminCoursePack,
  downloadExportedCoursePack,
  fetchAdminCoursePacks,
  fetchExportCoursePack,
  importAdminCoursePack,
  updateAdminCoursePack,
  type AdminCoursePack,
  type ImportCoursePackPayload,
} from "~/api/admin";

const coursePacks = ref<AdminCoursePack[]>([]);
const isLoading = ref(true);

const showModal = ref(false);
const editingPack = ref<AdminCoursePack | null>(null);
const form = reactive({ title: "", description: "" });

onMounted(async () => {
  await setup();
});

async function setup() {
  isLoading.value = true;
  coursePacks.value = await fetchAdminCoursePacks();
  isLoading.value = false;
}

function openCreateModal() {
  editingPack.value = null;
  form.title = "";
  form.description = "";
  showModal.value = true;
}

function openEditModal(coursePack: AdminCoursePack) {
  editingPack.value = coursePack;
  form.title = coursePack.title;
  form.description = coursePack.description;
  showModal.value = true;
}

async function handleSave() {
  if (editingPack.value) {
    await updateAdminCoursePack(editingPack.value.id, {
      title: form.title.trim(),
      description: form.description,
    });
    toast.success("课程包已更新");
  } else {
    await createAdminCoursePack({
      title: form.title.trim(),
      description: form.description || undefined,
    });
    toast.success("课程包已创建");
  }
  showModal.value = false;
  await setup();
}

async function handleExport(coursePack: AdminCoursePack) {
  try {
    const data = await fetchExportCoursePack(coursePack.id);
    downloadExportedCoursePack(data);
    toast.success("课程包已导出");
  } catch (err) {
    console.error("[admin] export failed:", err);
    toast.error("导出失败");
  }
}

const importInput = ref<HTMLInputElement>();

async function onImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // 允许重复选择同一文件
  input.value = "";
  if (!file) return;

  let payload: ImportCoursePackPayload;
  try {
    payload = JSON.parse(await file.text()) as ImportCoursePackPayload;
  } catch (err) {
    toast.error(`JSON 解析失败：${err instanceof Error ? err.message : "文件格式不正确"}`);
    return;
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.title !== "string" ||
    !Array.isArray(payload.courses)
  ) {
    toast.error("文件结构不符合课程包格式（需要 title 与 courses 字段）");
    return;
  }

  try {
    const created = await importAdminCoursePack(payload);
    toast.success(`导入成功：${created.courseCount} 门课程，${created.statementCount} 条语句`);
    await setup();
  } catch (err) {
    console.error("[admin] import failed:", err);
    toast.error("导入失败，文件内容或格式不正确");
  }
}

const modal = useModal();

function handleDelete(coursePack: AdminCoursePack) {
  modal.open(ConfirmDialog, {
    title: "删除课程包",
    description: `确定删除课程包「${coursePack.title}」？\n其下所有课程与语句将一并删除。`,
    async onConfirm() {
      try {
        await deleteAdminCoursePack(coursePack.id);
        toast.success("课程包已删除");
        await setup();
      } catch {
        toast.error("删除失败");
      }
    },
  });
}
</script>
