let fastify=require("fastify")({ 
    logger: false,
    ignoreTrailingSlash: true,
    caseSensitive: false
});
let PORT=6001;
fastify.register(require("@fastify/static"),{
    root: __dirname,
    prefix: "/",
    setHeaders: (res)=>{
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
    }
});
fastify.get("/", (_, reply)=>{
    reply.sendFile("index.html");
});
fastify.listen({
    port: PORT,
    host: "::",
    backlog: 1024,
    bodyLimit: 4096,
    keepAliveTimeout: 5000,
    connectionTimeout: 5000
}, (err)=>{
    if (err){
        console.error(err);
        process.exit(1);
    }
    console.log(`Server running at http://localhost:${PORT}`);
});