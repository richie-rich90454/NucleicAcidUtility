let electron=require("electron");
let path=require("path");
let fs=require("fs");
let fastify=require("fastify")({logger:false});
let staticPlugin=require("@fastify/static");
let remoteMain=require("@electron/remote/main");
let {app,BrowserWindow,nativeTheme,Menu,ipcMain,shell}=electron;
let SERVER_PORT=6001;
let mainWindow=null;
let preloadPath=null;
let userDataPath=null;
function setupPaths(){
    userDataPath=app.getPath("userData");
    preloadPath=path.join(userDataPath,"preload.js");
}
function createPreloadScript(){
    let preloadContent='let {contextBridge,ipcRenderer}=require("electron");contextBridge.exposeInMainWorld("electronAPI",{minimizeWindow:function(){return ipcRenderer.invoke("minimize-window");},toggleMaximizeWindow:function(){return ipcRenderer.invoke("toggle-maximize-window");},closeWindow:function(){return ipcRenderer.invoke("close-window");},onMaximize:function(callback){return ipcRenderer.on("maximize",callback);},onUnmaximize:function(callback){return ipcRenderer.on("unmaximize",callback);}});';
    try{
        fs.writeFileSync(preloadPath,preloadContent);
    }
    catch(e){
        console.error("Failed to create preload script:",e);
    }
}
function saveWindowState(){
    if(!mainWindow)return;
    try{
        let bounds=mainWindow.getBounds();
        let state={x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,isMaximized:mainWindow.isMaximized()};
        let statePath=path.join(userDataPath,"window-state.json");
        fs.writeFileSync(statePath,JSON.stringify(state));
    }
    catch(e){
        console.error("Failed to save window state:",e);
    }
}
function loadWindowState(){
    let defaultState={width:1000,height:700};
    try{
        let statePath=path.join(userDataPath,"window-state.json");
        if(fs.existsSync(statePath)){
            let state=JSON.parse(fs.readFileSync(statePath));
            return{x:state.x,y:state.y,width:state.width||defaultState.width,height:state.height||defaultState.height,isMaximized:state.isMaximized};
        }
    }
    catch(e){
        console.error("Failed to load window state:",e);
    }
    return defaultState;
}
function startServer(){
    fastify.register(staticPlugin,{
        root:__dirname,
        prefix:"/",
        setHeaders:function(reply){
            reply.setHeader("Cache-Control","no-cache, no-store, must-revalidate");
            reply.setHeader("Pragma","no-cache");
            reply.setHeader("Expires","0");
        }
    });
    fastify.get("/",function(_,reply){
        return reply.sendFile("index.html");
    });
    return fastify.listen({port:SERVER_PORT,host:"127.0.0.1"})
        .then(function(){
            console.log("Server running at http://localhost:"+SERVER_PORT);
        })
        .catch(function(err){
            console.error("Fastify server error:",err);
            app.quit();
        });
}
function createMainWindow(){
    let state=loadWindowState();
    let isMac=process.platform=="darwin";
    mainWindow=new BrowserWindow({
        x:state.x,
        y:state.y,
        width:state.width,
        height:state.height,
        icon:path.join(__dirname,"favicon.ico"),
        autoHideMenuBar:true,
        frame:isMac,
        titleBarStyle:isMac?"hidden":"default",
        vibrancy:isMac?"under-window":undefined,
        show:false,
        webPreferences:{
            nodeIntegration:false,
            contextIsolation:true,
            preload:preloadPath,
            scrollBounce:true
        }
    });
    remoteMain.initialize();
    remoteMain.enable(mainWindow.webContents);
    ipcMain.handle("minimize-window",function(){
        mainWindow.minimize();
    });
    ipcMain.handle("toggle-maximize-window",function(){
        if(mainWindow.isMaximized()){
            mainWindow.unmaximize();
        }
        else{
            mainWindow.maximize();
        }
    });
    ipcMain.handle("close-window",function(){
        mainWindow.close();
    });
    mainWindow.on("maximize",function(){
        mainWindow.webContents.send("maximize");
    });
    mainWindow.on("unmaximize",function(){
        mainWindow.webContents.send("unmaximize");
    });
    mainWindow.loadURL("http://localhost:"+SERVER_PORT);
    mainWindow.webContents.on("did-finish-load",function(){
        mainWindow.webContents.insertCSS("::-webkit-scrollbar{display:none;} body{-ms-overflow-style:none;scrollbar-width:none;}")
            .catch(function(err){
                console.error("CSS injection error:",err);
            });
    });
    mainWindow.once("ready-to-show",function(){
        if(state.isMaximized)mainWindow.maximize();
        applyTheme();
        mainWindow.show();
    });
    mainWindow.on("move",function(){setTimeout(saveWindowState,100);});
    mainWindow.on("resize",function(){setTimeout(saveWindowState,100);});
    mainWindow.on("closed",function(){mainWindow=null;});
    nativeTheme.on("updated",applyTheme);
}
function applyTheme(){
    if(!mainWindow)return;
    let theme=nativeTheme.shouldUseDarkColors?"dark":"light";
    mainWindow.webContents.executeJavaScript('document.body.classList.remove("light","dark");document.body.classList.add("'+theme+'");')
        .catch(function(err){
            console.error("Failed to apply theme:",err);
        });
}
function buildApplicationMenu(){
    let isMac=process.platform=="darwin";
    let template=[];
    if(isMac){
        template.push({
            label:app.name,
            submenu:[
                {role:"about"},
                {type:"separator"},
                {role:"services"},
                {type:"separator"},
                {role:"hide"},
                {role:"hideOthers"},
                {role:"unhide"},
                {type:"separator"},
                {role:"quit"}
            ]
        });
    }
    template.push(
        {
            label:"File",
            submenu:[isMac?{role:"close"}:{role:"quit"}]
        },
        {
            label:"Edit",
            submenu:[
                {role:"undo"},{role:"redo"},{type:"separator"},
                {role:"cut"},{role:"copy"},{role:"paste"},{role:"delete"},{type:"separator"},
                {role:"selectAll"}
            ]
        },
        {
            label:"View",
            submenu:[
                {role:"reload"},{role:"toggleDevTools"},{type:"separator"},
                {role:"resetZoom"},{role:"zoomIn"},{role:"zoomOut"},{type:"separator"},
                {role:"togglefullscreen"}
            ]
        }
    );
    if(isMac){
        template.push({
            label:"Window",
            submenu:[
                {role:"minimize"},{role:"zoom"},{type:"separator"},
                {role:"front"}
            ]
        });
    }
    template.push({label:"Help",submenu:[{label:"Visit Richard's Blogs",click:function(){shell.openExternal("https://www.richardsblogs.com");}}]});
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
app.whenReady()
    .then(function(){
        setupPaths();
        createPreloadScript();
        app.name="Nucleic Acid Converter";
        buildApplicationMenu();
        return startServer();
    })
    .then(createMainWindow);
app.on("window-all-closed",function(){
    if(process.platform!="darwin"){
        app.quit();
    }
});
app.on("activate",function(){
    if(BrowserWindow.getAllWindows().length==0){
        createMainWindow();
    }
});
app.on("before-quit",function(){
    if(mainWindow){
        mainWindow.removeAllListeners("closed");
        mainWindow.close();
    }
    fastify.close().catch(function(err){
        console.error("Error shutting down server:",err);
    });
});