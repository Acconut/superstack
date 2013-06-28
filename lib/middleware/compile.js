var path = require("path"),
    fs = require("fs"),
    jsdom = require("jsdom").jsdom,
    cwd = process.cwd(),
    Compile = module.exports,
    
    indexFile = null,
    index = null,
    
    getRoutes = null,
    getTemplates = null,
    getMethods = null,
    callMethod = null,
    
    assetsUrl = "",
    templateUrl = "",
    routesUrl = "";


/**
 * Prefetch some files
 *
 * @param: Config object
 * @param: Accessors for routes, templates and pages.js
 */
Compile.start = function(config, accessors) {
    
    indexFile = path.join(cwd, path.join(config.static.dir, config.static.index));
    
    assetsUrl = config.static.assetsUrl;
    templateUrl = config.template.url;
    routesUrl = config.routes.url;
    
    getRoutes = accessors.getRoutes;
    getTemplates = accessors.getTemplates;
    getPages = accessors.getPages;
    getMethods = accessors.getMethods;
    callMethod = accessors.callMethod;
    
    index = fs.readFileSync(indexFile).toString();
    
};

/**
 * Renders the HTML and pushes it to the client
 *
 * @param: HTTPRequest
 * @param: HTTPResponse
 */
Compile.handleRequest = function(req, res) {
    
    if(req.method !== "GET") {
        res.writeHead(501);
        res.end();
        return;
    }
    
    var doc = jsdom("<!doctype html><html><body>dummy text</body></html>"),
        window = doc.createWindow();
    
    // We're on the server
    window.isServer = true;
    
    // Debugging using console.log
    window.console.log = function() {
        console.log.apply(console, arguments);
    };
    
    // Inject the assets
    window.eval(getTemplates());
    window.eval(getPages());
    window.eval(getRoutes());
    window.eval(getMethods());
    
    // Use special method call function for server
    var calls = [];
    window.Methods._call = function(name, data, cb) {
        calls.push(callMethod(name, data, cb, req.headers["cookie"] || ""));
    };
    
    // Add cookies
    window.document.cookie = req.headers["cookie"] || "";
    
    // ... and finally the content
    window.document.innerHTML = index;
    
    window.Pages._callRoute(req.url, {}, function() {
        
        // Thanks: http://stackoverflow.com/a/10162353
        var node = window.document.doctype,
        response = "<!DOCTYPE "
                 + node.name
                 + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
                 + (!node.publicId && node.systemId ? ' SYSTEM' : '') 
                 + (node.systemId ? ' "' + node.systemId + '"' : '')
                 + '>';
        
        window.document.body.innerHTML += 
                                '<script src="' + assetsUrl + '"></script>' +
                                '<script src="' + templateUrl + '"></script>' +
                                '<script src="' + routesUrl + '"></script>';
        
        response += window.document.innerHTML;
        
        res.statusCode = window.Pages._notFound ? 404 : 200;
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Length", Buffer.byteLength(response));
        
        // Add all the cookie headers
        for(var i = 0, l = calls.length; i < l; i++) {
            calls[i].setHeaders(res);
        }
        
        res.end(response);
        
        window.close();
        
    });

};