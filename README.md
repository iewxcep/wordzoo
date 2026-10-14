# WordZoo — 桌面版（Electron + 全栈单仓）

本仓库完全自包含：API（Nest）、前端（Nuxt）、管理端、课程数据、数据库迁移全部在本仓，
构建/修改不再依赖任何外部 monorepo。

- **API**：`resources/api.cjs`（Nest 打包单文件），Electron main 进程内启动，监听 127.0.0.1（自动挑空闲端口，默认 3001 起）
- **数据库**：SQLite（better-sqlite3），位于用户数据目录，首次启动自动迁移 + 种子化 1 课程包 / 55 课 / 8865 句
- **前端**：Nuxt 静态产物（`resources/renderer`），由 API 同源托管
- **管理端**：应用内访问 `/admin`（课程包/课程/语句 CRUD、JSON 批量导入）
- 无登录（固定本地用户）、无 Redis、无 Docker

## 直接测试（推荐）

拷贝 `release/WordZoo-1.0.0-win.zip` 到 Windows，解压后双击 `WordZoo.exe` 即可（无需安装）。
- 数据落在 `%APPDATA%/WordZoo/wordzoo.db`。

## 界面调整

- 首页热力图在窗口较高时固定显示在页面底部（内容不足时仍随滚动流）；`Landing` 页已移除「常见问题」与页脚（含贡献代码链接）两个区块。
- 「关于」页新增「赞助支持」区块：展示支付宝收款码（`apps/client/public/sponsor-alipay.jpg`），纯自愿赞助、无任何回报。
- 设置菜单新增「帮助」页（位于「关于」之上，`apps/client/pages/User/Help.vue`）：介绍课程包三层结构，并给出在豆包 / WorkBuddy / ChatGPT / Hermes 等 AI 助手中用 `course-pack` 技能生成题库的三步案例（发指令 → 自动生成校验 → 导入开练）。

## 目录结构

```
wordzoo/
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
│   ├── course-pack/          # course-pack 技能（.agents 同步而来；打包落到安装根目录）
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

`build:resources` 一次产出全部随应用分发物：`resources/{api.cjs,migrations,courses-data,renderer,node_modules,course-pack}`。
api.cjs 与旧发布件逐字节一致（md5 feb2e240…），课程数据、迁移 SQL 亦同。

### 分包说明

- `@earthworm/schema`：tsup 构建，被 api 与 db 包引用（`pnpm schema:build`）。
- `@earthworm/db`：仅 db:init（drizzle-kit push）/ studio 用，桌面运行不需要。
- `@earthworm/xingrong-courses`：课程 JSON 的源头；`pnpm db:upload` 可直接种子化 SQLite。

## Windows 打包

```bash
corepack pnpm run dist   # 产出 release/WordZoo-Setup-1.0.0.exe（NSIS 安装包）+ zip
```

- course-pack 技能随包分发：`electron-builder.yml` 的 `extraFiles` 把
  `resources/course-pack`（由 build:resources 从 `.agents/skills/course-pack` 同步）拷到安装根
  目录，即安装后与 `WordZoo.exe` 同级的 `course-pack/`（含 `SKILL.md` 与 `scripts/validate.py`），
  供本地 AI 助手按帮助页指引直接读取。

- Windows 打包用的 better-sqlite3 原生模块来自 `native/win/node_modules/`（electron-ABI
  PE32+ prebuild，`npmRebuild: false`）；在 Windows 本机如需重编原生模块，先装 VS Build Tools。
  prebuild 放置方式（升级 better-sqlite3 后需重取）：
  `curl -L -o /tmp/bs3.tgz https://registry.npmmirror.com/-/binary/better-sqlite3/v11.10.0/better-sqlite3-v11.10.0-electron-v125-win32-x64.tar.gz`，
  解压出 PE `better_sqlite3.node` 放入该目录的 `build/Release/`（ABI 需与所用 electron 大版本对应）。
- 隐藏窗口边框（Win11）：`src/main.ts` 用 koffi 调 `DwmSetWindowAttribute`（
  `DWMWA_BORDER_COLOR` 传 `DWMWA_COLOR_NONE`，不画边框；如需主题色边框，传
  COLORREF 值即可）。koffi
  与 better-sqlite3 同样从 `native/win/node_modules/koffi` 随包分发（extraResources），但
  它是 N-API 模块，无 ABI 之分。放置方式（升级 koffi 后需重取）：
  `curl -L -o /tmp/koffi.tgz https://registry.npmmirror.com/@koromix/koffi-win32-x64/-/koffi-win32-x64-<版本>.tgz`，
  把包内 `win32_x64/koffi.node` 放入 `<koffi 包根>/build/win32_x64/`（包根用 `pnpm store`
  里 `koffi@<同版本>` 的完整目录，`dist/main.js` 运行时沿 app.asar 解析到它）。
- Linux 上必须保留 `electron-builder.yml` 里 `win.signAndEditExecutable: false`（否则要 wine）。
  NSIS 目标即使这样也仍需 wine（wine 会跑一遍第一遍安装器以生成卸载器）：
  `sudo dpkg --add-architecture i386 && sudo apt update && sudo apt install -y wine wine32 wine64`。
- exe 将无签名。图标链路：`pnpm run dist` 先 `--dir` 产出 win-unpacked → `patch-exe-icon.mjs`
  把 `build/icon.ico` 写进 exe 的 RT_GROUP_ICON → 再用 `electron-builder --win nsis|zip
  --prepackaged release/win-unpacked` 封 Setup/zip，保证安装包里的 exe 也带正确图标。
  NSIS 安装器图标由 makensis 编译期自动嵌入，同样来自 `build/icon.ico`。

### Microsoft Store（appx）

`appx` 打包只能在 Windows 上执行（Linux 交叉打包不支持），且无需安装 Windows SDK——makeappx 来自 electron-builder 的 vendor 包：

```powershell
corepack pnpm run dist:store   # 产出 release/WordZoo-1.0.0-x64.appx
```

- `electron-builder.yml` 的 `appx` 块写入 Partner Center「应用管理 → App identity」下发的
  `identityName` / `publisher`（如 `tonghua.WordZoo` / `CN=…`），商店提交后由微软免费代签，无需代码签名证书。
- 生成的 `.appx` 上传到 Partner Center 的 Packages 页；本机验证用 `Add-AppxPackage` 安装。
- 打包自动声明受限功能 `runFullTrust`：Electron/Chromium 进程模型（主/渲染/GPU/崩溃处理
  子进程）无法在 UWP AppContainer 沙箱内运行，Discord、WhatsApp 等 Electron 应用同样如此。
  首次提交需在 Partner Center「提交 → 属性 → 受限功能」填写用途说明（标准桌面行为：窗口
  渲染、本地 SQLite 读写、127.0.0.1 本地 API 仅供自身渲染进程访问、`shell.openExternal`
  打开外链），Electron 应用此类说明通常均获批准。
- 注意 MSIX 身份下 `%APPDATA%` 会被重定向到包私有目录，与 zip 版数据不互通。

## 开发

```bash
corepack pnpm run dev:api       # schema 构建 + 起 API（SQLite 直落 ./data/wordzoo.db）
corepack pnpm -F client dev     # 前端 dev server
corepack pnpm run build:main && corepack pnpm start   # electron 加载 resources/renderer
corepack pnpm run typecheck
```

改了 API / 前端 / 课程数据后运行 `corepack pnpm run build:resources` 重建 `resources/`；
Electron 内 F5 即见新前端，api.cjs 变更需重启 WordZoo。

## 热部署（开发迭代用）

```bash
./deploy.sh renderer   # 只发前端：应用内 Ctrl+R 刷新即生效
./deploy.sh api        # 发 API：重启 WordZoo.exe 生效（发前先关掉运行中的应用）
./deploy.sh            # 两者都发（默认目标 /mnt/d/app/WordZoo-1.0.0-win）
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

- 位置：`%APPDATA%\WordZoo\logs\main.log`
- 内容：main 进程启动步骤、API 就绪状态、渲染进程 console（含 `[http]` 每个请求的状态与耗时、
  `[game]` 游戏页初始化步骤）、页面加载失败与崩溃信息
- 遇到问题时把 `main.log` 发出来即可定位
