(function(window) {
    
    /**
     * window.isServer is set to true if we're using jsdom
     */
    if(typeof window.isServer === "undefined") window.isServer = false;
    
    
    window.Route = function Route(path) {
        
        this._re = null;                 // RegExp to test urls
        this._params = [];               // Params to extract out of the url
        this._before = [];               // Functions to call before templateing
        this._after = [];                // Functions to call after templating
        this._template = "";             // Name of template to use
        this._target = document.body;    // Where to inject the template
        
        var re = /:(\w+)/g,
            result;
        
        while(result = re.exec(path)) {
            path = path.replace(result[0], "(\\w+)");
            this._params.push(result[1]);
        }
        
        this._re = new RegExp("^" + path + "$");
        
    };
    
    /**
     * Chainable API to set properties
     */
    Route.prototype.before = function(func) {
        this._before.push(func);
        return this;
    };
    
    Route.prototype.after = function(func) {
        this._after.push(func);
        return this;
    };
    
    Route.prototype.template = function(template) {
        this._template = template;
        return this;
    };
    
    Route.prototype.target = function(target) {
        this._target = target;
        return this;
    };
    
    /**
     * Test if the router matches a URL
     *
     * @param: URL to test
     * @return: false if not match esle all parsed parameters
     */
    Route.prototype._exec = function(url) {
      
      var re = this._re,
          names = this._params,
          i = 0,
          result = re.exec(url),
          params = {};
      
      if(!result) return false;
      
      result.shift();
      
      for(var i = 0, l = names.length; i < l; i += 1) {
          params[names[i]] = result[i] || null;
      }
      
      return params;
    };
    
    Route.prototype._call = function(data, callback) {
        
        var t = this._template,
            tg = this._target,
            a = this._after;
        
        callEach(this._before, [
            data,
            function(params) {
                
                Pages.render(t, params, tg);
                
                callEach(a);
                
                if(callback) callback();
            }
        ]);
        
    };
    
    /**
     * Pages
     */
    window.Pages = {};
    
    /**
     * All Route objects are stored here
     */
    Pages._routes = [];
    
    /**
     * Where to render templates default in
     */
    Pages._target = document.body;
    
    /**
     * Function to call if no route matches
     */
    Pages._else = function(url, notFound) { notFound() };
    
    /**
     * If route isn't found (404)
     * This is only used on serverside
     */
    Pages._notFound = false;
    
    /**
     * Create a new Router and add it
     *
     * @param: Path (similar to Route constructor)
     * @return: Route
     */
    Pages.add = function(path) {
        var r = new Route(path);
        this._routes.push(r);
        return r;
    };
    
    Pages.else = function(func) {
        this._else = func;
        return this;
    };
    
    Pages.go = function(url) {
        _History.pushState({}, "", url);
    };
    
    /**
     * Renders a template
     *
     * @param: Template name
     * @param: Params
     * @param: Target (if abset: document.body)
     */
    Pages.render = function(template, params, target) {
        
        var tg = target || this._target;
        if(!(template in window.Templates)) throw new Error("Template `" + template + "` not found!");
        tg.innerHTML = window.Templates[template](params);
        
    };
    
    /**
     * Calls a route
     *
     * @param: URL to go to
     * @param: Optional data
     */
    Pages._callRoute = function(path, data, callback) {
        for(var i = 0, a = this._routes, l = a.length, r, p; i < l; i += 1) {
            
            r = a[i];
            if(!(p = r._exec(path))) continue;
            
            return r._call(merge(data, p), callback);
            
        }
        
        this._else(path, function() {
            Pages._notFound = true;
        });
        
        if(callback) callback();
    };
    
    if(!isServer) {
        
        if(!window.History) {
            console.log("History.js is needed!");
            console.log("https://github.com/browserstate/history.js");
            throw new Error("Can't initalize Pages!");
        }
        var _History = window.History;
        
        
        /**
         * Bind to URL change, click events and load event
         */
        _History.Adapter.bind(window, "statechange", function() {
            var state = History.getState();
            
            Pages._callRoute(state.hash, state.data);
        
        });
        
        window.addEventListener("click", function(e) {
            if(e.button === 0) {
                // Loop through parent element wether they have data-page-link
                var el = e.target;
                while(el !== null) {
                    if(el.hasAttribute && el.hasAttribute("data-page-link")) {
                        e.preventDefault();
                        Pages.go(el.getAttribute("href"));
                        return false;
                    }
                    el = el.parentNode;
                }
            }
        });
        
        _History.Adapter.onDomLoad(function() {
            if(location.pathname.length > 0) Pages._callRoute(location.pathname, {});
        });
        
    }
    
    /**
     * Calls all functions
     *
     * @param: Array containing functions
     */
    var callEach = function(funcs, args) {
        args = args || [];
        for(var i = 0, l = funcs.length; i < l; i++) {
            funcs[i].apply(window, args);
        }
    };
    
    /**
     * Merges all property from young into old
     *
     * @param: Original object
     * @param: Properties to extend
     * @return: Extended object
     */
    var merge = function(old, young) {
        for(var i in young) {
            old[i] = young[i];
        }
        
        return old;
    };

})(window);