let {app, BrowserWindow}=require("electron");
let path=require("path");
let fastify=require("fastify")({logger: false});
let staticPlugin=require("@fastify/static");
let PORT=6001;
function startServer(){
    fastify.register(staticPlugin,{
        root: __dirname,
        prefix: "/",
        setHeaders: (res)=>{
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
        }
    });
    fastify.get("/", (request, reply)=>{
        return reply.sendFile("index.html");
    });
    fastify.listen({ port: PORT, host: "::" }, (err)=>{
        if (err){
            console.error("Fastify server error:", err);
        }
        else{
            console.log(`Server running at http://localhost:${PORT}`);
        }
    });
}
function createWindow(){
    let win=new BrowserWindow({
        width: 1000,
        height: 700,
        icon: path.join(__dirname, "favicon.ico"),
        webPreferences:{
            nodeIntegration: false
        }
    });
    win.loadURL(`http://localhost:${PORT}`);
}
app.whenReady().then(()=>{
    startServer();
    createWindow();
});
app.on("window-all-closed", ()=>{
    if (process.platform!=="darwin"){
        app.quit();
    }
});
app.on("activate", ()=>{
    if (BrowserWindow.getAllWindows().length==0){
        createWindow();
    }
});