const jwt = require('jsonwebtoken');

const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

module.exports = optionalVerifyToken;
