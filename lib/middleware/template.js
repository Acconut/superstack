var fs = require("fs"),
    path = require("path"),
    uglify = require("uglify-js"),
    
    cwd = process.cwd(),
    
    templates = {},
    rendered = "",
    length = 0,
    dir = null,
    compile = null;

var Template = module.exports;

/**
 * Compiles all files inside a directory
 */
function compileAllFiles() {
    
    var files = fs.readdirSync(dir);
    
    console.log("Found %s template files to compile.", files.length);
    
    files.forEach(function(file) {
        
        compileSingleFile(file);
        
    });
    
}

/**
 * Compiles a single file
 *
 * @param: File name inside dir
 */
function compileSingleFile(file) {
    
    process.stdout.write("Compiling " + file + "...");
    
    var name = path.basename(file);
    var ext = path.extname(name);
    name = path.basename(name, ext);
    
    try {
    
        templates[name] = compile(fs.readFileSync(path.join(dir, file)).toString());
        
    } catch(e) {
        console.log(" failed! %s (%s)", e.code, e.errno);
        return;
    }
    
    console.log(" done!");
}

/**
 * Puts all compiled functions into a js file
 */
function render() {
    
    // Reset
    rendered = "window.Templates={";
    
    for(var i in templates) {
        rendered += "\"" + i + "\":" + templates[i].toString() + ",";
    }
    
    if(rendered.charAt(rendered.length - 1) === ",") rendered = rendered.substr(0, rendered.length - 1);
    
    rendered += "};";
    
    rendered = uglify.minify(rendered, { fromString: true }).code;
    
    length = Buffer.byteLength(rendered);
    
}

/**
 * Starts the watcher for compiled files
 */
function startWatcher() {
    
    fs.watch(dir, function onChange(event, filename) {
        
        if(filename != null) {
            console.log("Templatefile %s changed.", filename);
            compileSingleFile(filename);
        } else {
            console.log("Some templatefile changed. Recompiling all...");
            compileAllFiles();
        }
        
        render();
        console.log("Recompilation finished.");
        
    });
    
    console.log("Watcher for templates started.");
    
}

/**
 * Precompiles all templates and start the watchers
 *
 * @param: Config object
 */
Template.start = function(config) {
    
    console.log("\n[TEMPLATES]");
    
    dir = path.join(cwd, config.template.dir);
    compile = require(path.join(cwd, config.template.compiler));
    
    compileAllFiles();
    render();
    startWatcher();
    
};

/**
 * Serves the rendered templates to a client
 *
 * @param: Request
 * @param: Response
 */
Template.handleRequest = function(req, res) {
    
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
 * Returns all templates
 */
Template.getTemplates = function() {
    return templates;
};

/**
 * Returns the rendered templates
 */
Template.getRendered = function() {
    return rendered;
};