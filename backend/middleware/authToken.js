// backend/middleware/authToken.js
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// ObjectId válido para casos donde no hay usuario autenticado pero se necesita un ObjectId
const GUEST_OBJECT_ID = new mongoose.Types.ObjectId('000000000000000000000000');

async function authToken(req, res, next) {
    try {
        // Generar un ID de guest para funcionalidades del frontend (carrito, etc.)
        let guestUserId = req.cookies?.guestUserId;
        if (!guestUserId) {
            guestUserId = `guest-${uuidv4()}`;
            res.cookie('guestUserId', guestUserId, {
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
                    // Token inválido - usuario no autenticado
                    req.userId = GUEST_OBJECT_ID; // ObjectId válido pero no es un usuario real
                    req.guestUserId = guestUserId;
                    req.isAuthenticated = false;
                } else {
                    // Usuario autenticado correctamente
                    req.userId = decoded._id;
                    req.guestUserId = guestUserId;
                    req.isAuthenticated = true;
                }
                next();
            });
        } else {
            // Sin token - usuario no autenticado
            req.userId = GUEST_OBJECT_ID; // ObjectId válido pero no es un usuario real
            req.guestUserId = guestUserId;
            req.isAuthenticated = false;
            next();
        }
    } catch (err) {
        console.error('Error en authToken:', err);
        req.userId = GUEST_OBJECT_ID;
        req.guestUserId = `guest-${uuidv4()}`;
        req.isAuthenticated = false;
        next();
    }
}

module.exports = authToken;