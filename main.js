const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");

// 액세스 거부 오류 방지를 위한 설정
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("disable-dev-shm-usage");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile("index.html");
}

ipcMain.handle("show-notification", (event, notification) => {
  if (!Notification.isSupported()) {
    console.log("Notifications are not supported");
    return false;
  }

  const notificationObj = new Notification({
    title: notification.title,
    body: notification.body,
    icon: path.join(__dirname, "icon.png"),
    silent: false,
  });

  notificationObj.show();
  return true;
});

app.whenReady().then(() => {
  if (!Notification.isSupported()) {
    console.log("Notifications are not supported on this system");
  }

  // 강제로 userData 경로 설정 - 제거됨 (시스템 기본값 사용)
  // const userDataPath = path.join(app.getPath('documents'), 'my-routine-data');
  // app.setPath('userData', userDataPath);
  // app.setPath('cache', path.join(userDataPath, 'cache'));
  // app.setPath('temp', path.join(userDataPath, 'temp'));

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
