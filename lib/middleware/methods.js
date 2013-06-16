var fs = require("fs"),
    path = require("path"),
    qs = require("querystring"),
    CookieList = require("../utils/cookies.js").CookieList,
    SessionList = require("../utils/session.js").SessionList,
    
    /**
     * Where are the methods located
     */
    dir = "",
    
    /**
     * String with which all methods urls begin
     */
    url = "",
    
    /**
     * Object with all found methods
     */
    methods = {};

var Methods = module.exports;

function parseFiles() {
    
    // Reset methods
    methods = {};
    
    var exports;
    fs.readdirSync(dir).forEach(function(file) {
        
        var resolved = require.resolve(path.join(dir, file));
        
        // Clear cache
        if(resolved in require.cache) {
            delete require.cache[resolved];
        }
        
        exports = require(resolved);
        
        for(var i in exports) {
            // Only exports functions
            if(exports[i] instanceof Function) {
                methods[i] = exports[i];
            }
        }
        
    });
    
    console.log("Found %s methods.", Object.keys(methods).length);
    
}

function startWatcher() {
    
    fs.watch(dir, function(action, filename) {
        console.log("%s changed", filename);
        parseFiles();
    });
    
    console.log("Watcher for methods started.");
    
}

Methods.start = function(config) {
    
    console.log("\n[METHODS]");
    
    // Set directory
    dir = path.join(process.cwd(), config.methods.dir);
    
    // Set URL
    url = config.methods.url;
    
    // Do all the work
    parseFiles();
    startWatcher();
};

Methods.handleRequest = function(req, res) {
    
    // Only POST
    if(req.method !== "POST") {
        res.writeHead(501);
        res.end();
        return;
    }
    
    // Get method name (and remove slash at the beginning)
    var method = req.url.substr(url.length + 1);
    
    // Does the method exist
    if(!(method in methods)) {
        res.writeHead(404);
        res.end();
        return;
    }
    
    // Only Content-Type: application/x-www-form-urlencoded
    if(!("content-type" in req.headers) || req.headers["content-type"] !== "application/x-www-form-urlencoded") {
        res.writeHead(406);
        res.end();
        return;
    }
    
    // Params
    var params = {};
    
    // Calling
    var call = function() {
        
        var cookies = CookieList.fromRequest(req);
        SessionList.fromRequest(req, function(sesserr, sessions) {
            
            if(sesserr) {
                res.statusCode = 500;
                res.end();
                throw sesserr;
            }
            
            methods[method](params, function(err, resp) {
                
                res.statusCode = 200;
                
                // Set nessesary Set-Cookie headers
                cookies.setHeaders(res);
                sessions.setCookie(res);
                
                res.end(JSON.stringify({
                    error: err,
                    data: resp
                }));
            }, cookies, sessions);
            
        });
    }
    
    // If no content is available
    if(!("content-length" in req.headers) || req.headers["content-length"] == 0) {
        // Call method
        return call();
    }
    
    req.on("readable", function() {
        
        // Get params
        var read = req.read();
        if(read !== null) read.toString();
        params = qs.parse(read);
        
        // Call method
        call();
        
    });
    
};