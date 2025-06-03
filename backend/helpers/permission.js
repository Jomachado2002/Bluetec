// backend/helpers/permission.js
const userModel = require("../models/userModel");
const mongoose = require('mongoose');

// ObjectId para usuarios no autenticados
const GUEST_OBJECT_ID = new mongoose.Types.ObjectId('000000000000000000000000');

const uploadProductPermission = async (userId) => {
    try {
        // Si es el ObjectId de guest (no autenticado), denegar permiso
        if (!userId || userId.toString() === GUEST_OBJECT_ID.toString()) {
            console.log("Permission denied: User not authenticated (guest)");
            return false;
        }

        const user = await userModel.findById(userId);
        
        // If user not found or no role, deny permission
        if (!user) {
            console.log("Permission denied: User not found");
            return false;
        }
        
        // Check if user is admin
        if (user.role === 'ADMIN') {
            console.log("Permission granted for ADMIN:", user.name);
            return true;
        }
        
        // For any other role, deny permission
        console.log(`Permission denied for role: ${user.role} (user: ${user.name})`);
        return false;
    } catch (error) {
        console.error("Error checking permissions:", error);
        return false; // Deny on error
    }
}

module.exports = uploadProductPermission;