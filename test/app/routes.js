Pages.add("/")
    .template("home")
    .before(function(params, render) {
        render();
    });

Pages.add("/")
    .template("foo")
    .before(function(params, render) {
        
    });

Pages.else(function(url, notFound, done) {
    Pages.render("notFound", {url: url});
    document.title = "Not found!";
    notFound();
    done();
});