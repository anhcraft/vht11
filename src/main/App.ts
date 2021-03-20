import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as url from "url";
import __basedir from '../basepath';

let mainWindow: Electron.BrowserWindow;

if (require('electron-squirrel-startup')) {
    app.quit();
}

function createWindow() {
    mainWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.maximize();

    mainWindow.show();

    setTimeout(function (){
        mainWindow.setResizable(false);
        mainWindow.loadURL(url.format({
            pathname: path.join(__basedir, "./resources/app/src/renderer/dist/index.html"),
            protocol: "file:",
            slashes: true,
        })).then(r => {});
    }, 1500);

    mainWindow.on("closed", () => {
        mainWindow = null as any;
    });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});
