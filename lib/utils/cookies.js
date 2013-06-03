var Utils = module.exports,
    cookie = require("cookie");

function Cookie(name, value, options) {
    
    /**
     * The cookie's name ...
     */
    this._name = name;
    
    /**
     * ... and value ...
     */
    this._value = value || "";
    
    /**
     * ... and options
     */
    this._options = options || {};
    
    /**
     * Set the value
     *
     * @param: New value
     */
    this.set = function(value) {
        this._value = value;
    };
    
    /**
     * Deletes a cookie
     */
    this.delete = function() {
        this.set("");
        this._options.expires = new Date(811424262000);
    };
    
    /**
     * Return a string for the HTTP Set-Cookie header
     */
    this.toString = function() {
        return cookie.serialize(this._name, this._value, this._options);
    };
    
};

function CookieList(cookieStr) {
    
    /**
     * An object containing all cookies
     */
    this._cookies = {};
    
    /**
     * Same as above but these aren't modified
     */
    this._originalCookies = {};
    
    /**
     *
     */
    this.set = function(name, value, options) {
        if(!(name in this._cookies)) {
            this._cookies[name] = new Cookie(name, value, options);
        } else {
            this._cookies[name].set(value);
        }
    };
    
    /**
     *
     */
    this.get = function(name, returnObj) {
        var c = this._cookies[name];
        if(returnObj) return c;
        return c._value;
    };
    
    /**
     *
     */
    this.delete = function(name) {
        this._cookies[name].delete();
    };
    
    /**
     * 
     */
    this.setHeaders = function(res) {
        
        var l = this._cookies,
            ol = this._originalCookies,
            headers = [],
            c, o;
        for(var i in l) {
            c = l[i];
            o = ol[i];
            
            if(c._value !== o || c._options !== {}) headers.push(c.toString());
        }
        
        res.setHeader("Set-Cookie", headers);
        
    };
    
    // Parse string if given
    if(cookieStr && cookieStr.length && cookieStr.length > 0) {
        
        var parsed = cookie.parse(cookieStr);
        
        for(p in parsed) {
            this.set(p, parsed[p]);
            this._originalCookies[p] = parsed[p];
        }
        
    }
    
};

Utils.Cookie = Cookie;
Utils.CookieList = CookieList;

Utils.CookieList.fromRequest = function(req) {
    return new CookieList(req.headers.cookie);
};