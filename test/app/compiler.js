var ejs = require("ejs");

module.exports = function(source) {
    return ejs.compile(source, { client: true, compileDebug: false });
};