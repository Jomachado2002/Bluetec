const userModel = require("../../models/userModel")

async function userDetailsController(req, res) {
    try {
        console.log("userId", req.userId);

        // Verificar si es un usuario invitado
        if (!req.userId || req.userId.startsWith('guest-')) {
            return res.status(401).json({
                message: "Debes iniciar sesión para ver detalles del usuario",
                error: true,
                success: false
            });
        }

        const user = await userModel.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado",
                error: true,
                success: false
            });
        }

        res.status(200).json({
            data: user,
            error: false,
            success: true,
            message: "Detalles del usuario"
        });

        console.log("user", user);

    } catch (err) {
        console.error('Error en userDetailsController:', err);
        res.status(400).json({
            message: err.message || "Error al obtener detalles del usuario",
            error: true,
            success: false
        });
    }
}

module.exports = userDetailsController