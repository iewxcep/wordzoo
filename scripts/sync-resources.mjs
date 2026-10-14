#!/usr/bin/env node
// 把 workspace 构建产物同步到 resources/（随应用分发的最终形态）。
// 由根 package.json 的 build:resources 在所有构建完成后调用。
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
} from "node:fs";
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

// 3.5 course-pack 技能：随包分发到安装根目录（electron-builder extraFiles
//     取 resources/course-pack → <install>/course-pack），供本地 AI 助手读取。
rmSync(resources("course-pack"), { recursive: true, force: true });
cpSync(path.join(root, ".agents/skills/course-pack"), resources("course-pack"), {
  recursive: true,
});

// 4. 原生 better-sqlite3：dev 用 workspace 里的 ELF（Linux node ABI）；
//    Windows 打包由 electron-builder 从 native/win/node_modules 单独取 PE prebuild。
//    bindings 供 better-sqlite3 运行时查找 .node（resources/node_modules 与 native/win 两份都带）。
// pnpm 不 hoist：bindings/file-uri-to-path 各自存放在 .pnpm 独立 store，
// 通过 symlink 串联（better-sqlite3 平级 symlink → bindings store → file-uri-to-path symlink）。
// 沿 symlink realpath 解析到真实目录，拷贝为普通文件（electron-builder 期望实体目录）。
rmSync(resources("node_modules"), { recursive: true, force: true });
import { createRequire } from "node:module";
function copyPkgReal(fromPath, destName) {
  cpSync(realpathSync(fromPath), path.join(resources("node_modules"), destName), { recursive: true });
}
const bsql3Entry = realpathSync(createRequire(import.meta.url).resolve("better-sqlite3")); // …/better-sqlite3/lib/index.js
const bsql3Pkg = path.dirname(path.dirname(bsql3Entry)); // 回退两级＝包根（含 lib/ build/）
const bsql3Pkgs = path.dirname(bsql3Pkg); // …/better-sqlite3@x.y.z/node_modules（pnpm store 平级）
copyPkgReal(bsql3Pkg, "better-sqlite3");
const bindingsPkgs = path.dirname(realpathSync(path.join(bsql3Pkgs, "bindings"))); // realpath 即 bindings@x 包目录，退一级到 store 平级
copyPkgReal(path.join(bindingsPkgs, "file-uri-to-path"), "file-uri-to-path");
copyPkgReal(path.join(bsql3Pkgs, "bindings"), "bindings");

function countJson(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith(".json")).length : 0;
}

console.log(
  `synced: renderer(${readdirSync(resources("renderer/_nuxt")).length} assets), ` +
    `migrations(1 sql + meta), courses-data(${countJson(resources("courses-data"))} json), ` +
    `node_modules(better-sqlite3 ELF for this platform)`,
);
