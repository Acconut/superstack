var path = require("path"),
    fs = require("fs"),
    jsdom = require("jsdom").jsdom,
    cwd = process.cwd(),
    url = require("url"),
    Compile = module.exports,
    
    indexFile = null,
    index = null,
    
    port = 0,
    
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
    
    port = config.port;
    
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
    
    var doc = jsdom("<!doctype html><html><body>dummy text</body></html>", null, {
			url: "http://localhost:" + port + req.url,
            features: {
                FetchExternalResources: ["script"]
            }
		}),
        window = doc.createWindow(),
        u = url.parse(req.url, true);
    
    // We're on the server
    window.isServer = true;
    
    // Debugging using console.log
    window.console.log = function() {
        console.log.apply(console, arguments);
    };
    
    var isRedirecting = false,
        redirect = function(url, code) {
        // 302 Found / Moved Temporarily
        code = code || 302;
        isRedirecting = true;
        
        res.stautsCode = code;
        res.setHeader("Contet-Length", 0);
        res.setHeader("Location", url);
        });
            
        // Add all the cookie headers
        for(var i = 0, l = calls.length; i < l; i++) {
            calls[i].setHeaders(res);
        }
            
        res.end();
    };
    
    // Using window.location...
    window.location.assign = redirect;
    Object.defineProperty(window, "location", {
        set: redirect
    });
    
    // Inject the assets
    window.eval(getTemplates());
    window.eval(getPages());
    window.eval(getMethods());
    
    // ... or Pages.redirect
    window.Pages.redirect = redirect;
    
    // Use special method call function for server
    var calls = [];
    window.Methods.call = function(name, data, cb) {
        calls.push(callMethod(name, data, cb, req.headers["cookie"] || ""));
    };
    
    // Add cookies
    window.document.cookie = req.headers["cookie"] || "";
    
    // ... and finally the content
    window.document.innerHTML = index;
	
	// Respond to the request
    var callRoute = function() {
        window.eval(getRoutes());
        
        if(isRedirecting) {
            window.close();
            return;
        }
		window.Pages._callRoute(u.pathname, u.query, function() {
			
            // Get to doctype
            var response = window.document._doctype._fullDT;

			response += window.document.innerHTML;
			
            response = response.replace(/<\/body>/i,
                                    '<script src="' + assetsUrl + '"></script>' +
                                    '<script src="' + templateUrl + '"></script>' +
                                    '<script src="' + routesUrl + '"></script>' +
                                    '</body>');
			
            
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
	
	// Wait until all scripts are loaded
	var scripts = window.document.getElementsByTagName("script"),
		scriptsCount = 0,
		scriptComplete = function(e) {
			if(e.type === "error") {
				throw new URIError("Error while loading script");
			}
			
			scriptsCount--;
			if(scriptsCount === 0) callRoute();
			
		};
	
	for(var i = 0, l = scripts.length, s; i < l; i++) {
		s = scripts[i];
        if(s.src && !s.async && s.getAttribute("async") === null) {
			scriptsCount++;
			s.addEventListener("load", scriptComplete);
			s.addEventListener("error", scriptComplete);
		}
	}
	
	if(scriptsCount === 0) {
		// There are no script for which we need to wait until they load
		callRoute();
	}
		

};