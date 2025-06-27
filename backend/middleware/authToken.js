// backend/middleware/authToken.js - VERSIÓN CORREGIDA PARA USUARIOS GENERALES
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel'); // ✅ AGREGAR IMPORT

async function authToken(req, res, next) {
    try {
        console.log('🔐 === MIDDLEWARE AUTH TOKEN ===');
        
        // Generar un ID de usuario persistente para invitados
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
            // ✅ VERIFICAR TOKEN Y OBTENER USUARIO COMPLETO
            jwt.verify(token, process.env.TOKEN_SECRET_KEY, async (err, decoded) => {
                if (err) {
                    console.log('❌ Token inválido, usando usuario invitado');
                    req.userId = guestUserId;
                    req.isAuthenticated = false;
                    req.userRole = 'GUEST';
                } else {
                    try {
                        // ✅ OBTENER DATOS COMPLETOS DEL USUARIO
                        const user = await userModel.findById(decoded._id).select('-password');
                        
                        if (user) {
                            req.userId = decoded._id;
                            req.user = user; // ✅ AGREGAR OBJETO USER COMPLETO
                            req.isAuthenticated = true;
                            req.userRole = user.role;
                            req.bancardUserId = user.bancardUserId; // ✅ ID NUMÉRICO PARA BANCARD
                            
                            console.log('✅ Usuario autenticado:', {
                                userId: req.userId,
                                role: req.userRole,
                                bancardUserId: req.bancardUserId,
                                name: user.name
                            });
                        } else {
                            console.log('⚠️ Usuario no encontrado en BD, usando invitado');
                            req.userId = guestUserId;
                            req.isAuthenticated = false;
                            req.userRole = 'GUEST';
                        }
                    } catch (dbError) {
                        console.error('❌ Error consultando usuario en BD:', dbError);
                        req.userId = guestUserId;
                        req.isAuthenticated = false;
                        req.userRole = 'GUEST';
                    }
                }
                next();
            });
        } else {
            console.log('🔓 Sin token, usuario invitado');
            req.userId = guestUserId;
            req.isAuthenticated = false;
            req.userRole = 'GUEST';
            next();
        }
    } catch (err) {
        console.error('❌ Error en authToken middleware:', err);
        req.userId = `guest-${uuidv4()}`;
        req.isAuthenticated = false;
        req.userRole = 'GUEST';
        next();
    }
}

module.exports = authToken;