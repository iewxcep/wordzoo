<script lang="ts" setup>
import { useModal } from "#imports";

defineProps({
  title: {
    type: String,
    default: "确认删除",
  },
  description: {
    type: String,
    default: "",
  },
  warningText: {
    type: String,
    default: "删除后无法恢复",
  },
  confirmText: {
    type: String,
    default: "删除",
  },
  cancelText: {
    type: String,
    default: "取消",
  },
});

const modal = useModal();
const emit = defineEmits(["cancel", "confirm"]);

async function onCancel() {
  await modal.close();
  emit("cancel");
}
async function onConfirm() {
  await modal.close();
  emit("confirm");
}
</script>

<template>
  <UModal :ui="{ width: 'w-full sm:max-w-sm' }">
    <div class="p-6 text-gray-900 dark:text-white">
      <div class="flex flex-col items-center gap-3 text-center">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15"
        >
          <UIcon
            name="i-ph-trash-bold"
            class="h-7 w-7 text-red-500"
          />
        </div>
        <h2 class="text-lg font-bold">{{ title }}</h2>
        <p class="whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300">
          {{ description }}
        </p>
        <p class="text-xs text-red-500/90">{{ warningText }}</p>
      </div>
      <div class="mt-8 flex justify-end gap-2">
        <button
          class="btn btn-ghost btn-sm"
          @click="onCancel"
        >
          {{ cancelText }}
        </button>
        <button
          class="btn btn-primary btn-sm"
          @click="onConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </UModal>
</template>
