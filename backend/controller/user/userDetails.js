// backend/controller/user/userDetails.js - VERSIÓN CORREGIDA
const userModel = require("../../models/userModel")

async function userDetailsController(req, res) {
    try {
        console.log("🔍 === OBTENIENDO DETALLES DE USUARIO ===");
        console.log("📋 userId recibido:", req.userId);
        console.log("🔐 isAuthenticated:", req.isAuthenticated);
        console.log("👤 userRole:", req.userRole);

        // ✅ VERIFICAR SI ES UN USUARIO INVITADO
        if (!req.userId || (typeof req.userId === 'string' && req.userId.startsWith('guest-'))) {
            console.log("⚠️ Usuario invitado detectado, rechazando acceso a detalles");
            return res.status(401).json({
                message: "Debes iniciar sesión para acceder a los detalles del usuario",
                error: true,
                success: false,
                isGuest: true
            });
        }

        // ✅ VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO
        if (!req.isAuthenticated) {
            console.log("❌ Usuario no autenticado");
            return res.status(401).json({
                message: "Usuario no autenticado",
                error: true,
                success: false,
                isGuest: true
            });
        }

        // ✅ BUSCAR EL USUARIO EN LA BASE DE DATOS
        const user = await userModel.findById(req.userId).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            console.log("❌ Usuario no encontrado en la base de datos");
            return res.status(404).json({
                message: "Usuario no encontrado",
                error: true,
                success: false
            });
        }

        console.log("✅ Usuario encontrado:", {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        // ✅ RESPUESTA EXITOSA
        res.status(200).json({
            data: user,
            error: false,
            success: true,
            message: "Detalles del usuario obtenidos correctamente"
        });

    } catch (err) {
        console.error("❌ Error en userDetailsController:", err);
        res.status(500).json({
            message: err.message || "Error interno del servidor",
            error: true,
            success: false
        });
    }
}

module.exports = userDetailsController