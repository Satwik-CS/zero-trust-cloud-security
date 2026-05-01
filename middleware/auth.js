const jwt = require('jsonwebtoken');
const logEvent = require('./logging');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        logEvent({
            type: 'AUTH_MISSING_TOKEN',
            reason: 'No Token Provided',
            ip: req.ip,
            path: req.path,
            severity: 'WARN'
        });
        return res.status(403).send({ message: 'A token is required for authentication' });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.TOKEN_KEY || "secret_key");
        req.user = decoded;
    } catch (err) {
        logEvent({
            type: 'AUTH_INVALID_TOKEN',
            reason: 'Token Verification Failed',
            message: err.message,
            ip: req.ip,
            path: req.path,
            severity: 'CRITICAL'
        });
        return res.status(401).send({ message: 'Invalid Token' });
    }
    return next();
};

module.exports = verifyToken;
