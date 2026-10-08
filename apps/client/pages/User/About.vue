<template>
  <div
    class="about-page mx-auto my-8 w-full space-y-10 rounded-lg bg-base-100 px-6 py-8 shadow-even-lg dark:bg-gray-900 dark:shadow-gray-700 md:px-12"
  >
    <section class="flex flex-col items-center gap-4 pb-10 text-center">
      <img
        src="/logo.png"
        alt="WordZoo logo"
        class="h-24 w-24"
      />
      <h1 class="about-heading text-3xl font-bold tracking-wide text-[#141413] dark:text-[#faf9f5]">
        字游 WordZoo
      </h1>
      <p class="about-body text-sm text-[#b0aea5]">
        让英语学习像打游戏一样简单 · v{{ version }}
      </p>
    </section>

    <section>
      <h2 class="about-heading text-xl font-semibold text-[#141413] dark:text-[#faf9f5]">缘起</h2>
      <div
        class="mt-5 space-y-4 rounded-xl bg-[#e8e6dc]/50 p-6 text-base leading-7 text-[#141413]/90 dark:bg-white/5 dark:text-[#faf9f5]/90"
      >
        <p class="about-body">
          这一切开始于一次偶然——我发现了
          <a
            class="about-link font-medium text-[#d97757] underline decoration-[#d97757]/40 underline-offset-4 hover:decoration-[#d97757]"
            href="https://github.com/cuixueshe/earthworm"
            @click.prevent="openUpstream"
          >Earthworm</a>
          这个很棒的开源项目：用「连词搭积木」的思路学英语，把背单词变成逐句打字通关。遗憾的是，把它跑起来并不轻松——Postgres、Redis、Docker
          一个都不能少，不少想用它学英语的人被挡在了门外。
        </p>
        <p class="about-body">
          于是我以 vibe coding 的方式对它进行了改造，做成了一个基于
          Electron
          的单体应用：开箱即用、数据保存在本地、断网也能继续学习；保留了它最核心的逐句打字练习，并新增了课程包导入——你可以把自己整理的词表交给任意大模型（DeepSeek、ChatGPT、Claude
          等），让它生成一套专属的练习内容，一键导入即可开练，不再受官方课程数据的限制。
        </p>
        <p class="about-body">
          至于名字为什么叫「字游」——玩着玩着，我总会想起高中时在电脑课玩过的打字游戏：指尖在键盘上追逐屏幕上的字母，连背课文都变得好玩起来。所以我希望英语学习也能像打游戏一样简单，一字一句，皆是闯关。
        </p>
      </div>
    </section>

    <section>
      <h2 class="about-heading text-xl font-semibold text-[#141413] dark:text-[#faf9f5]">核心功能</h2>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="about-card flex items-start gap-4 rounded-xl border p-5 transition-shadow duration-200 hover:shadow-md"
        >
          <span
            class="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            :style="{ color: feature.accent, backgroundColor: feature.accent + '14' }"
          >
            <UIcon
              :name="feature.icon"
              class="h-6 w-6"
            />
          </span>
          <div class="min-w-0">
            <h3 class="about-heading text-base font-semibold text-[#141413] dark:text-[#faf9f5]">
              {{ feature.title }}
            </h3>
            <p class="about-body mt-1 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="about-heading text-xl font-semibold text-[#141413] dark:text-[#faf9f5]">致谢开源</h2>
      <p class="about-body mt-5 text-base leading-7 text-[#74726d] dark:text-[#b0aea5]">
        字游（WordZoo）站在开源的肩膀上，基于
        <a
          class="about-link font-medium text-[#6a9bcc] underline decoration-[#6a9bcc]/40 underline-offset-4 hover:decoration-[#6a9bcc]"
          href="https://github.com/cuixueshe/earthworm"
          @click.prevent="openUpstream"
        >Earthworm</a>（AGPL-3.0）改造而来，感谢原作者与所有贡献者。作为 AGPL-3.0
        的一部分，本项目同样以相同协议开放。<a
          class="about-link font-medium text-[#6a9bcc] underline decoration-[#6a9bcc]/40 underline-offset-4 hover:decoration-[#6a9bcc]"
          href="https://github.com/iewxcep/wordzoo"
          @click.prevent="openUpstream"
        >查看源码</a>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const version = ref("1.0.0");

onMounted(async () => {
  const bridgeVersion = await window.desktop?.getVersion?.();
  if (bridgeVersion) version.value = bridgeVersion;
});

async function openUpstream(event: MouseEvent) {
  const url = (event.currentTarget as HTMLAnchorElement | undefined)?.href;
  if (!url) return;
  if (window.desktop?.openExternal) {
    await window.desktop.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener");
}

/** Anthropic 品牌强调色轮换（orange / blue / green） */
const ACCENTS = ["#d97757", "#6a9bcc", "#788c5d"] as const;

const features = [
  {
    icon: "ph:pencil-simple",
    title: "逐句打字通关",
    description:
      "看中文、敲英文，像打字游戏一样逐句闯关。键盘音效与连词造句相结合，输入正确才能过关，学习进度自动保存。",
  },
  {
    icon: "ph:speaker-simple-high",
    title: "整句朗读发音",
    description:
      "微软 Edge 神经语音生成整句朗读，配合有道单词真人录音逐词兜底；支持自动朗读、语速调节、答案页自动播放。",
  },
  {
    icon: "ph:game-controller",
    title: "两种练习模式",
    description:
      "默写模式（听拼写）与中译英模式（看中文打英文）自由切换；自动显示答案提示、跳过、掌握标记，还有键盘音效。",
  },
  {
    icon: "ph:robot",
    title: "大模型定制课程",
    description:
      "课程包是「课程包 → 课程 → 语句」的三层 JSON 结构。把生词表或课文交给大模型，让它生成专属练习内容，一键导入即可使用。",
  },
  {
    icon: "ph:database",
    title: "离线单体应用",
    description:
      "基于 Electron 打包，开箱即用，无需部署数据库；全部学习数据保存在本地 SQLite（%APPDATA%/WordZoo/wordzoo.db），隐私与进度都在自己手里。",
  },
  {
    icon: "ph:alarm-bold",
    title: "学习统计",
    description:
      "自动记录每课答题用时与每日学习时长，配合日历热力图，每天坚持一点，看得见的成长。",
  },
  {
    icon: "ph:keyboard",
    title: "上手即玩",
    description:
      "默认快捷键（播放发音、下一题、掌握、暂停）无需配置；支持深色主题与快捷键自定义，长句短句、生词复习节奏由你决定。",
  },
].map((feature, index) => ({ ...feature, accent: ACCENTS[index % ACCENTS.length] }));
</script>

<style scoped>
/* Anthropic 品牌排版：标题 Poppins（Arial 回退），正文 Lora（Georgia 回退）；
   追加中文回退链，保证 CJK 在 Windows/Electron 与 Linux 下清晰渲染 */
.about-heading {
  font-family:
    Poppins,
    Arial,
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    sans-serif;
}

.about-body {
  font-family:
    Lora,
    Georgia,
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    serif;
}

.about-card {
  border-color: #e8e6dc;
}

:global(.dark) .about-card {
  border-color: rgba(250, 249, 245, 0.12);
}

section > h2 {
  @apply border-b pb-4;
}

section > h2::after {
  content: "";
  @apply absolute left-0 -bottom-px h-0.5 w-14 rounded-full;
  background-color: #d97757;
}

section > h2 {
  @apply relative;
}
</style>
