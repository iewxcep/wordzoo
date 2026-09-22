#!/usr/bin/env bash
# 把最新构建产物直接发布到 Windows 上已安装的 ELearn 目录（热部署）。
#
# 用法（在 WSL 里执行）:
#   ./deploy.sh                    # 前端+API 全部发布（默认目标目录）
#   ./deploy.sh <目标目录>          # 自定义目标目录
#   ./deploy.sh renderer           # 只发前端（应用内 F5 即生效）
#   ./deploy.sh api                # 只发 API（需重启应用生效）
#   ./deploy.sh <目标> renderer|api
#
# 生效方式:
#   renderer  → API 静态托管每次请求都读磁盘，覆盖后浏览器刷新(F5/重启窗口)即生效
#   api.cjs   → main 进程启动时加载一次，覆盖后必须重启 ELearn.exe
#   注意: 发 api 前先关掉正在运行的 ELearn（Windows 下替换被占用的 exe/dll 会失败）

set -euo pipefail

TARGET_DIR="${1:-/mnt/d/app/ELearn-1.0.0-win}"
MODE="${2:-all}"
REPO=/app/earthworm
ELEARN=/home/xht/app/elearn

if [[ "${1:-}" == "renderer" || "${1:-}" == "api" ]]; then
  TARGET_DIR=/mnt/d/app/ELearn-1.0.0-win
  MODE="$1"
fi

RESOURCES="$TARGET_DIR/resources"
if [[ ! -d "$RESOURCES" ]]; then
  echo "错误: 找不到 $RESOURCES，确认目标目录是否正确" >&2
  exit 1
fi

deploy_renderer() {
  echo "==> 构建前端 (nuxt generate, API_BASE='')"
  (cd "$REPO" && pnpm -F client generate > /dev/null)
  echo "==> 发布 renderer 到 $RESOURCES/renderer"
  # 覆盖式发布：Windows 下应用运行时目录可能被占用，避免 rename 失败；
  # 旧的 content-hash chunk 留在原地无害（新构建文件名不同）
  cp -r "$REPO/apps/client/.output/public/." "$RESOURCES/renderer/"
  echo "    完成 —— 在应用里刷新页面(Ctrl+R)即可看到新前端"
}

deploy_api() {
  echo "==> 构建后端 (schema → nest build → esbuild bundle)"
  (cd "$REPO" && pnpm schema:build > /dev/null && pnpm -F api build > /dev/null)
  (cd "$REPO/apps/desktop" && pnpm build:api-bundle > /dev/null)
  echo "==> 发布 api.cjs 到 $RESOURCES/api.cjs"
  if [[ -f "$RESOURCES/api.cjs.running" ]]; then
    echo "警告: 检测到上次 api 部署残留" >&2
  fi
  cp "$REPO/apps/desktop/dist/api.cjs" "$RESOURCES/api.cjs.new"
  mv -f "$RESOURCES/api.cjs.new" "$RESOURCES/api.cjs"
  # 同步初始化题库（种子化用）
  if [[ -d "$ELEARN/resources/seed-packs" ]]; then
    mkdir -p "$RESOURCES/seed-packs"
    cp "$ELEARN/resources/seed-packs/"*.json "$RESOURCES/seed-packs/"
  fi
  echo "    完成 —— 重启 ELearn.exe 生效"
}

case "$MODE" in
  renderer) deploy_renderer ;;
  api)      deploy_api ;;
  all)      deploy_renderer; deploy_api ;;
  *) echo "用法: ./deploy.sh [目标目录] [renderer|api|all]" >&2; exit 1 ;;
esac

echo "==> 部署完成 ($TARGET_DIR)"
