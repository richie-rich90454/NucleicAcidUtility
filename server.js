let fastify=require("fastify");
let serverOptions={
    logger:{
        level: "error",
        transport:{
            target: "pino-pretty"
        }
    },
    ignoreTrailingSlash: true,
    caseSensitive: false
};
let app=fastify(serverOptions);
let rateLimitPlugin=require("@fastify/rate-limit");
let rateLimitOptions={
    max: 50,
    timeWindow: "1 minute"
};
app.register(rateLimitPlugin, rateLimitOptions);
let staticPlugin=require("@fastify/static");
let staticOptions={
    root: __dirname,
    prefix: "/",
    list: false,
    setHeaders: function(res){
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
    }
};
app.register(staticPlugin, staticOptions);
function errorHandler(error, request, reply){
    app.log.error(error);
    let responsePayload={
        error: "Internal Server Error"
    };
    reply.status(500).send(responsePayload);
}
app.setErrorHandler(errorHandler);
function rootRouteHandler(request, reply){
    let filePath="index.html";
    reply.sendFile(filePath);
}
app.get("/", rootRouteHandler);
let listenOptions={
    port: 6001,
    host: "::",
    backlog: 256
};
function listenCallback(startupError){
    if (startupError){
        app.log.error(startupError);
        process.exit(1);
    }
    let serverAddress="http://localhost:6001";
    let startupMessage="Server running at " + serverAddress;
    console.log(startupMessage);
}
app.listen(listenOptions, listenCallback);