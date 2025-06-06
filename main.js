let {app, BrowserWindow}=require("electron");
let path=require("path");
function createWindow(){
    let win=new BrowserWindow({
        width: 1000,
        height: 700,
        icon: path.join(__dirname, "favicon.ico"),
        webPreferences:{
            nodeIntegration: false
        }
    });
    win.loadURL("http://localhost:6001");
}
app.whenReady().then(createWindow);