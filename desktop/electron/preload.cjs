const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  selectFiles: () => ipcRenderer.invoke("dialog:select-files")
});
