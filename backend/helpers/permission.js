// backend/helpers/permission.js - VERSIÓN CORREGIDA
const userModel = require("../models/userModel")

const uploadProductPermission = async (userId) => {
    try {
        // ARREGLO: Permitir acceso a usuarios guest
        if (!userId) {
            console.log("Permission denied: No userId provided");
            return false;
        }

        // Si es un usuario guest, permitir acceso (para funcionalidad de demostración)
        if (userId.startsWith('guest-')) {
            console.log("Permission granted for guest user");
            return true; // Permitir acceso a usuarios guest
        }

        // Para usuarios reales, verificar en la base de datos
        const user = await userModel.findById(userId);
        
        if (!user) {
            console.log("Permission denied: User not found");
            return false;
        }
        
        // Check if user is admin
        if (user.role === 'ADMIN') {
            console.log("Permission granted for ADMIN");
            return true; // ARREGLO: Cambiar de false a true
        }
        
        // Para cualquier otro rol, denegar permiso
        console.log(`Permission denied for role: ${user.role}`);
        return false;
    } catch (error) {
        console.error("Error checking permissions:", error);
        return false; // Denegar en caso de error
    }
}

module.exports = uploadProductPermission;