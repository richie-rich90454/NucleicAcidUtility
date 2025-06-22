let electron=require("electron");
let path=require("path");
let fastify=require("fastify")({logger: false});
let staticPlugin=require("@fastify/static");
let application=electron.app;
let BrowserWindow=electron.BrowserWindow;
let nativeTheme=electron.nativeTheme;
let ipcMain=electron.ipcMain;
let Menu=electron.Menu;
let SERVER_PORT=6001;
let mainWindow=null;
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

        fastify.listen({ port: SERVER_PORT, host: "::" }, function(error){
            if (error){
                console.error("Fastify server error:", error);
                application.quit();
            }
            else{
                console.log("Server running at http://localhost:"+SERVER_PORT);
            }
        });
    }
    catch (error){
        console.error("Failed to start server:", error);
        application.quit();
    }
}
function createMainWindow(){
    try{
        mainWindow=new BrowserWindow({
            width: 1000,
            height: 700,
            icon: path.join(__dirname, "favicon.ico"),
            autoHideMenuBar: true,
            titleBarStyle: process.platform=="darwin"?"hidden":"default",
            vibrancy: process.platform=="darwin"?"under-window":undefined,
            webPreferences:{
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "preload.js")
            }
        });
        mainWindow.loadURL("http://localhost:"+SERVER_PORT);
        mainWindow.on("closed", function(){
            mainWindow=null;
        });
        nativeTheme.on("updated", function(){
            mainWindow.webContents.send("theme-updated", nativeTheme.shouldUseDarkColors?"dark":"light");
        });
    }
    catch (error){
        console.error("Failed to create window:", error);
        application.quit();
    }
}
function buildApplicationMenu(){
    let isMacOS=process.platform=="darwin";
    let menuTemplate=[];
    if (isMacOS){
        menuTemplate.push({
            label: application.name,
            submenu: [{role: "about" },{ type: "separator"},{role: "services"},{type: "separator"},{role: "hide"},{role: "hideOthers"},{role: "unhide"},{type: "separator"},{role: "quit"}]
        });
    }
    menuTemplate.push({
        label: "File",
        submenu: [isMacOS ?{role: "close" } :{ role: "quit"}]
    });
    menuTemplate.push({
        label: "Edit",
        submenu: [{role: "undo"},{role: "redo"},{type: "separator"},{role: "cut"},{role: "copy"},{role: "paste"},{role: "delete"},{type: "separator"},{role: "selectAll"}]
    });
    menuTemplate.push({
        label: "View",
        submenu: [{role: "reload"},{role: "toggleDevTools"},{type: "separator"},{role: "togglefullscreen"}
        ]
    });
    let applicationMenu=Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(applicationMenu);
}
application.whenReady().then(function(){
    application.name="Nucleic Acid Pairing and Protein Decoding";
    buildApplicationMenu();
    startServer();
    createMainWindow();
});
application.on("window-all-closed", function(){
    if (process.platform!=="darwin"){
        application.quit();
    }
});
application.on("activate", function(){
    if (BrowserWindow.getAllWindows().length==0){
        createMainWindow();
    }
});
application.on("before-quit", function(){
    if (mainWindow){
        mainWindow.removeAllListeners("closed");
        mainWindow.close();
    }
});
ipcMain.handle("get-theme", function(){
    return nativeTheme.shouldUseDarkColors?"dark":"light";
});