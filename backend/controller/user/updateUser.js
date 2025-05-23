const userModel = require("../../models/userModel")

async function updateUser(req, res) {
    try {
        const sessionUser = req.userId;
        const { userId, email, name, role } = req.body;

        // Verificar si es un usuario invitado
        if (!sessionUser || sessionUser.startsWith('guest-')) {
            return res.status(401).json({
                message: "Debes iniciar sesión para actualizar usuarios",
                error: true,
                success: false
            });
        }

        // Verificar que el usuario de sesión existe
        const currentUser = await userModel.findById(sessionUser);
        if (!currentUser) {
            return res.status(401).json({
                message: "Usuario de sesión no encontrado",
                error: true,
                success: false
            });
        }

        // Solo los ADMIN pueden cambiar roles
        if (role && currentUser.role !== 'ADMIN') {
            return res.status(403).json({
                message: "Solo los administradores pueden cambiar roles",
                error: true,
                success: false
            });
        }

        // Verificar que el usuario a actualizar existe
        const userToUpdate = await userModel.findById(userId);
        if (!userToUpdate) {
            return res.status(404).json({
                message: "Usuario a actualizar no encontrado",
                error: true,
                success: false
            });
        }

        // Construir payload solo con campos válidos
        const payload = {};
        if (email) payload.email = email;
        if (name) payload.name = name;
        if (role && currentUser.role === 'ADMIN') payload.role = role;

        // Actualizar usuario
        const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            payload, 
            { new: true, select: '-password' } // Excluir password de la respuesta
        );

        res.json({
            data: updatedUser,
            message: "Usuario actualizado correctamente",
            success: true,
            error: false
        });

    } catch (err) {
        console.error('Error en updateUser:', err);
        res.status(400).json({
            message: err.message || "Error al actualizar usuario",
            error: true,
            success: false
        });
    }
}

module.exports = updateUser;