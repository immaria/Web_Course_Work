let checkAuth = function checkAuth(req, res, next) {
    if (!req.user) return res.sendStatus(401); // 'Not authorized'
    next();
}

let checkAdmin = function checkAdmin(req, res, next) {
    if (!req.user) res.sendStatus(401); // 'Not authorized'
    else if (req.user.role !== 1) res.sendStatus(403); // 'Forbidden'
    else next();
}
module.exports = {
    checkAdmin, checkAuth
}