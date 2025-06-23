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
    timeWindow: "1 minute",
    errorResponseBuilder: function(request, context){
        return{
            statusCode: 302,
            headers:{
                "Location": "/rate-limit-exceeded",
                "Cache-Control": "no-store"
            }
        };
    },
    skip: function(request, reply){
        return request.url=="/rate-limit-exceeded";
    },
    addHeaders:{
        'x-ratelimit-limit': false,
        'x-ratelimit-remaining': false,
        'x-ratelimit-reset': false,
        'retry-after': false
    },
    onExceeding: function(request){
        app.log.info("Rate limit nearly exceeded for "+request.ip);
    },
    onExceeded: function(request){
        app.log.warn("Rate limit exceeded for "+request.ip);
    }
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
function rateLimitScreenHandler(request, reply){
    reply.header("Content-Type", "text/html");
    reply.header("Cache-Control", "no-store, max-age=0");
    reply.sendFile("rate_limit.html");
}
app.get("/rate-limit-exceeded", rateLimitScreenHandler);
function errorHandler(error, request, reply){
    if (error.statusCode==429){
        reply.redirect("/rate-limit-exceeded");
    } 
    else if (error.statusCode!==302){
        app.log.error(error);
        let responsePayload={
            error: "Internal Server Error"
        };
        reply.status(500).send(responsePayload);
    }
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
    let startupMessage="Server running at "+serverAddress;
    console.log(startupMessage);
}
app.listen(listenOptions, listenCallback);