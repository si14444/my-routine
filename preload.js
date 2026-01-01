const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (notification) => ipcRenderer.invoke('show-notification', notification)
});