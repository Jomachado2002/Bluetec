// backend/middleware/authToken.js - SOLUCIÓN SIMPLE
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');

async function authToken(req, res, next) {
    try {
        console.log('🔐 AuthToken: Procesando request...');
        
        const token = req.cookies?.token;
        console.log('🎫 Token presente:', !!token);

        if (token) {
            try {
                // ✅ VERIFICAR TOKEN
                const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
                console.log('✅ Token válido para usuario:', decoded.email, 'Role:', decoded.role);

                // ✅ OBTENER USUARIO DE LA BD
                const user = await userModel.findById(decoded._id).select('-password');
                
                if (user && user.isActive !== false) {
                    // ✅ USUARIO AUTENTICADO - ASIGNAR DATOS
                    req.userId = decoded._id;
                    req.user = user;
                    req.isAuthenticated = true;
                    req.userRole = user.role;
                    req.bancardUserId = user.bancardUserId;
                    
                    console.log('✅ Usuario autenticado:', user.name, 'Role:', user.role);
                    return next();
                } else {
                    console.log('❌ Usuario no encontrado o inactivo');
                    // Limpiar token inválido
                    res.clearCookie('token');
                }
            } catch (jwtError) {
                console.log('❌ Token inválido:', jwtError.message);
                // Limpiar token inválido
                res.clearCookie('token');
            }
        }

        // ✅ CONFIGURAR COMO INVITADO
        const guestId = `guest-${Date.now()}`;
        req.userId = guestId;
        req.isAuthenticated = false;
        req.userRole = 'GUEST';
        req.sessionId = req.session?.id || `session-${Date.now()}`;
        
        console.log('🔓 Configurado como invitado:', guestId);
        next();

    } catch (err) {
        console.error('❌ Error en authToken:', err);
        
        // ✅ FALLBACK
        req.userId = `guest-${Date.now()}`;
        req.isAuthenticated = false;
        req.userRole = 'GUEST';
        req.sessionId = `session-${Date.now()}`;
        
        next();
    }
}

module.exports = authToken;