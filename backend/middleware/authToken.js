// backend/middleware/authToken.js - VERSIÓN CON DEBUG MEJORADO
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');

async function authToken(req, res, next) {
    try {
        console.log('🔐 === MIDDLEWARE AUTH TOKEN INICIADO ===');
        console.log('📧 Headers:', Object.keys(req.headers));
        console.log('🍪 Cookies recibidas:', Object.keys(req.cookies || {}));
        
        // ✅ GENERAR ID DE USUARIO PERSISTENTE PARA INVITADOS
        let guestUserId = req.cookies?.guestUserId;
        if (!guestUserId) {
            guestUserId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            res.cookie('guestUserId', guestUserId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
            });
            console.log('🆕 Generado nuevo guestUserId:', guestUserId);
        } else {
            console.log('♻️ Usando guestUserId existente:', guestUserId);
        }

        const token = req.cookies?.token;
        console.log('🎫 Token presente:', !!token);
        
        if (token) {
            console.log('🔍 Token encontrado, verificando...');
            
            // ✅ VERIFICAR TOKEN DE FORMA SÍNCRONA PARA MEJOR CONTROL
            try {
                const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
                console.log('✅ Token decodificado exitosamente:', {
                    userId: decoded._id,
                    email: decoded.email,
                    role: decoded.role
                });

                // ✅ OBTENER DATOS COMPLETOS DEL USUARIO
                const user = await userModel.findById(decoded._id).select('-password');
                
                if (user && user.isActive !== false) {
                    req.userId = decoded._id;
                    req.user = user;
                    req.isAuthenticated = true;
                    req.userRole = user.role;
                    req.bancardUserId = user.bancardUserId;
                    
                    console.log('✅ Usuario autenticado correctamente:', {
                        userId: req.userId,
                        role: req.userRole,
                        name: user.name,
                        email: user.email
                    });
                } else {
                    console.log('⚠️ Usuario no encontrado o inactivo, usando modo invitado');
                    req.userId = guestUserId;
                    req.isAuthenticated = false;
                    req.userRole = 'GUEST';
                }
            } catch (jwtError) {
                console.log('❌ Error verificando token:', jwtError.message);
                
                // ✅ LIMPIAR COOKIE INVÁLIDA
                res.clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
                });
                
                req.userId = guestUserId;
                req.isAuthenticated = false;
                req.userRole = 'GUEST';
            }
        } else {
            console.log('🔓 Sin token, configurando como usuario invitado');
            req.userId = guestUserId;
            req.isAuthenticated = false;
            req.userRole = 'GUEST';
        }

        // ✅ CONFIGURAR SESSION ID
        req.sessionId = req.session?.id || req.sessionID || `session-${Date.now()}`;

        console.log('📊 Estado final del middleware:', {
            userId: req.userId,
            isAuthenticated: req.isAuthenticated,
            userRole: req.userRole,
            sessionId: req.sessionId
        });

        console.log('🔐 === MIDDLEWARE AUTH TOKEN COMPLETADO ===');
        next();

    } catch (err) {
        console.error('❌ Error crítico en authToken middleware:', err);
        
        // ✅ FALLBACK SEGURO
        const fallbackGuestId = `guest-${Date.now()}-fallback`;
        req.userId = fallbackGuestId;
        req.isAuthenticated = false;
        req.userRole = 'GUEST';
        req.sessionId = `session-${Date.now()}`;
        
        console.log('🆘 Configuración de fallback aplicada:', {
            userId: req.userId,
            isAuthenticated: req.isAuthenticated,
            userRole: req.userRole
        });
        
        next();
    }
}

module.exports = authToken;