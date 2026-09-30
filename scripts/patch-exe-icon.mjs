#!/usr/bin/env node
// 把 build/icon.ico 写进打包出的 WordZoo.exe 图标资源（RT_GROUP_ICON id=1）。
// 用途：electron-builder 在 Linux 交叉打包时 signAndEditExecutable: false，
// exe 图标需要打包后补写（Windows 上 pnpm run dist 也会自动执行一次）。
// 依赖 resedit（workspace 根 devDependencies）。
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require2 = createRequire(path.join(root, "package.json"));
const { NtExecutable, NtExecutableResource } = require2("resedit");
const iconGroupEntryMod = await import(
  new URL(
    "../node_modules/.pnpm/resedit@1.7.2/node_modules/resedit/dist/resource/IconGroupEntry.js",
    import.meta.url,
  )
);
const iconFileMod = await import(
  new URL(
    "../node_modules/.pnpm/resedit@1.7.2/node_modules/resedit/dist/data/IconFile.js",
    import.meta.url,
  )
);
// resedit CJS 互操作：default 可能包两层
const IconGroupEntry = iconGroupEntryMod.default.default ?? iconGroupEntryMod.default;
const IconFile = iconFileMod.default?.default ?? iconFileMod.default;

const exePath = process.argv[2] ?? path.join(root, "release/win-unpacked/WordZoo.exe");
const icoPath = process.argv[3] ?? path.join(root, "build/icon.ico");

try {
  await access(exePath);
} catch {
  console.error(`找不到 ${exePath}，先跑 pnpm run dist:dir`);
  process.exit(1);
}

const exe = NtExecutable.from(await readFile(exePath));
const res = NtExecutableResource.from(exe);
const groups = IconGroupEntry.fromEntries(res.entries);
const target = groups.find((g) => g.id === 1) ?? groups[0];
if (!target) {
  console.error("exe 内没有任何图标组，跳过");
  process.exit(1);
}

const ico = IconFile.from(await readFile(icoPath));
const iconItems = ico.icons.map((i) => i.data);
IconGroupEntry.replaceIconsForResource(res.entries, target.id, target.lang, iconItems);
res.outputResource(exe);
await writeFile(exePath, Buffer.from(exe.generate()));
console.log(`WordZoo.exe 图标已更新 → ${exePath} (${iconItems.length} 帧)`);
