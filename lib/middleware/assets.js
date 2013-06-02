var path = require("path"),
    fs = require("fs"),
    uglify = require("uglify-js"),
    
    rendered = null,
    length = 0,
    
    historyContent = "",
    pagesContent = "",
    methodsContent = "",
    
    dir = path.join(__dirname, "../assets/");
    historyPath = dir + "history.js",
    pagesPath = dir + "pages.js",
    methodsPath = dir + "methods.js";

var Assets = module.exports;

/**
 * Put the together and minify it using uglify
 */
function compileFiles() {
    
    process.stdout.write("Compiling assets...");
    
    
    rendered = uglify.minify(
        (historyContent = fs.readFileSync(historyPath).toString()) +
        (pagesContent = fs.readFileSync(pagesPath).toString()) +
        (methodsContent = fs.readFileSync(methodsPath).toString())
    , { fromString: true }).code;
    
    length = Buffer.byteLength(rendered);
    
    process.stdout.write(" done!\n");
    
}

/**
 * Start watchers for history.js and pages.js
 */
function startWatcher() {
    
    fs.watch(historyPath, compileFiles);
    fs.watch(pagesPath, compileFiles);
    fs.watch(methodsPath, compileFiles);
    
    console.log("Watchers for assets started.");
    
}

/**
 * Compiles files and starts watchers
 */
Assets.start = function() {
    
    console.log("\n[ASSETS]");
    
    compileFiles();
    
    startWatcher();
    
};

/**
 * Serves the rendered files to a client
 *
 * @param: Request
 * @param: Response
 */
Assets.handleRequest = function(req, res) {
    
    if(req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(501);
        res.end();
    }
    
    res.writeHead(200, {    
        "Content-Type": "text/javascript",
        "Content-Length": length
    });
    
    res.end((req.method === "GET") ? rendered : "");
    
};

/**
 * Returns the content of `./shared/history.js`
 */
Assets.getHistory = function() {
    return historyContent;
};

/**
 * Returns the content of `./shared/pages.js`
 * Used in compile.js
 */
Assets.getPages = function() {
    return pagesContent;
};