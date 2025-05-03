let fastify=require("fastify")({logger: false});
let PORT=6001;
fastify.register(require("@fastify/static"),{
    root: __dirname,
    prefix: "/",
    setHeaders: (res, filePath)=>{
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
    }
});
fastify.get("/", (request, reply)=>{
    return reply.sendFile("index.html");
});
fastify.listen({port: PORT, host: "::", keepAliveTimeout: 5000, connectionTimeout: 5000},(err)=>{
    if (err){
        console.error(err);
        process.exit(1);
    }
    console.log(`Server running at http://localhost:${PORT}`);
});