# ELearn — 桌面版（Electron + 全栈单仓）

本仓库完全自包含：API（Nest）、前端（Nuxt）、管理端、课程数据、数据库迁移全部在本仓，
构建/修改不再依赖任何外部 monorepo。

- **API**：`resources/api.cjs`（Nest 打包单文件），Electron main 进程内启动，监听 127.0.0.1（自动挑空闲端口，默认 3001 起）
- **数据库**：SQLite（better-sqlite3），位于用户数据目录，首次启动自动迁移 + 种子化 1 课程包 / 55 课 / 8865 句
- **前端**：Nuxt 静态产物（`resources/renderer`），由 API 同源托管
- **管理端**：应用内访问 `/admin`（课程包/课程/语句 CRUD、JSON 批量导入）
- 无登录（固定本地用户）、无 Redis、无 Docker

## 直接测试（推荐）

拷贝 `release/ELearn-1.0.0-win.zip` 到 Windows，解压后双击 `ELearn.exe` 即可（无需安装）。
- 数据落在 `%APPDATA%/ELearn/elearn.db`（老版本 `earthworm.db` 启动时自动迁移）。

## 界面调整

- 首页热力图在窗口较高时固定显示在页面底部（内容不足时仍随滚动流）；`Landing` 页已移除「常见问题」与页脚（含贡献代码链接）两个区块。

## 目录结构

```
elearn/
├── src/main.ts               # main 进程：起 API（自动挑端口）→ 健康检查 → 开窗 loadURL
├── src/preload.ts            # 最小 contextBridge
├── apps/api/                 # Nest 后端源码（→ esbuild 打包成 resources/api.cjs）
├── apps/client/              # Nuxt 前端源码（→ nuxt generate 产出 resources/renderer）
├── packages/schema/          # drizzle 表定义 @earthworm/schema（tsup 构建）
├── packages/db/              # drizzle-kit 配置 + SQL 迁移（drizzle/）
├── packages/xingrong-courses/# 课程数据源 data/courses/01..55.json + seed 脚本
├── scripts/sync-resources.mjs# 构建产物 → resources/ 同步
├── native/win/node_modules/  # Windows electron-ABI 的 better-sqlite3 prebuild（PE32+）
├── resources/                # 随应用分发的最终产物（由 build:resources 生成/更新）
│   ├── api.cjs               # Nest API bundle（esbuild, external better-sqlite3）
│   ├── node_modules/         # better-sqlite3 + bindings（当前平台；开发运行用）
│   ├── migrations/           # drizzle SQL 迁移（SQLite）
│   ├── courses-data/         # 课程 JSON（01..55.json）
│   └── renderer/             # Nuxt 静态站点
├── electron-builder.yml      # win: nsis + zip；原生模块来自 native/win/
├── deploy.sh                 # 热部署到已安装目录
├── build/icon.png
└── release/                  # 打包输出
```

## 安装与日常构建

```bash
corepack pnpm install                  # 依赖安装（lockfile 已按 earthworm 时期版本冻结）
corepack pnpm run build:resources      # schema → api → api.cjs → client generate → 同步 resources/
```

`build:resources` 一次产出全部随应用分发物：`resources/{api.cjs,migrations,courses-data,renderer,node_modules}`。
api.cjs 与旧发布件逐字节一致（md5 feb2e240…），课程数据、迁移 SQL 亦同。

### 分包说明

- `@earthworm/schema`：tsup 构建，被 api 与 db 包引用（`pnpm schema:build`）。
- `@earthworm/db`：仅 db:init（drizzle-kit push）/ studio 用，桌面运行不需要。
- `@earthworm/xingrong-courses`：课程 JSON 的源头；`pnpm db:upload` 可直接种子化 SQLite。

## Windows 打包

```bash
corepack pnpm run dist   # 产出 release/ELearn-Setup-1.0.0.exe（NSIS 安装包）+ zip
```

- Windows 打包用的 better-sqlite3 原生模块来自 `native/win/node_modules/`（electron-ABI
  PE32+ prebuild，`npmRebuild: false`）；在 Windows 本机如需重编原生模块，先装 VS Build Tools。
- Linux 上必须保留 `electron-builder.yml` 里 `win.signAndEditExecutable: false`（否则要 wine），
  exe 将无签名、用默认 Electron 图标（NSIS 安装器图标仍来自 `build/icon.png`）。

## 开发

```bash
corepack pnpm run dev:api       # schema 构建 + 起 API（SQLite 直落 ./data/elearn.db）
corepack pnpm -F client dev     # 前端 dev server
corepack pnpm run build:main && corepack pnpm start   # electron 加载 resources/renderer
corepack pnpm run typecheck
```

改了 API / 前端 / 课程数据后运行 `corepack pnpm run build:resources` 重建 `resources/`；
Electron 内 F5 即见新前端，api.cjs 变更需重启 ELearn。

## 热部署（开发迭代用）

```bash
./deploy.sh renderer   # 只发前端：应用内 Ctrl+R 刷新即生效
./deploy.sh api        # 发 API：重启 ELearn.exe 生效（发前先关掉运行中的应用）
./deploy.sh            # 两者都发（默认目标 /mnt/d/app/ELearn-1.0.0-win）
./deploy.sh <目录> [模式]  # 自定义目标
```

脚本在本仓库内完成构建（`client:generate` / `api:build` + `api:bundle`），原子覆盖安装目录
（renderer 目录切换 + api.cjs 替换）；不触碰安装目录里的 `node_modules`。

## 已知限制

- exe 未签名（Windows 首次运行可能有 SmartScreen 提示，选"仍要运行"）
- Linux 交叉打包无法产出 NSIS 安装包（需 wine）；zip 便携包可用，或在 Windows 上 `corepack pnpm run dist`
- `/rank/progress` 为兼容端点，单机版返回空榜单
- cypress 二进制在本机不可下载时，安装需 `CYPRESS_INSTALL_BINARY=0`（仅 e2e 测试用，与构建无关）

## 日志

- 位置：`%APPDATA%\ELearn\logs\main.log`
- 内容：main 进程启动步骤、API 就绪状态、渲染进程 console（含 `[http]` 每个请求的状态与耗时、
  `[game]` 游戏页初始化步骤）、页面加载失败与崩溃信息
- 遇到问题时把 `main.log` 发出来即可定位
