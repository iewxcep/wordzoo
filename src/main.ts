import http from "node:http";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";

let logFile: string | undefined;

function log(level: "info" | "warn" | "error", ...args: unknown[]): void {
  const line = `[${new Date().toISOString()}] [${level}] ${args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ")}\n`;
  try {
    if (logFile) fs.appendFileSync(logFile, line);
  } catch {
    // ignore
  }
  if (level === "error") process.stderr.write(line);
  else process.stdout.write(line);
}

function initLogging(): void {
  const logsDir = path.join(app.getPath("userData"), "logs");
  fs.mkdirSync(logsDir, { recursive: true });
  logFile = path.join(logsDir, "main.log");
  log("info", `app v${app.getVersion()} packaged=${app.isPackaged} userData=${app.getPath("userData")}`);
}

interface DesktopResources {
  apiBundle: string;
  migrationsDir: string;
  coursesDataDir: string;
  rendererDir: string;
}

/** Locations of the api bundle and static assets, depending on packaged state. */
function getResources(): DesktopResources {
  if (app.isPackaged) {
    const res = process.resourcesPath;
    return {
      apiBundle: path.join(res, "api.cjs"),
      migrationsDir: path.join(res, "migrations"),
      coursesDataDir: path.join(res, "courses-data"),
      rendererDir: path.join(res, "renderer"),
    };
  }
  // dev: dist/main.js -> project root/resources
  const projectRoot = path.resolve(__dirname, "..");
  const resources = path.join(projectRoot, "resources");
  return {
    apiBundle: path.join(resources, "api.cjs"),
    migrationsDir: path.join(resources, "migrations"),
    coursesDataDir: path.join(resources, "courses-data"),
    rendererDir: path.join(resources, "renderer"),
  };
}

/** Pick a free TCP port, preferring 3001. */
function findFreePort(preferred: number): Promise<number> {
  const { promise, resolve, reject } = Promise.withResolvers<number>();
  const probe = (port: number, attemptsLeft: number) => {
    const server = net.createServer();
    server.once("error", () => {
      if (attemptsLeft <= 0) {
        reject(new Error("no free port found"));
        return;
      }
      probe(port + 1, attemptsLeft - 1);
    });
    server.once("listening", () => {
      server.close(() => resolve(port));
    });
    server.listen(port, "127.0.0.1");
  };
  probe(preferred, 50);
  return promise;
}

/**
 * Start the in-process API (which also serves the renderer static files).
 * Returns the base URL to health-check.
 */
async function startApiServer(): Promise<string> {
  const port = await findFreePort(Number(process.env.PORT || 3001));

  const resources = getResources();
  const dbPath = process.env.SQLITE_DB_PATH || path.join(app.getPath("userData"), "wordzoo.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  process.env.SQLITE_DB_PATH = dbPath;
  process.env.MIGRATIONS_DIR ||= resources.migrationsDir;
  process.env.COURSES_DATA_DIR ||= resources.coursesDataDir;
  process.env.RENDERER_DIR ||= resources.rendererDir;
  process.env.PORT = String(port);

  log("info", `starting api bundle=${resources.apiBundle} port=${port} db=${dbPath}`);
  require(resources.apiBundle);
  log("info", "api bundle loaded");
  return `http://127.0.0.1:${port}`;
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

function requestOk(url: string): Promise<boolean> {
  const { promise, resolve } = Promise.withResolvers<boolean>();
  const req = http.get(url, (res) => {
    res.resume();
    resolve(res.statusCode === 200);
  });
  req.on("error", () => resolve(false));
  req.setTimeout(2000, () => {
    req.destroy();
    resolve(false);
  });
  return promise;
}

const MAX_API_ATTEMPTS = 240; // ~2 minutes at 500ms intervals

async function waitForApi(apiUrl: string): Promise<void> {
  const healthUrl = new URL("/course-pack", apiUrl).toString();
  for (let attempt = 0; attempt < MAX_API_ATTEMPTS; attempt++) {
    if (await requestOk(healthUrl)) {
      return;
    }
    await delay(500);
  }
  throw new Error(`API did not become ready at ${healthUrl}`);
}

// Windows 11 build 22000+ 允许应用按窗口单独设置边框颜色：
// DWMWA_BORDER_COLOR = 34（dwmapi.h）。系统默认边框跟随 Windows 强调色
// （默认蓝色）；传 DWMWA_COLOR_NONE 表示不画边框，与无边框自绘应用一致。
const DWMWA_BORDER_COLOR = 34;
const DWMWA_COLOR_NONE = 0xfffffffe;
type DwmSetAttrFn = (hwnd: unknown, attr: number, pv: Buffer, cb: number) => number;
let dwmSetAttrCache: DwmSetAttrFn | null | undefined;

/** DwmSetWindowAttribute 的惰性绑定；非 Windows 或 koffi 缺失时返回 null，边框保持系统默认。 */
function getDwmSetAttr(): DwmSetAttrFn | null {
  if (dwmSetAttrCache !== undefined) return dwmSetAttrCache;
  let setter: DwmSetAttrFn | null = null;
  if (process.platform === "win32") {
    try {
      // koffi 是带预编译产物的 N-API 模块（无需 node-gyp），仅在 win32 分支 require。
      const koffi = require("koffi");
      const dwmapi = koffi.load("dwmapi.dll");
      // hwnd 必须是句柄值本身：getNativeWindowHandle() 的 Buffer 内容才是 HWND，
      // koffi 把 Buffer 传给 void * 时传的是 Buffer 数据地址（假句柄 → E_HANDLE），
      // 所以参数用 uintptr_t，调用处读出值再传。
      setter = dwmapi.func(
        "__stdcall",
        "DwmSetWindowAttribute",
        "long",
        ["uintptr_t", "uint32_t", "void *", "uint32_t"],
      );
    } catch (err) {
      log("warn", "dwmapi binding unavailable:", err);
    }
  }
  dwmSetAttrCache = setter;
  return setter;
}

/** 设置窗口边框（COLORREF 0x00BBGGRR 或 DWMWA_COLOR_NONE 等特殊值）；
 * 仅 Win11 生效，其余平台安全跳过（Win10 无此接口）。 */
function setWindowBorderColor(win: BrowserWindow, colorRef: number): void {
  const setAttr = getDwmSetAttr();
  if (!setAttr) return;
  try {
    const hwndBuf = win.getNativeWindowHandle();
    const hwnd = hwndBuf.length === 8 ? hwndBuf.readBigUInt64LE(0) : hwndBuf.readUInt32LE(0);
    const value = Buffer.alloc(4);
    value.writeUInt32LE(colorRef >>> 0, 0);
    const hr = setAttr(hwnd, DWMWA_BORDER_COLOR, value, 4);
    if (hr !== 0) {
      // 预期内失败：Win10 不支持该属性（E_INVALIDARG）。
      log("warn", `DwmSetWindowAttribute(BORDER_COLOR) hr=0x${(hr >>> 0).toString(16)}`);
    }
  } catch (err) {
    log("warn", "setWindowBorderColor failed:", err);
  }
}

function createWindow(rendererUrl: string): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    // Chromium 默认窗口底色是白色，换页/加载时会白闪；跟随客户端深色主题底色。
    backgroundColor: "#05051d",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setWindowBorderColor(win, DWMWA_COLOR_NONE);

  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const levelName = level === 3 ? "error" : level === 2 ? "warn" : "info";
    log(levelName as "info" | "warn" | "error", `[renderer] ${message} (${sourceId}:${line})`);
  });
  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    log("error", `did-fail-load code=${code} desc=${desc} url=${url}`);
  });
  win.webContents.on("did-finish-load", () => log("info", "renderer did-finish-load"));
  win.webContents.on("preload-error", (_event, preloadPath, error) => {
    log("error", `preload-error ${preloadPath}: ${error}`);
  });
  win.webContents.on("render-process-gone", (_e, details) => {
    log("error", "render-process-gone", details);
  });

  // Alt+Left navigates back (useful for in-app pages like /docs).
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.alt && input.key === "Left") {
      event.preventDefault();
      if (win.webContents.canGoBack()) {
        win.webContents.goBack();
      }
    }
  });

  // window.open() from the renderer: open external http(s) URLs in the system
  // browser instead of an in-app popup window (non-popup mode).
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // The API serves the renderer static files, so same-origin relative API
  // calls work. Never loadFile(): the renderer uses relative API paths.
  win.loadURL(rendererUrl)
    .then(() => log("info", `window loaded ${rendererUrl}`))
    .catch((err) => log("error", `loadURL failed: ${err}`));
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function fatal(err: unknown): void {
  const stack = err instanceof Error ? `${err.message}\n\n${err.stack}` : String(err);
  log("error", "fatal:", stack);
  try {
    dialog.showErrorBox("WordZoo 启动失败", `${stack}\n\n日志: ${logFile ?? "?"}`);
  } finally {
    app.quit();
  }
}

app.whenReady().then(async () => {
  initLogging();
  // 无 File/Edit 等默认菜单栏
  Menu.setApplicationMenu(null);

  ipcMain.handle("app:version", () => app.getVersion());

  // Renderer asks to open an external URL in the system default browser.
  // Only http(s) is allowed — arbitrary protocols would be a security hole.
  ipcMain.handle("app:open-external", (_event, rawUrl: unknown) => {
    if (typeof rawUrl !== "string") {
      return { ok: false };
    }
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return { ok: false };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false };
    }
    log("info", `open external: ${rawUrl}`);
    return { ok: shell.openExternal(parsed.toString()) };
  });

  const apiUrl = await startApiServer();
  await waitForApi(apiUrl);
  log("info", `api ready at ${apiUrl}`);
  createWindow(apiUrl);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(apiUrl);
    }
  });
}).catch(fatal);

const EDGE_TTS_ERROR_PATTERN = /Edge TTS WebSocket error/i;

const NETWORK_WARNING_COOLDOWN_MS = 60_000;
let lastNetworkWarningAt = 0;

/** Non-modal warning telling the user that TTS playback failed due to the network. */
function warnTtsUnavailable(err: unknown): void {
  const now = Date.now();
  if (now - lastNetworkWarningAt < NETWORK_WARNING_COOLDOWN_MS) return;
  lastNetworkWarningAt = now;
  dialog
    .showMessageBox({
      type: "warning",
      title: "朗读不可用",
      message: "网络连接异常，朗读功能暂时不可用",
      detail:
        "课程进度和学习数据不受影响。请检查网络连接后重试。\n\n" +
        (err instanceof Error && err.stack ? err.stack : String(err)),
      buttons: ["确定"],
      noLink: true,
    })
    .catch(() => {
      // ignore
    });
}

/** Runtime errors from the in-process API (e.g. Edge TTS network failures) must
 * not kill the app: log them. Only Edge TTS failures get a user-facing hint. */
function onRuntimeError(err: unknown): void {
  log("error", "runtime error:", err instanceof Error && err.stack ? err.stack : String(err));
  const message = err instanceof Error ? err.message : String(err);
  if (EDGE_TTS_ERROR_PATTERN.test(message)) warnTtsUnavailable(err);
}

process.on("unhandledRejection", onRuntimeError);
process.on("uncaughtException", onRuntimeError);
