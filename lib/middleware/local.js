var fs = require("fs"),
    path = require("path"),
    uglify = require("uglify-js"),
    
    cwd = process.cwd(),
    
    rendered = "",
    dir = null,
    domain = null;

var Local = module.exports;

/**
 * Compiles all files inside a directory
 *
 * @param: Directory
 */
function compileAllFiles() {
    
    var files = fs.readdirSync(dir);
    
    console.log("\nFound %s locals files to usee.", files.length);
    
    files.forEach(function(file) {
        
        compileSingleFile(file);
        
    });
    
}

function compileSingleFile(file) {
    
    process.stdout.write("Compiling " + file + "...");
    
    var name = path.basename(file);
    var ext = path.extname(name);
    name = path.basename(name, ext);
    
    templates[name] = compile(fs.readFileSync(path.join(dir, file)).toString());
    
    process.stdout.write(" done!\n");
}

function render() {
    
    // Reset
    rendered = "window.Templates={";
    
    for(var i in templates) {
        rendered += "\"" + i + "\":" + templates[i].toString() + ",";
    }
    
    if(rendered.charAt(rendered.length - 1) === ",") rendered = rendered.substr(0, rendered.length - 1);
    
    rendered += "};";
    
    rendered = uglify.minify(rendered, { fromString: true }).code;
    
}

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
    
    console.log("\nWatcher started.");
    
}

function redirect(req, url) {
    
    req.writeHead();
    
}

/**
 * Precompiles all templates and start the watchers
 */
Local.start = function(config, domain) {
    
    /*domain = domain;
    dir = path.join(cwd, config.directory);
    
    compileAllFiles();
    render();
    startWatcher();*/
    
};

/**
 * Serves the rendered templates to a client
 *
 * @param: Request
 * @param: Response
 */
Local.handleRequest = function(req, res) {
    
    if(req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(501);
        res.end();
    }
    
    if(!req.header.host) {
        
    }
    
    res.writeHead(200, {    
        "Content-Type": "text/javascript",
        "Content-Length": rendered.length
    });
    
    res.end((req.method === "GET") ? rendered : "");
    
};