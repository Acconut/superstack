(function(window) {
    
    window.Methods = {};
    
    /**
     * Base url
     */
    Methods._url = "/_methods";
    
    /**
     * Register a new method for use
     *
     * @param: Method name
     */
    Methods._register = function(name) {
        
        Methods[name] = function(params, callback) {
            Methods._call(name, params, callback);
        };
        
    };
    
    /**
     * Calls a method
     *
     * @param: Method name
     * @param: Parameters
     * @param: Callback
     */
    Methods._call = function(name, params, callback) {
        
        // Generate url
        var url = location.origin + Methods._url + "/" + name;
        
        // Create new XHR object
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        
        // Turn params into string
        var p = "";
        for(var i in params) {
            if(params.hasOwnProperty(i)) {
                i = encodeURIComponent(i);
                params[i] = encodeURIComponent(params[i]);
                p += i + "=" + params[i] + "&";
            }
        }
        p = p.replace(/&$/, "");
        
        // Set headers
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        // Listener
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4) { // We're done
                try {
                    var res = JSON.parse(xhr.responseText);
                } catch(e) {
                    var res = { error: null, data: null };
                }
                
                if(xhr.statusCode !== 200) {
                    res.error = new Error(xhr.statusCode);
                }
                
                callback(res.error, res.data);
            }
        };
        
        // RELEASE THE KRAKEN!
        xhr.send(p);
        
    };
    
})(window);