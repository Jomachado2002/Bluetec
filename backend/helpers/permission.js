// The current implementation always returns false!
// Fix the uploadProductPermission helper

const userModel = require("../models/userModel")

const uploadProductPermission = async (userId) => {
    try {
        const user = await userModel.findById(userId);
        
        // If user not found or no role, deny permission
        if (!user) {
            console.log("Permission denied: User not found");
            return false;
        }
        
        // Check if user is admin
        if (user.role === 'ADMIN') {
            console.log("Permission granted for ADMIN");
            return true; // This should be TRUE not false!
        }
        
        // For any other role, deny permission
        console.log(`Permission denied for role: ${user.role}`);
        return false;
    } catch (error) {
        console.error("Error checking permissions:", error);
        return false; // Deny on error
    }
}

module.exports = uploadProductPermission;