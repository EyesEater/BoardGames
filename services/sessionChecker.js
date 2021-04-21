let sessionChecker = (req, res, next) => {
    if (!req.session.user) {
        res.redirect(`/users/login?redirect=${req.originalUrl}`);
    } else {
        next();
    }
};

module.exports = sessionChecker;