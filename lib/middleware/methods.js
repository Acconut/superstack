var fs = require("fs"),
    path = require("path"),
    qs = require("querystring"),
    
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
    
    var exports;
    fs.readdirSync(dir).forEach(function(file) {
        
        exports = require(path.join(dir, file));
        
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

Methods.start = function(methodsDir, methodsUrl) {
    
    console.log("\n[METHODS]");
    
    // Set directory
    dir = path.join(process.cwd(), methodsDir);
    
    // Set URL
    url = methodsUrl;
    
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
    
    // If no content is available
    if(!("content-length" in req.headers) || req.headers["content-length"] == 0) {
        // Call method
        methods[method]({}, function(err, resp) {
            
            res.writeHead(200);
            res.end(JSON.stringify({
                error: err,
                data: resp
            }));
        });
        
        return;
    }
    
    req.on("readable", function() {
        
        // Get params
        var params = qs.parse(req.read().toString());
        
        // Call method
        methods[method](params, function(err, resp) {
            
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify({
                error: err,
                data: resp
            }));
        });
        
    });
    
};