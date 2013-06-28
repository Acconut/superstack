var Methods = module.exports;

Methods.time = function(data, callback) {
    
    // No errors but the time in seconds!
    callback(null, Date.now());
};

Methods.simple = function(data, cb) {
    cb(null, {
        num: 42,
        str: "foo",
        bool: true
    });
};

Methods.length = function(data, cb) {
    cb(null, data.str.length);
};

Methods.setSession = function(data, cb, cookie, Session) {
    Session.set("session", data.value);
    Session.save(function() {
        cb(null, null);
    });
};

Methods.getSession = function(data, cb, cookie, Session) {
    cb(null, Session.get("session"));
};

Methods.deleteSession = function(data, cb, cookie, Session) {
    Session.del("session");
    Session.save(function() {
        cb(null, null);
    });
};

Methods.setCookie = function(data, cb, cookie) {
    cookie.set("foo", data.value);
    cb(null, null);
};

Methods.getCookie = function(data, cb, cookie) {
    cb(null, cookie.get("foo"));
};

Methods.deleteCookie = function(data, cb, cookie) {
    cookie.delete("foo");
    cb(null, null);
};