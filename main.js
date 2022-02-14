// Modules
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  dialog,
} = require("electron");
const { runbot, changePause } = require("./runbot.js");
const os = require("os");
const loadConfigs = require("./loadConfigs.js");
const genratePermalinks = require("./permalinks.js");
const { getCollectionDetail } = require("./opensea.js");
const { convertBidTime } = require("./helper.js");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function progress(lastOffer, completedToken, totalToken) {
  mainWindow.webContents.executeJavaScript(`progress('${lastOffer}',
                                           '${completedToken}', '${totalToken}');`);
}

function changeCollection(img, name, totalToken) {
  mainWindow.webContents.executeJavaScript(
    `changeCollection('${img}', '${name}', '${totalToken}')`
  );
}

function showMessage(text) {
  mainWindow.webContents.executeJavaScript(`showMessage('${text}')`);
}

// Create a new BrowserWindow when `app` is ready
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // logger("started")
  // Load index.html into the new BrowserWindow
  mainWindow.loadFile("index.html");

  // Open DevTools - Remove for PRODUCTION!
  // mainWindow.webContents.openDevTools();

  // Listen for window being closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.setMenu(null);
  mainWindow.setTitle("nftwzrd");
  mainWindow.on("page-title-updated", function (e) {
    e.preventDefault();
  });
}

// Electron `app` is ready
app.on("ready", createWindow);

// Quit when all windows are closed - (Not macOS - Darwin)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

ipcMain.on("item:add", (e) => {
  runmain(logger);
});

ipcMain.on("pause", (e) => {
  changePause();
});

ipcMain.on("open-file-dialog-for-file", function (event) {
  if (os.platform() === "linux" || os.platform() === "win32") {
    dialog
      .showOpenDialog({
        properties: ["openFile"],
      })
      .then((result) => {
        files = result.filePaths;
        event.sender.send("selected-file", files[0]);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    dialog
      .showOpenDialog({
        properties: ["openFile", "openDirectory"],
      })
      .then((result) => {
        files = result.filePaths;
        event.sender.send("selected-file", files[0]);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

ipcMain.on(
  "runBot",
  async (
    e,
    collection_url,
    expiration,
    timeUnit,
    percentageChange,
    bidCap,
    bidtype
  ) => {
    timeUnit = timeUnit.toLowerCase();
    expiration = parseInt(expiration);
    expiration = convertBidTime(expiration, timeUnit);
    percentageChange = parseFloat(percentageChange);
    bidCap = parseFloat(bidCap);

    configs = await loadConfigs();
    if (!configs.status) {
      console.log("config message\n", configs);
      showMessage(configs.message);
      return 0;
    }

    // let permalinks = await genratePermalinks(
    //   filename,
    //   collectionUrl,
    //   tokenRange,
    //   arrangePermalinks
    // );
    let _first = permalinks[0].permalink;
    let [collectionName, collectionImg] = await getCollectionDetail(_first);
    changeCollection(collectionImg, collectionName, permalinks.length);

    runbot(
      configs.accountAddress,
      configs.mnemonic,
      paymentToken,
      permalinks,
      configs.apiKeys,
      bidCap,
      percentageChange,
      expiration,
      bidPrice,
      bidtype,
      configs.dbSleep,
      configs.auth,
      progress,
      showMessage
    );
  }
);
