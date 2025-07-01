// backend/controller/user/userSignin.js - VERSIÓN CORREGIDA PARA DEBUGGING
const bcrypt = require('bcryptjs');
const userModel = require('../../models/userModel');
const addToCartModel = require('../../models/cartProduct');
const jwt = require('jsonwebtoken');

async function userSignInController(req, res) {
    try {
        console.log("🔐 === INICIO DE SESIÓN ===");
        const { email, password } = req.body;

        // ✅ VALIDACIONES BÁSICAS
        if (!email || !password) {
            console.log("❌ Datos faltantes:", { email: !!email, password: !!password });
            return res.status(400).json({
                message: "Por favor ingresa tu correo y contraseña.",
                error: true,
                success: false
            });
        }

        console.log("📧 Buscando usuario con email:", email);

        // ✅ BUSCAR USUARIO
        const user = await userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log("❌ Usuario no encontrado para email:", email);
            return res.status(404).json({
                message: "Usuario no encontrado.",
                error: true,
                success: false
            });
        }

        console.log("✅ Usuario encontrado:", {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });

        // ✅ VERIFICAR CONTRASEÑA
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log("❌ Contraseña incorrecta para:", email);
            return res.status(401).json({
                message: "Contraseña incorrecta.",
                error: true,
                success: false
            });
        }

        console.log("✅ Contraseña válida");

        // ✅ CREAR TOKEN JWT
        const tokenData = {
            _id: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        console.log("🎫 Creando token con datos:", tokenData);

        const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, { 
            expiresIn: '24h' 
        });

        console.log("✅ Token creado exitosamente");

        // ✅ CONFIGURAR COOKIE CON CONFIGURACIÓN ESPECÍFICA PARA VERCEL
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
            path: '/' // ✅ AGREGAR PATH EXPLÍCITO
        };

        // ✅ PARA PRODUCCIÓN EN VERCEL, NO USAR DOMINIO ESPECÍFICO
        if (process.env.NODE_ENV === 'production') {
            // No establecer domain para permitir subdominios
            delete cookieOptions.domain;
        }

        console.log("🍪 Configurando cookie con opciones:", cookieOptions);

        res.cookie('token', token, cookieOptions);

        // ✅ TRANSFERIR CARRITO DE INVITADO (si existe)
        try {
            if (req.session && req.session.guestId) {
                console.log("🛒 Transfiriendo carrito de invitado:", req.session.guestId);
                await transferGuestCart(req.session.guestId, user._id);
                console.log("✅ Carrito transferido exitosamente");
            }
        } catch (cartError) {
            console.error('⚠️ Error al transferir carrito (no crítico):', cartError);
            // No interrumpimos el login si falla la transferencia del carrito
        }

        // ✅ ACTUALIZAR ÚLTIMO LOGIN
        try {
            await userModel.findByIdAndUpdate(user._id, { 
                lastLogin: new Date() 
            });
        } catch (updateError) {
            console.error('⚠️ Error actualizando último login:', updateError);
            // No es crítico
        }

        console.log("🎉 Login exitoso para:", email);

        // ✅ RESPUESTA EXITOSA
        return res.status(200).json({
            message: "Inicio de sesión exitoso",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePic: user.profilePic || ''
            },
            success: true,
            error: false
        });

    } catch (err) {
        console.error('❌ Error crítico en signin:', err);
        return res.status(500).json({
            message: "Error en el servidor durante el inicio de sesión",
            error: true,
            success: false,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}

// ✅ FUNCIÓN PARA TRANSFERIR CARRITO DE INVITADO
async function transferGuestCart(guestId, userId) {
    try {
        console.log("🔄 Iniciando transferencia de carrito:", { guestId, userId });
        
        const guestCart = await addToCartModel.find({ userId: guestId });
        console.log(`📦 Encontrados ${guestCart.length} items en carrito de invitado`);
        
        for (const item of guestCart) {
            // Verificar si ya existe el producto en el carrito del usuario
            const existingItem = await addToCartModel.findOne({
                productId: item.productId,
                userId: userId
            });

            if (existingItem) {
                // Si existe, actualizar cantidad
                existingItem.quantity += item.quantity;
                await existingItem.save();
                console.log(`📦 Cantidad actualizada para producto ${item.productId}`);
            } else {
                // Si no existe, crear nuevo item
                await addToCartModel.create({
                    productId: item.productId,
                    quantity: item.quantity,
                    userId: userId,
                    sessionId: `user-${userId}`,
                    isGuest: false
                });
                console.log(`📦 Nuevo item creado para producto ${item.productId}`);
            }
        }
        
        // Eliminar carrito de invitado
        const deleteResult = await addToCartModel.deleteMany({ userId: guestId });
        console.log(`🗑️ Eliminados ${deleteResult.deletedCount} items del carrito de invitado`);
        
        return true;
    } catch (error) {
        console.error('❌ Error en transferGuestCart:', error);
        throw error;
    }
}

module.exports = userSignInController;