var middlewareObject = {};

middlewareObject.isLoggedin = (req,res,next) => {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
};

module.exports = middlewareObject;