<template>
  <button
    class="copy-button flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs transition-colors hover:bg-white/20"
    :class="copied ? 'text-emerald-400' : 'text-[#e8e6dc]/80'"
    :aria-label="copied ? '已复制' : '复制'"
    @click="copy"
  >
    <UIcon
      :name="copied ? 'ph:check' : 'ph:copy'"
      class="h-4 w-4"
    />
    {{ copied ? "已复制" : "复制" }}
  </button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const props = defineProps<{ text: string }>();

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text);
  } catch {
    fallbackCopy(props.text);
  }
  copied.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => (copied.value = false), 2000);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<style scoped></style>
