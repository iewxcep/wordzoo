import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";

interface FitTitleOptions {
  /** 基准字号 px（超宽时以此为上限等比缩小） */
  base?: number;
  /** 最小字号 px（缩到仍溢出则截断兜底） */
  min?: number;
  /** 容器内左右已占用的像素（padding 等） */
  padding?: number;
}

/**
 * 课程名称居中显示且不换行：宽度超出容器时按比例缩小字号，
 * 容器尺寸变化（窗口/布局）由 ResizeObserver 跟随。
 */
export function useFitTitle(
  containerRef: Ref<HTMLElement | null>,
  titleRef: Ref<HTMLElement | null>,
  text: Ref<string> | (() => string),
  options: FitTitleOptions = {},
) {
  const base = options.base ?? 18;
  const min = options.min ?? 10;
  const padding = options.padding ?? 32;

  let resizeObserver: ResizeObserver | undefined;
  let frame = 0;

  function fit() {
    const container = containerRef.value;
    const title = titleRef.value;
    if (!container || !title) return;

    title.style.fontSize = `${base}px`;
    const textWidth = title.scrollWidth;
    const available = container.clientWidth - padding;

    let fontSize = base;
    if (textWidth > available && textWidth > 0) {
      fontSize = Math.max(min, Math.floor((base * available) / textWidth));
    }
    title.style.fontSize = `${fontSize}px`;
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fit);
  }

  onMounted(() => {
    fit();
    if (containerRef.value && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => schedule());
      resizeObserver.observe(containerRef.value);
    }
  });

  watch(
    () => (typeof text === "function" ? text() : text.value),
    () => schedule(),
  );

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    cancelAnimationFrame(frame);
  });

  return { fit };
}
