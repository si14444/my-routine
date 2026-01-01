const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  showNotification: (notification) =>
    ipcRenderer.invoke("show-notification", notification),
  saveData: (data) => ipcRenderer.invoke("save-data", data),
  loadData: () => ipcRenderer.invoke("load-data"),
});
