let path=require("path");
let fastify=require("fastify")({logger: false});
let PORT=1331;
let publicDir=path.join(__dirname, "public");
fastify.register(require("@fastify/static"),{
    root: publicDir,
    prefix: "/",
    cacheControl: false,
    maxAge: 0,
    immutable: false
});
fastify.setNotFoundHandler((request, reply)=>{
    reply.code(404).type("text/plain").send("404 Not Found");
});
fastify.setErrorHandler((error, request, reply)=>{
    request.log.error(error);
    reply.code(500).type("text/plain").send(`Server error: ${error.message}`);
});
let start=async()=>{
    try{
        await fastify.listen({port: PORT, host: "::"});
        console.log(`Server running at http://localhost:${PORT}`);
    }
    catch (err){
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};
start();