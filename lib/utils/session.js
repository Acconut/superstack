var levelup = require("levelup"),
    path    = require("path"),
    fs      = require("fs"),
    crypto  = require("crypto"),
    cookie  = require("cookie"),
    mkdirp  = require("mkdirp").sync,
    Session = module.exports,
    
    /**
     * The LevelUP instance
     */
    db = null,
    
    /**
     * Cookie's name to store the session id
     */
    cookieName = null,
    
    /**
     * Where to store the used ids
     */
    idStorage = null,
    
    /**
     * The last number to generate an id
     */
    lastId = 0,
    
    /**
     * The algorithm used to generate the ids
     */
    algorithm = null,
    
    /**
     * A key used to make the ids more unique
     */
    key = null,
    
    /**
     * Optional options for the cookie
     */
    cookieOptions = null;

/**
 * Start the machines (leveldb)
 *
 * @param: Config object
 * @param: Callback
 */
Session.start = function(config, cb) {
    
    console.log("\n[SESSIONS]");
    
    // Store the algorithm & key & cookie's options
    algorithm = config.session.algorithm;
    key = config.session.key;
    cookieOptions = config.session.options || {};
    
    // Read or create the id storage
    idStorage = path.join(process.cwd(), config.session.idStorage);
    if(!fs.existsSync(idStorage)) {
        mkdirp(path.dirname(idStorage));
        fs.writeFileSync(idStorage, lastId);
    } else {
        lastId = parseInt(fs.readFileSync(idStorage).toString(), 10);
    }
    
    // Create the database
    levelup(path.join(process.cwd(), config.session.db), { valueEncoding: "json" },
        function(err, leveldb) {
            if(err) throw err;
            
            db = leveldb;
            console.log("Session database started.");
            cb();
    });
    
    // Store the cookie name
    cookieName = config.session.cookie;
};

/**
 * Shut leveldb down
 *
 * @param: Callback
 */
Session.stop = function(cb) {
    fs.writeFileSync(idStorage, lastId);
    db.close(cb);
};

/**
 * SessionList manages the keys and values
 *
 * @param: Session ID
 * @param: Object containing keys and values (optional)
 * @param: Session ID's cookie wasn't set (optional)
 */
function SessionList(sid, obj, cookieIsNotSet) {
    
    /**
     * Cache
     */
    this._cache = obj || {};
    
    /**
     * The Session ID
     */
    this.sid = sid;
    
    /**
     * Returns a key's value
     *
     * @param: Key
     * @return: Value
     */
    this.get = function(name) {
        return this._cache[name] || null;
    };
    
    /**
     * Sets the key's value
     * Don't forget to call SessionList.save!
     *
     * @param: Key
     * @param: Value
     */
    this.set = function(name, value) {
        this._cache[name] = value;
    };
    
    /**
     * Removes a key
     *
     * @param: Key
     */
    this.delete = this.del = function(name) {
        delete this._cache[name];
    };
    
    /**
     * Saves all the changes to leveldb
     *
     * @param: Callback (optional)
     */
    this.save = function(cb) {
        db.put(this.sid, this._cache, cb);
    };
    
    /**
     * Sets the cookie
     */
    this.setCookie = function(res) {
        
        if(!cookieIsNotSet) return;
        
        var oldHeader = res.getHeader("Set-Cookie") || [];
        oldHeader.push(cookie.serialize(cookieName, this.sid, cookieOptions));
        res.setHeader("Set-Cookie", oldHeader);
    };
}

/**
 * Creates a new SessionList using a request
 *
 * @param: HTTPRequest
 * @param: Callback (error, sessionlist)
 */
SessionList.fromRequest = function(req, cb) {
    
    var cookies = cookie.parse(req.headers["cookie"] || ""),
        sid;
    
    if(cookieName in cookies) {
        sid = cookies[cookieName];
    } else {
        sid = null;
    }
    
    SessionList.fromSID(sid, cb);
};

/**
 * Creates a new SeesionList using the Session ID
 *
 * @param: Session ID or null
 * @param: Callback (error, sessionlist)
 */
SessionList.fromSID = function(sid, cb) {
    
    var cookieIsNotSet = false;
    
    if(sid === null) {
        var hash = crypto.createHmac(algorithm, key);
        hash.update(new Buffer(lastId++));
        sid = hash.digest("hex");
        cookieIsNotSet = true;
    }
    
    db.get(sid, function(err, result) {
        if(err && err.name !== "NotFoundError") cb(err, null);
        cb(null, new SessionList(sid, result, cookieIsNotSet));
    });
    
};

Session.SessionList = SessionList;