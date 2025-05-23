const userModel = require("../models/userModel")

const uploadProductPermission = async (userId) => {
    // Verificar si es un usuario invitado
    if (!userId || userId.startsWith('guest-')) {
        return false;
    }

    try {
        const user = await userModel.findById(userId);
        
        if (!user || user.role !== 'ADMIN') {
            return false;
        }
        
        return true; // ← CORREGIDO: retorna true para ADMIN
    } catch (error) {
        console.error('Error en uploadProductPermission:', error);
        return false;
    }
}

module.exports = uploadProductPermission