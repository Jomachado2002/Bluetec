// backend/middleware/authToken.js - VERSIÓN CORREGIDA PARA BANCARD

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');

async function authToken(req, res, next) {
    try {
        console.log('🔐 === MIDDLEWARE AUTH TOKEN BANCARD ===');
        
        // ✅ GENERAR ID DE USUARIO PERSISTENTE PARA INVITADOS
        let guestUserId = req.cookies?.guestUserId;
        if (!guestUserId) {
            guestUserId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            res.cookie('guestUserId', guestUserId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
                sameSite: 'lax'
            });
            console.log('🆔 Nuevo guest ID generado:', guestUserId);
        }

        const token = req.cookies?.token;
        console.log('🔍 Token encontrado:', !!token);

        if (token) {
            // ✅ VERIFICAR TOKEN Y OBTENER USUARIO COMPLETO
            try {
                const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
                console.log('✅ Token válido, buscando usuario:', decoded._id);
                
                // ✅ OBTENER DATOS COMPLETOS DEL USUARIO
                const user = await userModel.findById(decoded._id).select('-password');
                
                if (user) {
                    // ✅ ASEGURAR QUE EL USUARIO TENGA bancardUserId
                    if (!user.bancardUserId) {
                        console.log('⚠️ Usuario sin bancardUserId, generando...');
                        
                        // ✅ GENERAR bancardUserId ÚNICO Y VÁLIDO
                        let newBancardUserId;
                        let isUnique = false;
                        let attempts = 0;
                        const maxAttempts = 10;
                        
                        while (!isUnique && attempts < maxAttempts) {
                            // Generar ID numérico entre 100000 y 999999 (6 dígitos)
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
                            // ID de emergencia usando timestamp
                            const emergencyId = parseInt(Date.now().toString().slice(-6));
                            await userModel.findByIdAndUpdate(user._id, { 
                                bancardUserId: emergencyId 
                            });
                            user.bancardUserId = emergencyId;
                            console.log(`🆘 bancardUserId de emergencia ${emergencyId} asignado a ${user.email}`);
                        }
                    }
                    
                    // ✅ CONFIGURAR REQUEST CON DATOS COMPLETOS
                    req.userId = decoded._id;
                    req.user = user; // ✅ OBJETO USER COMPLETO
                    req.isAuthenticated = true;
                    req.userRole = user.role;
                    req.bancardUserId = user.bancardUserId; // ✅ ID NUMÉRICO PARA BANCARD
                    
                    console.log('✅ Usuario autenticado correctamente:', {
                        userId: req.userId,
                        role: req.userRole,
                        bancardUserId: req.bancardUserId,
                        name: user.name,
                        email: user.email
                    });
                } else {
                    console.log('⚠️ Usuario no encontrado en BD, configurando como invitado');
                    setGuestUser();
                }
            } catch (tokenError) {
                console.error('❌ Error verificando token:', tokenError);
                setGuestUser();
            }
        } else {
            console.log('🔓 Sin token, configurando como invitado');
            setGuestUser();
        }

        function setGuestUser() {
            // ✅ CONFIGURAR USUARIO INVITADO CON bancardUserId VÁLIDO
            const guestBancardId = parseInt(guestUserId.replace(/[^0-9]/g, '').slice(-6) || Date.now().toString().slice(-6));
            
            req.userId = guestUserId;
            req.user = {
                name: 'Usuario Invitado',
                email: `guest@bluetec.com`,
                phone: '12345678',
                bancardUserId: guestBancardId,
                _id: guestUserId,
                role: 'GUEST'
            };
            req.isAuthenticated = false;
            req.userRole = 'GUEST';
            req.bancardUserId = guestBancardId;
            
            console.log('👤 Usuario invitado configurado:', {
                userId: req.userId,
                bancardUserId: req.bancardUserId,
                role: req.userRole
            });
        }

        next();
    } catch (err) {
        console.error('❌ Error crítico en authToken middleware:', err);
        
        // ✅ CONFIGURACIÓN DE EMERGENCIA
        const emergencyId = `emergency-${Date.now()}`;
        req.userId = emergencyId;
        req.user = {
            name: 'Usuario de Emergencia',
            email: 'emergency@bluetec.com',
            phone: '12345678',
            bancardUserId: parseInt(Date.now().toString().slice(-6)),
            _id: emergencyId,
            role: 'GUEST'
        };
        req.isAuthenticated = false;
        req.userRole = 'GUEST';
        req.bancardUserId = parseInt(Date.now().toString().slice(-6));
        
        console.log('🚨 Configuración de emergencia aplicada');
        next();
    }
}

module.exports = authToken;