# ELearn — Elearn 桌面版（独立 Electron 项目）

从 earthworm monorepo 抽出的独立可打包项目。前端 + 后端 + 管理端全部内嵌：

- **API**：`resources/api.cjs`（Nest 打包单文件），Electron main 进程内启动，监听 127.0.0.1（自动挑空闲端口，默认 3001 起）
- **数据库**：SQLite（better-sqlite3），位于用户数据目录，首次启动自动迁移 + 种子化 1 课程包 / 55 课 / 8865 句
- **前端**：Nuxt 静态产物（`resources/renderer`），由 API 同源托管
- **管理端**：应用内访问 `/admin`（课程包/课程/语句 CRUD、JSON 批量导入）
- 无登录（固定本地用户）、无 Redis、无 Docker

## 直接测试（推荐）

拷贝 `release/ELearn-1.0.0-win.zip` 到 Windows，解压后双击 `ELearn.exe` 即可（无需安装）。
数据落在 `%APPDATA%/ELearn/earthworm.db`。

## 在 Windows 上重新打包

```bash
npm install
npm run dist        # 产出 release/ELearn-Setup-1.0.0.exe（NSIS 安装包）+ zip
```

- `.npmrc` 已配好国内镜像（electron、electron-builder binaries、better-sqlite3 prebuild），
  `npm install` 会自动下载 Windows 版原生二进制，无需 VS Build Tools。
- 本仓库内构建产物用的是预置的 Windows prebuild（`npmRebuild: false`）；在 Windows 上
  如需正式安装包，可删掉 `electron-builder.yml` 里 `win.signAndEditExecutable: false`
  这一行（Linux 上必须保留，否则要 wine），exe 将获得正确的版本信息与图标。

## 目录结构

```
elearn/
├── src/main.ts            # main 进程：起 API（自动挑端口）→ 健康检查 → 开窗 loadURL
├── src/preload.ts         # 最小 contextBridge
├── resources/             # 随应用分发的构建产物
│   ├── api.cjs            # Nest API bundle（esbuild, external better-sqlite3）
│   ├── node_modules/      # better-sqlite3 + bindings（asar 外，供 api.cjs require）
│   ├── migrations/        # drizzle SQL 迁移（SQLite）
│   ├── courses-data/      # 课程 JSON（01..55.json）
│   └── renderer/          # Nuxt 静态站点
├── electron-builder.yml   # win: nsis + zip；asarUnpack better-sqlite3
├── build/icon.png
└── release/               # 打包输出
```

## 开发

```bash
npm run build:main   # esbuild src -> dist
npm start            # electron .（加载 resources/renderer，main 内起 API）
npm run typecheck
```

更新资源（改了 API/前端/课程数据后）：从 monorepo 重新构建并覆盖 `resources/` 对应目录：

```bash
cd /app/earthworm
pnpm build:desktop                       # schema → api → client → api.cjs
cp apps/desktop/dist/api.cjs ~/app/elearn/resources/api.cjs
cp -r apps/client/.output/public/* ~/app/elearn/resources/renderer/
cp -r packages/db/drizzle/* ~/app/elearn/resources/migrations/
cp -r packages/xingrong-courses/data/courses/* ~/app/elearn/resources/courses-data/
```

## 热部署（开发迭代用）

```bash
cd ~/app/elearn
./deploy.sh renderer   # 只发前端：应用内 Ctrl+R 刷新即生效
./deploy.sh api        # 发 API：重启 ELearn.exe 生效（发前先关掉运行中的应用）
./deploy.sh            # 两者都发（默认目标 /mnt/d/app/ELearn-1.0.0-win）
./deploy.sh <目录> [模式]  # 自定义目标
```

脚本会自动完成 构建产物 → 原子覆盖安装目录（renderer 目录切换 + api.cjs 替换）。
不触碰 `resources/node_modules`（Windows 原生二进制）与 `migrations`/`courses-data`。

## 已知限制

- exe 未签名（Windows 首次运行可能有 SmartScreen 提示，选"仍要运行"）
- Linux 交叉打包无法产出 NSIS 安装包（需 wine）；zip 便携包可用，或在 Windows 上 `npm run dist`
- `/rank/progress` 为兼容端点，单机版返回空榜单

## 日志

- 位置：`%APPDATA%\ELearn\logs\main.log`
- 内容：main 进程启动步骤、API 就绪状态、渲染进程 console（含 `[http]` 每个请求的状态与耗时、
  `[game]` 游戏页初始化步骤）、页面加载失败与崩溃信息
- 遇到问题时把 `main.log` 发出来即可定位
