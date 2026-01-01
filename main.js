const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");

// 데이터 저장 경로 설정
const dataPath = path.join(app.getPath("userData"), "routine-data.json");

// 액세스 거부 오류 방지를 위한 설정
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("disable-dev-shm-usage");

ipcMain.handle("save-data", async (event, data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Save Data Error:", error);
    return false;
  }
});

ipcMain.handle("load-data", async () => {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, "utf8");
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error("Load Data Error:", error);
    return null;
  }
});

let mainWindow;
let tray = null;
let forceQuit = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600, // Slightly smaller default
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"), // Window Icon
  });

  mainWindow.loadFile("index.html");

  // Handle close event to minimize to tray
  mainWindow.on("close", (event) => {
    if (!forceQuit) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Routine",
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: "Quit",
      click: () => {
        forceQuit = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("My Routine App");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow.show();
  });
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

  // Click notification to open window
  notificationObj.on("click", () => {
    if (mainWindow) mainWindow.show();
  });

  return true;
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Do not quit here, let Tray handle it
    // app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
