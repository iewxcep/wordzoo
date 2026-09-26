"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main.ts
var import_node_http = __toESM(require("node:http"));
var import_node_fs = __toESM(require("node:fs"));
var import_node_net = __toESM(require("node:net"));
var import_node_path = __toESM(require("node:path"));
var import_electron = require("electron");
var logFile;
function log(level, ...args) {
  const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] [${level}] ${args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" ")}
`;
  try {
    if (logFile) import_node_fs.default.appendFileSync(logFile, line);
  } catch {
  }
  if (level === "error") process.stderr.write(line);
  else process.stdout.write(line);
}
function initLogging() {
  const logsDir = import_node_path.default.join(import_electron.app.getPath("userData"), "logs");
  import_node_fs.default.mkdirSync(logsDir, { recursive: true });
  logFile = import_node_path.default.join(logsDir, "main.log");
  log("info", `app v${import_electron.app.getVersion()} packaged=${import_electron.app.isPackaged} userData=${import_electron.app.getPath("userData")}`);
}
function getResources() {
  if (import_electron.app.isPackaged) {
    const res = process.resourcesPath;
    return {
      apiBundle: import_node_path.default.join(res, "api.cjs"),
      migrationsDir: import_node_path.default.join(res, "migrations"),
      coursesDataDir: import_node_path.default.join(res, "courses-data"),
      rendererDir: import_node_path.default.join(res, "renderer")
    };
  }
  const projectRoot = import_node_path.default.resolve(__dirname, "..");
  const resources = import_node_path.default.join(projectRoot, "resources");
  return {
    apiBundle: import_node_path.default.join(resources, "api.cjs"),
    migrationsDir: import_node_path.default.join(resources, "migrations"),
    coursesDataDir: import_node_path.default.join(resources, "courses-data"),
    rendererDir: import_node_path.default.join(resources, "renderer")
  };
}
function findFreePort(preferred) {
  const { promise, resolve, reject } = Promise.withResolvers();
  const probe = (port, attemptsLeft) => {
    const server = import_node_net.default.createServer();
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
async function startApiServer() {
  const port = await findFreePort(Number(process.env.PORT || 3001));
  const resources = getResources();
  const dbPath = process.env.SQLITE_DB_PATH || import_node_path.default.join(import_electron.app.getPath("userData"), "earthworm.db");
  import_node_fs.default.mkdirSync(import_node_path.default.dirname(dbPath), { recursive: true });
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
function delay(ms) {
  const { promise, resolve } = Promise.withResolvers();
  setTimeout(resolve, ms);
  return promise;
}
function requestOk(url) {
  const { promise, resolve } = Promise.withResolvers();
  const req = import_node_http.default.get(url, (res) => {
    res.resume();
    resolve(res.statusCode === 200);
  });
  req.on("error", () => resolve(false));
  req.setTimeout(2e3, () => {
    req.destroy();
    resolve(false);
  });
  return promise;
}
var MAX_API_ATTEMPTS = 240;
async function waitForApi(apiUrl) {
  const healthUrl = new URL("/course-pack", apiUrl).toString();
  for (let attempt = 0; attempt < MAX_API_ATTEMPTS; attempt++) {
    if (await requestOk(healthUrl)) {
      return;
    }
    await delay(500);
  }
  throw new Error(`API did not become ready at ${healthUrl}`);
}
function createWindow(rendererUrl) {
  const win = new import_electron.BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: import_node_path.default.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const levelName = level === 3 ? "error" : level === 2 ? "warn" : "info";
    log(levelName, `[renderer] ${message} (${sourceId}:${line})`);
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
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.alt && input.key === "Left") {
      event.preventDefault();
      if (win.webContents.canGoBack()) {
        win.webContents.goBack();
      }
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void import_electron.shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
  win.loadURL(rendererUrl).then(() => log("info", `window loaded ${rendererUrl}`)).catch((err) => log("error", `loadURL failed: ${err}`));
}
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
function fatal(err) {
  const stack = err instanceof Error ? `${err.message}

${err.stack}` : String(err);
  log("error", "fatal:", stack);
  try {
    import_electron.dialog.showErrorBox("ELearn \u542F\u52A8\u5931\u8D25", `${stack}

\u65E5\u5FD7: ${logFile ?? "?"}`);
  } finally {
    import_electron.app.quit();
  }
}
import_electron.app.whenReady().then(async () => {
  initLogging();
  import_electron.Menu.setApplicationMenu(null);
  import_electron.ipcMain.handle("app:version", () => import_electron.app.getVersion());
  import_electron.ipcMain.handle("app:open-external", (_event, rawUrl) => {
    if (typeof rawUrl !== "string") {
      return { ok: false };
    }
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return { ok: false };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false };
    }
    log("info", `open external: ${rawUrl}`);
    return { ok: import_electron.shell.openExternal(parsed.toString()) };
  });
  const apiUrl = await startApiServer();
  await waitForApi(apiUrl);
  log("info", `api ready at ${apiUrl}`);
  createWindow(apiUrl);
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow(apiUrl);
    }
  });
}).catch(fatal);
process.on("unhandledRejection", fatal);
process.on("uncaughtException", fatal);
