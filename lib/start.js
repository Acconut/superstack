// Good console stuff
//require("consoleplusplus");
//console.disableTimestamp();

var path = require("path"),
    http = require("http"),
    cwd = process.cwd(),
    staticServer = require("node-static").Server,
    toobusy = require("toobusy"),
    
    // Middelwares
    template = require("./middleware/template.js"),
    local = require("./middleware/local.js"),
    assets = require("./middleware/assets.js"),
    routes = require("./middleware/routes.js"),
    methods = require("./middleware/methods.js"),
    compile = require("./middleware/compile.js");

// Configuration
var config = require(path.join(cwd, "./config.js"));

template.start(config.template);
local.start(config.locals, config.domain);
assets.start();
routes.start(config.routes.router);
methods.start(config.methods.dir, config.methods.url);
compile.start({
    index: path.join(config.static.directory, config.static.index),
    getPages: assets.getPages,
    getRoutes: routes.getRendered,
    getTemplates: template.getRendered,
    assetsUrl: config.static.assetsUrl,
    templateUrl: config.template.url,
    routesUrl: config.routes.url
});
    
// Static server
var staticPath = path.join(cwd, config.static.directory),
    static = new staticServer(staticPath);

// Start the server
var port = config.port,
    server = http.createServer(function(req, res) {
        
        console.log("[REQ] %s %s", req.method, req.url);
        
        if(toobusy()) {
            console.log("\u001b[31m" + "Process to busy!" + "\u001b[0m");
            res.writeHead(501);
            res.end("Server too busy! Don't try again.");
        }
        
        // Serve templates
        if(req.url === config.template.url) {
            return template.handleRequest(req, res);
        }
        
        // Serve locals
        if(req.url === config.locals.url) {
            return locals.handleRequest(req, res);
        }
        
        // Serve history.js and pages.js
        if(req.url === config.static.assetsUrl) {
            return assets.handleRequest(req, res);
        }
        
        // Serve routes
        if(req.url === config.routes.url) {
            return routes.handleRequest(req, res);
        }
        
        // Methods
        if(req.url.substr(0, config.methods.url.length) === config.methods.url) {
            return methods.handleRequest(req, res);
        }
        
        // Don't serve index file
        if(req.url === "/" || req.url.replace(/^\/*/g, "") === config.static.index) {
            compile.handleRequest(req, res);
        }
        
        // Server static file or index.html
        static.serve(req, res, function(err, result) {
            if(err) {
                if(err.status === 404) {
                    compile.handleRequest(req, res);
                } else {
                    console.error("Unexpected error occured:");
                    console.log(err);
                }
            }
        });
        
        
    });

server.listen(port, function() {
    console.log("\n[SERVER]");
    console.log("Serving static files from %s", staticPath);
    console.log("Server is listening on %s", port);
    console.log("Using following domain: %s\n", config.domain);
});

process.on("SIGINT", function() {
    server.close();
    toobusy.shutdown();
    process.exit();
});