var path = require("path"),
    fs = require("fs"),
    jsdom = require("jsdom"),
    cwd = process.cwd(),
    Compile = module.exports,
    
    indexFile = null,
    index = null,
    
    getRoutes = null,
    getTemplates = null,
    
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
    }
    
    jsdom.env({
        
        html: index,
        
        src: [
            "window.isServer = true;",
            getTemplates(),
            getPages(),
            getRoutes()
        ],
        
        document: {
            // Cookies
            cookie: req.headers["cookie"] || ""
        },
        
        done: function(err, window) {
            
            if(err) throw err;
            
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
                
                res.writeHead(
                    ((window.Pages._notFound) ? 404 : 200),
                    {
                        "Content-Type": "text/html",
                        "Content-Length": Buffer.byteLength(response)
                    }
                );
                
                res.end(response);
                
                window.close();
                
            });
            
        }
    });

};