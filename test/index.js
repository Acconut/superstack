var Tests = module.exports,
    
    fork = require("child_process").fork,
    path = require("path"),
    request = require("request"),
    qs = require("querystring"),
    config = require("./app/config.js"),
    base = "http://localhost:" + config.port + "/",
    child;
    
Tests["Start"] = function(test) {
    
    child = fork(path.join(__filename, "../../lib/start.js"), [], {
        cwd: "./test/app/",
        // Set to false to see superstack's output
        silent: false
    });
    
    console.log("Test app should listen on %s", config.port);
    
    child.on("message", function(msg) {
        if(msg === "READY") {
            test.ok(true, "Setup finished");
            test.done();
        }
    });
    child.on("error", function(err) {
        throw err;
    });
};

Tests["Responses"] = {
    "Home": function(test) {
        request({
            url: base
        }, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            test.ok(body.indexOf("this is the home site.") !== -1, "Home site properly built");
            test.done();
        });
    },
    
    "Not found": function(test) {
        request({
            url: base + "iamsocoolbutthiswontwork"
        }, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 404, "Status code is Not found");
            test.ok(body.indexOf("sorry") !== -1, "Error site properly built");
            test.ok(body.indexOf("iamsocoolbutthiswontwork") !== -1, "Rendering parameter");
            test.done();
        });
    },
    
    "Static": function(test) {
        request({
            url: base + "info.txt"
        }, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            test.equal(body, "this is an info", "Content is right");
            test.done();
        });
    }
};

Tests["Methods"] = {
    "Simple": function(test) {
        callMethod("simple", {}, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            test.equal(body, '{"error":null,"data":{"num":42,"str":"foo","bool":true}}', "Body properly built");
            test.done();
            
        });
    },
    
    "Data": function(test) {
        callMethod("length", { str: "hello" }, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            test.equal(JSON.parse(body).data, "hello".length, "Length is right");
            test.done();
        });
    },
    
    "Not found": function(test) {
        callMethod("stillcool", {}, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 404, "Status code is 404");
            test.done();
        });
    }
};

var sessionCookie = "";
Tests["Session"] = {
    "Set": function(test) {
        callMethod("setSession", { value: "bar" }, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            test.equal(body, '{"error":null,"data":null}', "Body properly built");
            sessionCookie = res.headers["set-cookie"][0];
            test.ok(/^_session/.test(sessionCookie), "Session ID set");
            test.done();
        });
    },
    
    "Get": function(test) {
        callMethod("getSession", {}, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            test.equal(body, '{"error":null,"data":"bar"}', "Session value is right");
            test.done();
        });
    },
    
    "Delete": function(test) {
        callMethod("deleteSession", {}, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            callMethod("getSession", {}, function(err, res, body) {
                test.ifError(err);
                test.equal(res.statusCode, 200, "Status code is OK");
                test.equal(body, '{"error":null,"data":null}', "Session value is deleted");
                test.done();
            });
        });
    }
};

Tests["Cookie"] = {
    "Set": function(test) {
        callMethod("setCookie", { value: "bar" }, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            test.ok(res.headers["set-cookie"].indexOf("foo=bar") !== -1, "Cookie is set");
            test.done();
        });
    },
    
    "Get": function(test) {
        callMethod("getCookie", {}, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            test.equal(body, '{"error":null,"data":"bar"}', "Cookie is right");
            test.done();
        });
    },
    
    "Delete": function(test) {
        callMethod("deleteCookie", {}, function(err, res, body) {
            test.ifError(err);
            test.equal(res.statusCode, 200, "Status code is OK");
            callMethod("getCookie", {}, function(err, res, body) {
            test.ifError(err);
                test.equal(res.statusCode, 200, "Status code is OK");
                test.equal(body, '{"error":null,"data":null}', "Cookie is deleted");
                test.done();
            });
        });
    }
};

Tests["Stop"] = function(test) {
    child.on("close", function(code, signal) {
        test.ok(signal === "SIGINT", "Process exited after SIGINT");
        test.done();
    });
    child.kill("SIGINT");
};

/**
 * Call a method
 *
 * @param: Method name
 * @param: Data
 * @param: Callback like request does
 */
function callMethod(name, data, cb, cookie) {
    var body = qs.stringify(data || {});
    request.post({
        url: base + "_methods/" + name,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(body),
            "Cookie": cookie || ""
        },
        body: body
    }, cb);
}