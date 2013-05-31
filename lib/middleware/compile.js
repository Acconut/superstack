var path = require("path"),
    fs = require("fs"),
    jsdom = require("jsdom"),
    cwd = process.cwd(),
    
    indexFile = null,
    index = null,
    
    getRoutes = null,
    getTemplates = null,
    
    assetsUrl = "",
    templateUrl = "",
    routesUrl = "";

var Compile = module.exports;

Compile.start = function(config, callback) {
    
    indexFile = path.join(cwd, config.index);
    
    assetsUrl = config.assetsUrl;
    templateUrl = config.templateUrl;
    routesUrl = config.routesUrl;
    
    getRoutes = config.getRoutes;
    getTemplates = config.getTemplates;
    getPages = config.getPages;
    
    index = fs.readFileSync(indexFile).toString();
    
};

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