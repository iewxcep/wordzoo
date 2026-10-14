<template>
  <div
    class="about-page mx-auto my-8 w-full space-y-10 rounded-lg bg-base-100 px-6 py-8 shadow-even-lg dark:bg-gray-900 dark:shadow-gray-700 md:px-12"
  >
    <section class="flex flex-col items-center gap-3 pb-6 text-center">
      <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d97757]/10">
        <UIcon
          name="ph:question"
          class="accent-text h-9 w-9"
        />
      </span>
      <h1 class="about-heading text-3xl font-bold tracking-wide text-[#141413] dark:text-[#faf9f5]">
        帮助
      </h1>
      <p class="about-body text-sm text-[#b0aea5]">
        三步生成专属题库：发指令 → 自动生成 → 导入开练
      </p>
    </section>

    <!-- 什么是课程包 -->
    <section>
      <h2 class="about-heading text-xl font-semibold text-[#141413] dark:text-[#faf9f5]">
        什么是题库（课程包）
      </h2>
      <p class="about-body mt-5 text-base leading-7 text-[#74726d] dark:text-[#b0aea5]">
        题库是一个 JSON 文件，里面是「课程包 → 课程 → 语句」三层内容。导入后，应用逐条呈现语句，你「看中文、打英文」逐句通关。
      </p>
      <div class="mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <div
          v-for="(layer, index) in layers"
          :key="layer.name"
          class="flex items-center gap-3"
        >
          <div class="about-card min-w-0 flex-1 rounded-xl border p-4">
            <h3 class="about-heading text-base font-semibold text-[#141413] dark:text-[#faf9f5]">
              {{ layer.name }}
            </h3>
            <p class="about-body mt-1 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
              {{ layer.desc }}
            </p>
          </div>
          <UIcon
            v-if="index < layers.length - 1"
            name="ph:arrow-right"
            class="h-5 w-5 shrink-0 rotate-90 text-[#d97757] md:rotate-0"
          />
        </div>
      </div>
    </section>

    <!-- 三步案例 -->
    <section>
      <h2 class="about-heading text-xl font-semibold text-[#141413] dark:text-[#faf9f5]">
        案例：让 AI 助手用 skill 生成「动物词汇题库」
      </h2>
      <p class="about-body mt-5 text-base leading-7 text-[#74726d] dark:text-[#b0aea5]">
        WordZoo 自带一个叫
        <code class="about-code-inline">course-pack</code>
        的技能，专门负责把词表变成题库。打开你常用的 AI 助手，让它用这个技能干活就行。
      </p>

      <div class="mt-6 space-y-6">
        <!-- 第 1 步 -->
        <div class="about-card rounded-xl border p-5">
          <div class="flex items-center gap-3">
            <span class="step-badge">1</span>
            <h3 class="about-heading text-base font-semibold text-[#141413] dark:text-[#faf9f5]">
              发送指令
            </h3>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="agent in AGENTS"
              :key="agent"
              class="accent-text rounded-full bg-[#d97757]/10 px-3 py-1 text-xs font-medium"
            >
              {{ agent }}
            </span>
          </div>
          <p class="about-body mt-3 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
            把下面这段话发给任意一个助手（可复制修改）：
          </p>
          <div class="code-block relative mt-3">
            <pre
              class="overflow-x-auto p-4 text-sm leading-6"
            ><code v-text="PROMPT_EXAMPLE"></code></pre>
            <CopyButton
              class="absolute right-3 top-3"
              :text="PROMPT_EXAMPLE"
            />
          </div>
          <p class="about-body mt-3 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
            词表换成你自己的——教材单词、课文、考试词表都可以；没有现成词表，只给一个主题（如「小学三年级动物名词」）也行。
          </p>
          <div class="skill-location mt-3 rounded-lg border-l-4 p-3">
            <p class="about-body text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
              <b class="text-[#141413] dark:text-[#faf9f5]">找不到技能？</b>
              告诉助手技能文件的位置：安装版 WordZoo 在
              <code class="about-code-inline">WordZoo.exe</code>
              同级的 <code class="about-code-inline">course-pack</code>
              文件夹（先读 <code class="about-code-inline">SKILL.md</code>，校验脚本在
              <code class="about-code-inline">scripts/validate.py</code>）；源码仓库里在
              <code class="about-code-inline">.agents/skills/course-pack</code>。
            </p>
          </div>
        </div>

        <!-- 第 2 步 -->
        <div class="about-card rounded-xl border p-5">
          <div class="flex items-center gap-3">
            <span class="step-badge">2</span>
            <h3 class="about-heading text-base font-semibold text-[#141413] dark:text-[#faf9f5]">
              助手自动生成并校验
            </h3>
          </div>
          <p class="about-body mt-3 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
            助手会按三层结构生成 JSON，并自动运行技能自带的校验脚本，帮你把英文里的标点等格式问题清干净、保证词条不重复。生成的内容大致长这样（节选）：
          </p>
          <div class="code-block mt-3">
            <pre
              class="overflow-x-auto p-4 text-sm leading-6"
            ><code v-text="JSON_EXAMPLE"></code></pre>
          </div>
          <p class="about-body mt-3 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
            只需要记住一条规则：练习用的英文一律不带标点——没有逗号、问号，句尾也不加句号，标点交给中文提示来表达。
          </p>
        </div>

        <!-- 第 3 步 -->
        <div class="about-card rounded-xl border p-5">
          <div class="flex items-center gap-3">
            <span class="step-badge">3</span>
            <h3 class="about-heading text-base font-semibold text-[#141413] dark:text-[#faf9f5]">
              导入 WordZoo，开练
            </h3>
          </div>
          <p class="about-body mt-3 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
            <b class="text-[#141413] dark:text-[#faf9f5]">能操作本地文件的助手</b>（WorkBuddy、Hermes 等）：校验通过后会直接帮你导入，打开 WordZoo 就能看到新题库。
          </p>
          <p class="about-body mt-2 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
            <b class="text-[#141413] dark:text-[#faf9f5]">网页版助手</b>（豆包、ChatGPT
            等）：把生成的 JSON 完整复制，保存为
            <code class="about-code-inline">.json</code> 文件，然后打开
            WordZoo 首页 → 设置菜单 → <b class="text-[#141413] dark:text-[#faf9f5]">课程管理</b> →
            「导入课程包」，选中该文件即可。
          </p>
          <p class="about-body mt-2 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
            提醒：同名题库重复导入会出现两个重复包，重新生成前先在课程管理里删除旧的。
          </p>
        </div>
      </div>
    </section>

    <!-- 常见问题 -->
    <section>
      <h2 class="about-heading text-xl font-semibold text-[#141413] dark:text-[#faf9f5]">
        常见问题
      </h2>
      <div class="mt-5 space-y-3">
        <details
          v-for="faq in faqs"
          :key="faq.q"
          class="about-card group rounded-xl border px-5 py-4"
        >
          <summary
            class="about-heading cursor-pointer select-none text-base font-semibold text-[#141413] marker:content-none dark:text-[#faf9f5]"
          >
            {{ faq.q }}
          </summary>
          <p class="about-body mt-2 text-sm leading-6 text-[#74726d] dark:text-[#b0aea5]">
            {{ faq.a }}
          </p>
        </details>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import CopyButton from "./CopyButton.vue";

const AGENTS = ["豆包", "WorkBuddy", "ChatGPT", "Hermes", "其他任意助手"];

const PROMPT_EXAMPLE = `请使用 WordZoo 的 course-pack 技能，把下面的词表生成一个题库：

cat 猫 / dog 狗 / pig 猪 / duck 鸭子 / bird 鸟
fish 鱼 / horse 马 / sheep 绵羊 / monkey 猴子 / panda 熊猫

要求：每课 5 词、按难度递进排列；单词附 IPA 音标和中文释义；
生成后先校验，再导入本地 WordZoo 并核对课数`;

const JSON_EXAMPLE = `{
  "title": "小学动物词汇题库",
  "description": "三年级常见动物名词 10 词，附音标与释义",
  "courses": [
    {
      "title": "L01 动物入门",
      "statements": [
        { "chinese": "猫", "english": "cat", "soundmark": "/kæt/" },
        { "chinese": "狗", "english": "dog", "soundmark": "/dɒɡ/" },
        { "chinese": "猪", "english": "pig", "soundmark": "/pɪɡ/" }
      ]
    },
    {
      "title": "L02 更多动物",
      "statements": [
        { "chinese": "鸭子", "english": "duck", "soundmark": "/dʌk/" },
        { "chinese": "鸟", "english": "bird", "soundmark": "/bɜːd/" }
      ]
    }
  ]
}`;

const layers = [
  {
    name: "课程包",
    desc: "一个 JSON 文件，导入后出现在首页课程列表里",
  },
  {
    name: "课程",
    desc: "类似「L01 动物入门」，一课一课闯关",
  },
  {
    name: "语句",
    desc: "一句中文 + 一句英文，看中文打英文",
  },
];

const faqs = [
  {
    q: "没有现成词表怎么办？",
    a: "直接告诉助手主题和学习阶段，比如「小学三年级常见动物名词」「新概念第一册前 10 课」，让它编排词表并补全音标与释义。",
  },
  {
    q: "导入报「文件内容或格式不正确」？",
    a: "检查 JSON 是否包含 title 与 courses 字段、每条语句的 chinese 和 english 是否非空；最常见的原因是英文里带了标点。",
  },
  {
    q: "词表很大怎么办？",
    a: "一个题库尽量不超过 50 门课程，多了就让助手拆成几个包，分批导入。",
  },
  {
    q: "网页版助手（豆包、ChatGPT）能用这个技能吗？",
    a: "它们读不了本地文件。把安装目录下 course-pack/SKILL.md 的内容粘贴给助手，或直接照帮助页里的指令与格式示例让它生成，拿到 JSON 后手动导入。",
  },
  {
    q: "想先看看别人生成的长什么样？",
    a: "仓库内置了 resources/seed-packs/小学英语词汇题库.json 可以参考；也可以在课程管理里「导出」任意题库，把导出的 JSON 当模板。",
  },
];
</script>

<style scoped>
/* 与 About 页一致的 Anthropic 品牌排版：标题 Poppins（Arial 回退），正文 Lora（Georgia 回退）；
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

.about-code-inline {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85em;
  border-radius: 0.375rem;
  /* 行内代码与正文区分：浅色用深字 + 实底米色，暗色用亮字 + 加深白底 */
  color: #141413;
  background-color: rgb(232 230 220 / 0.9);
  padding: 0.1rem 0.35rem;
}

:global(.dark) .about-code-inline {
  color: #faf9f5;
  background-color: rgb(255 255 255 / 0.16);
}

.code-block {
  border-radius: 0.75rem;
  background-color: #1f1e1d;
  color: #e8e6dc;
}

.code-block code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

section > h2 {
  @apply relative border-b pb-4;
}

section > h2::after {
  content: "";
  @apply absolute left-0 -bottom-px h-0.5 w-14 rounded-full;
  background-color: #d97757;
}

.step-badge {
  @apply flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold;
  color: #a34a26;
  background-color: rgb(217 119 87 / 0.12);
}

:global(.dark) .step-badge {
  color: #d97757;
}

/* 橙色点缀文字（徽章/图标）：浅色底上加深保证 ≥4.5:1，暗色底用品牌橙（已达标） */
.accent-text {
  color: #a34a26;
}

:global(.dark) .accent-text {
  color: #d97757;
}

.skill-location {
  border-color: #d97757;
  background-color: rgb(217 119 87 / 0.06);
}
</style>
