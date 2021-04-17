let sessionChecker = (req, res, next) => {
    if (!req.session.user && !req.cookies.user_sid) {
        res.redirect(`/users/login?redirect=${req.originalUrl}`);
    } else {
        next();
    }
};

module.exports = sessionChecker;