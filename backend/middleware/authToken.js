const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

async function authToken(req, res, next) {
    try {
        // Generar un ID de usuario persistente
        let userId = req.cookies?.guestUserId;
        if (!userId) {
            userId = `guest-${uuidv4()}`;
            res.cookie('guestUserId', userId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
                sameSite: 'lax'
            });
        }

        const token = req.cookies?.token;

        if (token) {
            jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => {
                if (err) {
                    req.userId = userId;
                    req.isAuthenticated = false;
                } else {
                    req.userId = decoded._id;
                    req.isAuthenticated = true;
                }
                next();
            });
        } else {
            req.userId = userId;
            req.isAuthenticated = false;
            next();
        }
    } catch (err) {
        console.error('Error en authToken:', err);
        req.userId = `guest-${uuidv4()}`;
        req.isAuthenticated = false;
        next();
    }
}

module.exports = authToken;
