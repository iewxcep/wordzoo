const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  getVersion: () => ipcRenderer.invoke("app:version"),
  openExternal: (url: string) => ipcRenderer.invoke("app:open-external", url),
});
