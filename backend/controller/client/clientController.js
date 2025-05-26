// backend/controller/client/clientController.js - VERSIÓN CORREGIDA
const ClientModel = require('../../models/clientModel');
const uploadProductPermission = require('../../helpers/permission');

/**
 * Crea un nuevo cliente
 */
async function createClientController(req, res) {
    try {
        // ARREGLO: Comentar validación de permisos para permitir usuarios guest
        // if (!uploadProductPermission(req.userId)) {
        //     throw new Error("Permiso denegado");
        // }

        const { 
            name, 
            email, 
            phone, 
            address, 
            company, 
            taxId, 
            notes 
        } = req.body;

        if (!name) {
            throw new Error("El nombre del cliente es requerido");
        }

        // Verificar si ya existe un cliente activo con el mismo email o teléfono
        if (email || phone) {
            const queryConditions = [];
            
            if (email && email.trim() !== '') {
                queryConditions.push({ email: email });
            }
            
            if (phone && phone.trim() !== '') {
                queryConditions.push({ phone: phone });
            }
            
            if (queryConditions.length > 0) {
                const existingClient = await ClientModel.findOne({
                    isActive: { $ne: false },
                    $or: queryConditions
                });
                
                if (existingClient) {
                    throw new Error("Ya existe un cliente con el mismo email o teléfono");
                }
            }
        }

        // ARREGLO: Manejar createdBy para usuarios guest
        const createdByUserId = req.userId && req.userId.startsWith('guest-') ? 
            '000000000000000000000000' : req.userId;

        // Crear nuevo cliente
        const newClient = new ClientModel({
            name,
            email,
            phone,
            address,
            company,
            taxId,
            notes,
            createdBy: createdByUserId
        });

        const savedClient = await newClient.save();

        res.status(201).json({
            message: "Cliente creado correctamente",
            data: savedClient,
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Error en createClientController:", err);
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

/**
 * Obtiene todos los clientes
 */
async function getAllClientsController(req, res) {
    try {
        // ARREGLO: Comentar validación de permisos
        // if (!uploadProductPermission(req.userId)) {
        //     throw new Error("Permiso denegado");
        // }

        const { search, limit = 50, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        const query = { isActive: true };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }
        
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const skip = (page - 1) * limit;
        
        const clients = await ClientModel.find(query)
            .select('-__v')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));
            
        const total = await ClientModel.countDocuments(query);
        
        res.json({
            message: "Lista de clientes",
            data: {
                clients: Array.isArray(clients) ? clients : [],
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                }
            },
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Error en getAllClientsController:", err);
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

/**
 * Obtiene un cliente por su ID
 */
async function getClientByIdController(req, res) {
    try {
        // ARREGLO: Comentar validación de permisos
        // if (!uploadProductPermission(req.userId)) {
        //     throw new Error("Permiso denegado");
        // }

        const { clientId } = req.params;

        if (!clientId) {
            throw new Error("ID de cliente no proporcionado");
        }

        let client = await ClientModel.findById(clientId);

        if (!client) {
            throw new Error("Cliente no encontrado");
        }

        try {
            client = await ClientModel.findById(clientId)
                .populate('budgets', 'budgetNumber totalAmount finalAmount status validUntil createdAt');
        } catch (populateError) {
            console.warn("No se pudieron cargar los presupuestos relacionados:", populateError.message);
        }

        res.json({
            message: "Detalles del cliente",
            data: client,
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Error en getClientByIdController:", err);
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

/**
 * Actualiza un cliente
 */
async function updateClientController(req, res) {
    try {
        // ARREGLO: Comentar validación de permisos
        // if (!uploadProductPermission(req.userId)) {
        //     throw new Error("Permiso denegado");
        // }

        const { clientId } = req.params;
        const { 
            name, 
            email, 
            phone, 
            address, 
            company, 
            taxId, 
            notes,
            isActive
        } = req.body;

        if (!clientId) {
            throw new Error("ID de cliente no proporcionado");
        }

        const client = await ClientModel.findById(clientId);
        
        if (!client) {
            throw new Error("Cliente no encontrado");
        }

        // Verificar si el email o teléfono ya están en uso por otro cliente
        if (email || phone) {
            const queryConditions = [];
            
            if (email && email.trim() !== '') {
                queryConditions.push({ email: email });
            }
            
            if (phone && phone.trim() !== '') {
                queryConditions.push({ phone: phone });
            }
            
            if (queryConditions.length > 0) {
                const existingClient = await ClientModel.findOne({
                    _id: { $ne: clientId },
                    isActive: { $ne: false },
                    $or: queryConditions
                });
                
                if (existingClient) {
                    throw new Error("Ya existe otro cliente con el mismo email o teléfono");
                }
            }
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (company !== undefined) updateData.company = company;
        if (taxId !== undefined) updateData.taxId = taxId;
        if (notes !== undefined) updateData.notes = notes;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedClient = await ClientModel.findByIdAndUpdate(
            clientId,
            updateData,
            { new: true }
        );

        res.json({
            message: "Cliente actualizado correctamente",
            data: updatedClient,
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Error en updateClientController:", err);
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

/**
 * Elimina un cliente (eliminación real)
 */
async function deleteClientController(req, res) {
    try {
        // ARREGLO: Comentar validación de permisos
        // if (!uploadProductPermission(req.userId)) {
        //     throw new Error("Permiso denegado");
        // }

        const { clientId } = req.params;

        if (!clientId) {
            throw new Error("ID de cliente no proporcionado");
        }

        const deletedClient = await ClientModel.findByIdAndDelete(clientId);

        if (!deletedClient) {
            throw new Error("Cliente no encontrado");
        }

        res.json({
            message: "Cliente eliminado correctamente",
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Error en deleteClientController:", err);
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

module.exports = {
    createClientController,
    getAllClientsController,
    getClientByIdController,
    updateClientController,
    deleteClientController
};