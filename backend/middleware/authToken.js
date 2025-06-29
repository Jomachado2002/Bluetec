// backend/middleware/authToken.js - VERSIÓN CORREGIDA PARA BANCARD

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');

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
                            // ✅ ASEGURAR QUE EL USUARIO TENGA bancardUserId
                            if (!user.bancardUserId) {
                                console.log('⚠️ Usuario sin bancardUserId, generando...');
                                
                                let isUnique = false;
                                let newBancardUserId;
                                let attempts = 0;
                                const maxAttempts = 5;
                                
                                while (!isUnique && attempts < maxAttempts) {
                                    newBancardUserId = Math.floor(100000 + Math.random() * 900000);
                                    
                                    const existingUser = await userModel.findOne({ 
                                        bancardUserId: newBancardUserId 
                                    });
                                    
                                    if (!existingUser) {
                                        isUnique = true;
                                    } else {
                                        attempts++;
                                    }
                                }
                                
                                if (isUnique) {
                                    await userModel.findByIdAndUpdate(user._id, { 
                                        bancardUserId: newBancardUserId 
                                    });
                                    user.bancardUserId = newBancardUserId;
                                    console.log(`✅ bancardUserId ${newBancardUserId} asignado a ${user.email}`);
                                } else {
                                    const emergencyId = parseInt(Date.now().toString().slice(-6));
                                    await userModel.findByIdAndUpdate(user._id, { 
                                        bancardUserId: emergencyId 
                                    });
                                    user.bancardUserId = emergencyId;
                                    console.log(`🆘 bancardUserId de emergencia ${emergencyId} asignado a ${user.email}`);
                                }
                            }
                            
                            req.userId = decoded._id;
                            req.user = user; // ✅ OBJETO USER COMPLETO
                            req.isAuthenticated = true;
                            req.userRole = user.role;
                            req.bancardUserId = user.bancardUserId; // ✅ ID NUMÉRICO PARA BANCARD
                            
                            console.log('✅ Usuario autenticado:', {
                                userId: req.userId,
                                role: req.userRole,
                                bancardUserId: req.bancardUserId,
                                name: user.name,
                                email: user.email
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