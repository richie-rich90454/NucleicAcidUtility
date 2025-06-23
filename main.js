let electron=require("electron");
let path=require("path");
let fastify=require("fastify")({logger: false});
let staticPlugin=require("@fastify/static");
let fs=require("fs");
let remoteMain=require("@electron/remote/main");
let application=electron.app;
let BrowserWindow=electron.BrowserWindow;
let nativeTheme=electron.nativeTheme;
let Menu=electron.Menu;
let ipcMain=electron.ipcMain;
let SERVER_PORT=6001;
let mainWindow=null;
let serverInstance=null;
let preloadScript=`let {contextBridge, ipcRenderer}=require("electron");contextBridge.exposeInMainWorld("electronAPI",{minimizeWindow: function(){return ipcRenderer.invoke("minimize-window")},toggleMaximizeWindow: function(){return ipcRenderer.invoke("toggle-maximize-window")},closeWindow: function(){return ipcRenderer.invoke("close-window")},onMaximize: function(callback){return ipcRenderer.on("maximize", callback)},onUnmaximize: function(callback){return ipcRenderer.on("unmaximize", callback)}});`;
function saveWindowState(){
    try{
        if(mainWindow){
            let windowBounds=mainWindow.getBounds();
            let state={
                x: windowBounds.x,
                y: windowBounds.y,
                width: windowBounds.width,
                height: windowBounds.height,
                isMaximized: mainWindow.isMaximized()
            };
            fs.writeFileSync(path.join(__dirname, "window-state.json"), JSON.stringify(state));
        }
    }
    catch(error){
        console.error("Failed to save window state:", error);
    }
}
function loadWindowState(){
    try{
        let statePath=path.join(__dirname, "window-state.json");
        if(fs.existsSync(statePath)){
            let state=JSON.parse(fs.readFileSync(statePath));
            return{
                x: state.x,
                y: state.y,
                width: state.width||1000,
                height: state.height||700,
                isMaximized: state.isMaximized
            };
        }
    }
    catch(error){
        console.error("Failed to load window state:", error);
    }
    return {width: 1000, height: 700};
}
function startServer(){
    try{
        fastify.register(staticPlugin,{
            root: __dirname,
            prefix: "/",
            setHeaders: function(response){
                response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                response.setHeader("Pragma", "no-cache");
                response.setHeader("Expires", "0");
            }
        });
        fastify.get("/", function(request, reply){
            return reply.sendFile("index.html");
        });
        fastify.listen({port: SERVER_PORT, host: "::"}, function(error){
            if(error){
                console.error("Fastify server error:", error);
                application.quit();
            }
            else{
                console.log("Server running at http://localhost:"+SERVER_PORT);
            }
        });
        serverInstance=fastify;
    }
    catch(error){
        console.error("Failed to start server:", error);
        application.quit();
    }
}
function createMainWindow(){
    try{
        let windowState=loadWindowState();
        mainWindow=new BrowserWindow({
            x: windowState.x,
            y: windowState.y,
            width: windowState.width,
            height: windowState.height,
            icon: path.join(__dirname, "favicon.ico"),
            autoHideMenuBar: true,
            frame: process.platform=="darwin"?true:false,
            titleBarStyle: process.platform=="darwin"?"hidden":"default",
            vibrancy: process.platform=="darwin"?"under-window":undefined,
            show: false,
            webPreferences:{
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "preload.js"),
                scrollBounce: true
            }
        });
        fs.writeFileSync(path.join(__dirname, "preload.js"), preloadScript);
        remoteMain.initialize();
        remoteMain.enable(mainWindow.webContents);
        ipcMain.handle("minimize-window", function(){
            if(mainWindow){
                mainWindow.minimize();
            }
        });
        ipcMain.handle("toggle-maximize-window", function(){
            if(mainWindow){
                if(mainWindow.isMaximized()){
                    mainWindow.unmaximize();
                }
                else{
                    mainWindow.maximize();
                }
            }
        });
        ipcMain.handle("close-window", function(){
            if(mainWindow){
                mainWindow.close();
            }
        });
        mainWindow.on("maximize", function(){
            mainWindow.webContents.send("maximize");
        });
        mainWindow.on("unmaximize", function(){
            mainWindow.webContents.send("unmaximize");
        });
        mainWindow.loadURL("http://localhost:"+SERVER_PORT);
        mainWindow.webContents.on("did-finish-load", function(){
            mainWindow.webContents.insertCSS(`
                ::-webkit-scrollbar{
                    display: none;
                }
                body{
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `).catch(function(err){
                console.log("CSS injection error:", err);
            });
        });
        mainWindow.once("ready-to-show", function(){
            mainWindow.show();
            if(windowState.isMaximized){
                mainWindow.maximize();
            }
            applyTheme();
        });
        mainWindow.on("closed", function(){
            mainWindow=null;
        });
        mainWindow.on("resize", function(){
            setTimeout(saveWindowState, 100);
        });
        mainWindow.on("move", function(){
            setTimeout(saveWindowState, 100);
        });
        nativeTheme.on("updated", applyTheme);
    }
    catch(error){
        console.error("Failed to create window:", error);
        application.quit();
    }
}
function applyTheme(){
    if(mainWindow){
        let theme=nativeTheme.shouldUseDarkColors?"dark":"light";
        mainWindow.webContents.executeJavaScript(`
            document.body.classList.remove("light", "dark");
            document.body.classList.add("${theme}");
        `).catch(function(error){
            console.error("Failed to apply theme:", error);
        });
    }
}
function buildApplicationMenu(){
    let isMacOS=process.platform=="darwin";
    let menuTemplate=[];
    if(isMacOS){
        menuTemplate.push({
            label: application.name,
            submenu: [{role: "about"},{type: "separator"},{role: "services"},{type: "separator"},{role: "hide"},{role: "hideOthers"},{role: "unhide"},{type: "separator"},{role: "quit"}]
        });
    }
    menuTemplate.push({
        label: "File",
        submenu: [isMacOS?{role: "close"}:{role: "quit"}]
    });
    menuTemplate.push({
        label: "Edit",
        submenu: [{role: "undo"},{role: "redo"},{type: "separator"},{role: "cut"},{role: "copy"},{role: "paste"},{role: "delete"},{type: "separator"},{role: "selectAll"}]
    });
    menuTemplate.push({
        label: "View",
        submenu: [{role: "reload"},{role: "toggleDevTools"},{type: "separator"},{role: "resetZoom"},{role: "zoomIn"},{role: "zoomOut"},{type: "separator"},{role: "togglefullscreen"}]
    });
    if(isMacOS){
        menuTemplate.push({
            label: "Window",
            submenu: [{role: "minimize"},{role: "zoom"},{type: "separator"},{role: "front"}]
        });
    }
    menuTemplate.push({
        label: "Help",
        submenu: [{
            label: "Visit Richard's Blogs",
            click: function(){
                electron.shell.openExternal("https://www.richardsblogs.com");
            }
        }]
    });
    let applicationMenu=Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(applicationMenu);
}
application.whenReady().then(function(){
    application.name="Nucleic Acid Converter";
    buildApplicationMenu();
    startServer();
    createMainWindow();
});
application.on("window-all-closed", function(){
    if(process.platform!=="darwin"){
        application.quit();
    }
});
application.on("activate", function(){
    if(BrowserWindow.getAllWindows().length==0){
        createMainWindow();
    }
});
application.on("before-quit", function(){
    if(serverInstance){
        serverInstance.close();
    }
    if(mainWindow){
        mainWindow.removeAllListeners("closed");
        mainWindow.close();
    }
});