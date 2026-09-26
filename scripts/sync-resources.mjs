#!/usr/bin/env node
// 把 workspace 构建产物同步到 resources/（随应用分发的最终形态）。
// 由根 package.json 的 build:resources 在所有构建完成后调用。
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const resources = (name) => path.join(root, "resources", name);

// 1. 渲染层：整目录替换（旧 chunk 的 content-hash 文件名不同，直接清掉）
rmSync(resources("renderer"), { recursive: true, force: true });
cpSync(path.join(root, "apps/client/.output/public"), resources("renderer"), {
  recursive: true,
});

// 2. 迁移 SQL：drizzle 产物（0000_*.sql + meta/）
mkdirSync(resources("migrations"), { recursive: true });
cpSync(path.join(root, "packages/db/drizzle/0000_tired_mariko_yashida.sql"), resources("migrations/0000_tired_mariko_yashida.sql"));
cpSync(path.join(root, "packages/db/drizzle/meta"), resources("migrations/meta"), { recursive: true });

// 3. 课程数据：xingrong-courses data/courses 下的 01..NN.json
cpSync(path.join(root, "packages/xingrong-courses/data/courses"), resources("courses-data"), {
  recursive: true,
});

// 4. 原生 better-sqlite3：dev 用 workspace 里的 ELF（Linux node ABI）；
//    Windows 打包由 electron-builder 从 native/win/node_modules 单独取 PE prebuild。
//    bindings 供 better-sqlite3 运行时查找 .node（resources/node_modules 与 native/win 两份都带）。
rmSync(resources("node_modules"), { recursive: true, force: true });
cpSync(path.join(root, "node_modules/better-sqlite3"), resources("node_modules/better-sqlite3"), {
  recursive: true,
});
cpSync(path.join(root, "node_modules/bindings"), resources("node_modules/bindings"), {
  recursive: true,
});
cpSync(path.join(root, "node_modules/file-uri-to-path"), resources("node_modules/file-uri-to-path"), {
  recursive: true,
});

function countJson(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith(".json")).length : 0;
}

console.log(
  `synced: renderer(${readdirSync(resources("renderer/_nuxt")).length} assets), ` +
    `migrations(1 sql + meta), courses-data(${countJson(resources("courses-data"))} json), ` +
    `node_modules(better-sqlite3 ELF for this platform)`,
);
