Pages.add("/")
    .template("home")
    .before(function(params, render) {
        render();
    });

Pages.add("/")
    .template("foo")
    .before(function(params, render) {
        
    });

Pages.add("/redirect")
    .template("home")
    .before(function(params, render) {
        Pages.redirect("/newurl", 301);
    });

Pages.else(function(url, notFound, done) {
    Pages.render("notFound", {url: url});
    document.title = "Not found!";
    notFound();
    done();
});