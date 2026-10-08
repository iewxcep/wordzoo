// https://nuxt.com/docs/api/configuration/nuxt-config

const appScripts: any = [];
if (process.env.NODE_ENV === "production") {
  addClarity();
}

// for https://clarity.microsoft.com/
function addClarity() {
  appScripts.push({
    innerHTML: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${process.env.CLARITY}");`,
  });
}

export default defineNuxtConfig({
  ssr: false,
  // default is true, reference to https://nuxt.com/docs/guide/directory-structure/components
  // components: true,
  imports: {
    autoImport: false,
  },
  devtools: {
    enabled: true,
  },
  app: {
    head: {
      title: "WordZoo",
      link: [{ rel: "icon", href: "/favicon.ico" }],
      script: appScripts,
    },
  },
  css: ["~/assets/css/globals.css"],
  // 桌面版 renderer 由本地 API 静态托管，没有 /api/_nuxt_icon 端点，外网
  // api.iconify.design 也可能不可达：构建期把用到的图标全部内联进客户端
  // bundle，并禁用运行时外网回退，保证图标离线可用。
  icon: {
    fallbackToApi: false,
    clientBundle: {
      sizeLimitKb: 512,
      // @nuxt/icon@1.4.5 仅支持显式列表，且必须用 prefix:name 形式
      icons: [
        // 应用源码中的全部图标（phosphor）
        "ph:alarm-bold",
        "ph:arrow-counter-clockwise",
        "ph:arrow-right",
        "ph:arrow-up-bold",
        "ph:book",
        "ph:caret-left",
        "ph:caret-right",
        "ph:check-bold",
        "ph:crown-simple-fill",
        "ph:database",
        "ph:game-controller",
        "ph:gear",
        "ph:heart-straight-fill",
        "ph:house",
        "ph:info",
        "ph:keyboard",
        "ph:moon",
        "ph:pause",
        "ph:pencil-ruler-duotone",
        "ph:pencil-simple",
        "ph:robot",
        "ph:speaker-simple-high",
        "ph:star-fill",
        "ph:sun",
        "ph:trash-bold",
        // @nuxt/ui 内部默认图标（heroicons，模态关闭 X、下拉箭头等）
        "heroicons:arrow-path-20-solid",
        "heroicons:arrows-up-down-20-solid",
        "heroicons:bars-arrow-down-20-solid",
        "heroicons:bars-arrow-up-20-solid",
        "heroicons:check-20-solid",
        "heroicons:chevron-double-left-20-solid",
        "heroicons:chevron-double-right-20-solid",
        "heroicons:chevron-down",
        "heroicons:chevron-down-20-solid",
        "heroicons:chevron-left-20-solid",
        "heroicons:chevron-right-20-solid",
        "heroicons:circle-stack-20-solid",
        "heroicons:magnifying-glass-20-solid",
        "heroicons:minus-20-solid",
        "heroicons:x-mark-20-solid",
      ],
    },
  },
  modules: [
    "@nuxt/ui",
    "@vueuse/nuxt",
    "@nuxt/test-utils/module",
    "@hypernym/nuxt-anime",
    "@nuxt/image",
  ],
  plugins: ["~/plugins/http.ts"],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || "",
      helpDocsURL: process.env.HELP_DOCS_URL || "",
    },
  },
  build: {
    transpile: ["vue-sonner"],
  },
});
