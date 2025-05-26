// backend/middleware/authToken.js - VERSIÓN MEJORADA
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

async function authToken(req, res, next) {
    try {
        // Generar un ID de usuario persistente para guests
        let userId = req.cookies?.guestUserId;
        if (!userId) {
            userId = `guest-${uuidv4()}`;
            
            // ARREGLO: Configurar cookie de manera más robusta
            res.cookie('guestUserId', userId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            });
        }

        const token = req.cookies?.token;

        if (token) {
            jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, decoded) => {
                if (err) {
                    console.log("Token inválido, usando guest user:", userId);
                    req.userId = userId;
                    req.isAuthenticated = false;
                } else {
                    console.log("Usuario autenticado:", decoded._id);
                    req.userId = decoded._id;
                    req.isAuthenticated = true;
                }
                next();
            });
        } else {
            console.log("No hay token, usando guest user:", userId);
            req.userId = userId;
            req.isAuthenticated = false;
            next();
        }
    } catch (err) {
        console.error('Error en authToken:', err);
        // En caso de error, generar un nuevo guest ID
        const fallbackUserId = `guest-${uuidv4()}`;
        req.userId = fallbackUserId;
        req.isAuthenticated = false;
        
        try {
            res.cookie('guestUserId', fallbackUserId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            });
        } catch (cookieError) {
            console.error('Error al establecer cookie:', cookieError);
        }
        
        next();
    }
}

module.exports = authToken;