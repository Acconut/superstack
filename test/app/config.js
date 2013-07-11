/**
 * This files contain all necessary configurations for your app.
 * You shouldn't remove any of these else your app wil break!
 *
 * All paths specified in this file are relative to the current working directory!
 */
module.exports = {
    
    /**
     * The Top Level Domain of your app
     * It's used for redirecting and i18n.
     * Not implemented yet!
     */
    domain: "",
    
    /**
     * The port to listen on
     */
    port: 8080,
    
    /**
     * The host
     */
    host: "localhost",
    
    template: {
        
        /**
         * The URL to serve the compiled templates to a client
         * This URL won't be routed!
         */
        url: "/_templates",
        
        /**
         * The directory which contains the templates to be compiled
         * All files are used but directories are ignored.
         */
        dir: "templates/",
        
        /** 
         * The file exporting the compiler
         */
        compiler: "compiler.js"
    },
    
    methods: {
        
        /** 
         * The directory containing files exporting the methods.
         * All files which can be required are used but directories are ignored.
         */
        dir: "methods/",
        
        /**
         * The URL to catch method calls
         * This URL won't be routed!
         */
        url: "/_methods"
    },

    routes: {
        
        /**
         * The file containing the router logic
         * It will be run on the client and server-side.
         */
        router: "routes.js",
        
        /**
         * The URL to serve the compressed content of the router file
         * This URL won't be routed!
         */
        url: "/_routes"
    },
    
    static: {
        
        /**
         * The directory containing all the static files.
         * Those will be served to the client.
         */
        dir: "www/",
        
        /**
         * The file which will be used to precompile the HTML on the server-side
         */
        index: "index.html",
        
        /**
         * The URL to serve the compressed assets (e.g. history.js)
         * This URL won't be routed!
         */
        assetsUrl: "/_assets"
    },
    
    session: {
        
        /**
         * The directory which will be used by LevelDB to store the data
         */
        db: "data/session",
        
        /**
         * The algorithm used to generate a unique session id
         * To see all available algorithms use `openssl list-message-digest-algorithms`
         */
        algorithm: "sha384",
        
        /** 
         * The secret key to make to session ids even more unique
         */
        key: "b56e8f8a6bc3457d60",
        
        /**
         * The file to store the last number used to generate a session id
         */
        idStorage: "data/session-id",
        
        /**
         * The cookie's name which will sotre the session id
         */
        cookie: "_session",
        
        /**
         * Optional options for the cookie
         * See https://github.com/shtylman/node-cookie#more for all available options
         */
        options: {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // In one year
        }
    },
    
    /**
     * I18n isn't ready yet!
     */
    locals: {
        dir: "locals/",
        default: "en",
        url: "/_locals"
    },
};