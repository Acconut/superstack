var path = require("path"),
    fs = require("fs"),
    uglify = require("uglify-js"),
    
    rendered = null,
    length = 0,
    routesPath = null;

var Routes = module.exports;

/**
 * Minifies the routes
 */
function compileFile() {
    
    process.stdout.write("Compiling routes...");
    
    rendered = //uglify.minify(
        fs.readFileSync(routesPath).toString()
    //, { fromString: true }).code;
    
    length = Buffer.byteLength(rendered);
    
    process.stdout.write(" done!\n");
    
}

/**
 * Starts the watcher for routes
 */
function startWatcher() {
    
    fs.watch(routesPath, compileFile);
    
    console.log("Watcher for routes started.");
    
}

/**
 * Minify routes and start watcher
 */
Routes.start = function(config) {
    
    console.log("\n[ROUTES]");
    
    routesPath = path.join(process.cwd(), config.routes.router);
    
    compileFile();
    startWatcher();
    
};

/**
 * Serves the rendered routes to a client
 *
 * @param: Request
 * @param: Response
 */
Routes.handleRequest = function(req, res) {
    
    if(req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(501);
        res.end();
    }
    
    res.writeHead(200, {    
        "Content-Type": "text/javascript",
        "Content-Length": length
    });
    
    res.end((req.method === "GET") ? rendered : "");
    
};

/**
 * Returns the minified routes
 */
Routes.getRendered = function() {
    return rendered;
};