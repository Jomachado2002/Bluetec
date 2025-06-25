// backend/controller/bancard/bancardTransactionsController.js - VERSIÓN CORREGIDA
const BancardTransactionModel = require('../../models/bancardTransactionModel');
// ✅ QUITAR REFERENCIA A SALE TEMPORALMENTE
// const SaleModel = require('../../models/saleModel');
const crypto = require('crypto');
const axios = require('axios');
const uploadProductPermission = require('../../helpers/permission');
const { 
    validateBancardConfig,
    getBancardBaseUrl
} = require('../../helpers/bancardUtils');

/**
 * ✅ OBTENER TODAS LAS TRANSACCIONES BANCARD - SIN POPULATE SALE
 */
const getAllBancardTransactionsController = async (req, res) => {
    try {
        const hasPermission = await uploadProductPermission(req.userId);
        if (!hasPermission) {
            return res.status(403).json({
                message: "Permiso denegado",
                error: true,
                success: false
            });
        }

        const {
            status,
            startDate,
            endDate,
            search,
            limit = 50,
            page = 1,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Construir query
        const query = {};

        if (status) query.status = status;
        
        if (startDate || endDate) {
            query.transaction_date = {};
            if (startDate) query.transaction_date.$gte = new Date(startDate);
            if (endDate) query.transaction_date.$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { shop_process_id: { $regex: search, $options: 'i' } },
                { bancard_process_id: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'customer_info.name': { $regex: search, $options: 'i' } },
                { 'customer_info.email': { $regex: search, $options: 'i' } }
            ];
        }

        // Ordenamiento
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Paginación
        const skip = (page - 1) * limit;

        // ✅ SIN POPULATE POR AHORA
        const transactions = await BancardTransactionModel
            .find(query)
            .populate('rollback_by', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        const total = await BancardTransactionModel.countDocuments(query);

        res.json({
            message: "Lista de transacciones Bancard",
            data: {
                transactions,
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

    } catch (error) {
        console.error("❌ Error obteniendo transacciones:", error);
        res.status(500).json({
            message: "Error al obtener transacciones",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ OBTENER DETALLES DE UNA TRANSACCIÓN - SIN POPULATE SALE
 */
const getBancardTransactionByIdController = async (req, res) => {
    try {
        const hasPermission = await uploadProductPermission(req.userId);
        if (!hasPermission) {
            return res.status(403).json({
                message: "Permiso denegado",
                error: true,
                success: false
            });
        }

        const { transactionId } = req.params;

        // ✅ SIN POPULATE POR AHORA
        const transaction = await BancardTransactionModel
            .findById(transactionId)
            .populate('rollback_by', 'name email')
            .populate('created_by', 'name email');

        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                error: true,
                success: false
            });
        }

        res.json({
            message: "Detalles de la transacción",
            data: transaction,
            success: true,
            error: false
        });

    } catch (error) {
        console.error("❌ Error obteniendo transacción:", error);
        res.status(500).json({
            message: "Error al obtener transacción",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ HACER ROLLBACK DE UNA TRANSACCIÓN - CORREGIDO
 */
const rollbackBancardTransactionController = async (req, res) => {
    try {
        const hasPermission = await uploadProductPermission(req.userId);
        if (!hasPermission) {
            return res.status(403).json({
                message: "Permiso denegado",
                error: true,
                success: false
            });
        }

        const { transactionId } = req.params;
        const { reason } = req.body;

        console.log("🔄 === INICIANDO ROLLBACK DESDE ADMIN ===");
        console.log("Transaction ID:", transactionId);
        console.log("Reason:", reason);

        // Buscar la transacción
        const transaction = await BancardTransactionModel.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                error: true,
                success: false
            });
        }

        // Verificar que la transacción esté aprobada
        if (transaction.status !== 'approved') {
            return res.status(400).json({
                message: "Solo se pueden reversar transacciones aprobadas",
                error: true,
                success: false
            });
        }

        // Verificar que no esté ya reversa
        if (transaction.is_rolled_back) {
            return res.status(400).json({
                message: "Esta transacción ya fue reversada",
                error: true,
                success: false
            });
        }

        // Validar configuración de Bancard
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración de Bancard",
                error: true,
                success: false
            });
        }

        // ✅ GENERAR TOKEN PARA ROLLBACK
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${transaction.shop_process_id}rollback0.00`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: transaction.shop_process_id
            }
            // ✅ SIN test_client según instrucciones de Bancard
        };

        console.log("📤 Payload de rollback:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy/rollback`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de Bancard:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data.status === 'success') {
            // ✅ ACTUALIZAR TRANSACCIÓN COMO REVERSADA
            await BancardTransactionModel.findByIdAndUpdate(transactionId, {
                is_rolled_back: true,
                rollback_date: new Date(),
                rollback_reason: reason || 'Reversado desde panel administrativo',
                rollback_by: req.userId,
                status: 'rolled_back'
            });

            // ✅ COMENTAR ACTUALIZACIÓN DE SALE TEMPORALMENTE
            // if (transaction.sale_id) {
            //     await SaleModel.findByIdAndUpdate(transaction.sale_id, {
            //         paymentStatus: 'cancelled',
            //         notes: `${transaction.notes || ''}\n\nPago reversado: ${reason || 'Sin razón especificada'}`
            //     });
            // }

            console.log("✅ Rollback exitoso");

            res.json({
                message: "Transacción reversada exitosamente",
                success: true,
                error: false,
                data: {
                    transaction_id: transactionId,
                    shop_process_id: transaction.shop_process_id,
                    bancard_response: response.data
                }
            });

        } else {
            console.error("❌ Error en rollback de Bancard:", response.data);
            
            // Verificar si es error por transacción ya confirmada
            const isAlreadyConfirmed = response.data.messages?.some(msg => 
                msg.key === 'TransactionAlreadyConfirmed'
            );

            if (isAlreadyConfirmed) {
                return res.status(400).json({
                    message: "La transacción ya fue confirmada y no puede ser reversada automáticamente",
                    error: true,
                    success: false,
                    requiresManualReversal: true,
                    data: response.data
                });
            }

            res.status(400).json({
                message: "Error al reversar transacción en Bancard",
                success: false,
                error: true,
                data: response.data
            });
        }

    } catch (error) {
        console.error("❌ Error en rollback:", error);
        
        let errorMessage = "Error al procesar rollback";
        let errorDetails = error.message;
        
        if (error.response) {
            errorDetails = error.response.data;
            if (error.response.data?.messages?.[0]?.key === 'TransactionAlreadyConfirmed') {
                errorMessage = "La transacción ya fue confirmada y no puede ser cancelada";
            }
        }
        
        res.status(500).json({
            message: errorMessage,
            success: false,
            error: true,
            details: errorDetails
        });
    }
};

/**
 * ✅ CONSULTAR ESTADO DE TRANSACCIÓN EN BANCARD - CORREGIDO
 */
const checkBancardTransactionStatusController = async (req, res) => {
    try {
        const hasPermission = await uploadProductPermission(req.userId);
        if (!hasPermission) {
            return res.status(403).json({
                message: "Permiso denegado",
                error: true,
                success: false
            });
        }

        const { transactionId } = req.params;

        const transaction = await BancardTransactionModel.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                error: true,
                success: false
            });
        }

        // Validar configuración
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración de Bancard",
                error: true,
                success: false
            });
        }

        // ✅ USAR EL shop_process_id DE LA TRANSACCIÓN, NO null
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${transaction.shop_process_id}get_confirmation`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: transaction.shop_process_id // ✅ USAR VALOR REAL, NO null
            }
        };

        console.log("📤 Payload de consulta:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy/confirmations`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Estado de Bancard:", response.data);

        res.json({
            message: "Estado de transacción consultado",
            success: true,
            error: false,
            data: {
                local_transaction: transaction,
                bancard_status: response.data
            }
        });

    } catch (error) {
        console.error("❌ Error consultando estado:", error);
        res.status(500).json({
            message: "Error al consultar estado de la transacción",
            success: false,
            error: true,
            details: error.response?.data || error.message
        });
    }
};

/**
 * ✅ CREAR/GUARDAR TRANSACCIÓN BANCARD
 */
const createBancardTransactionController = async (req, res) => {
    try {
        const {
            shop_process_id,
            bancard_process_id,
            amount,
            currency = 'PYG',
            description,
            customer_info,
            items,
            return_url,
            cancel_url,
            sale_id
        } = req.body;

        // Crear nueva transacción
        const newTransaction = new BancardTransactionModel({
            shop_process_id,
            bancard_process_id,
            amount,
            currency,
            description,
            customer_info,
            items,
            return_url,
            cancel_url,
            sale_id,
            environment: process.env.BANCARD_ENVIRONMENT || 'staging',
            created_by: req.userId
        });

        const savedTransaction = await newTransaction.save();

        res.status(201).json({
            message: "Transacción Bancard creada",
            data: savedTransaction,
            success: true,
            error: false
        });

    } catch (error) {
        console.error("❌ Error creando transacción:", error);
        res.status(500).json({
            message: "Error al crear transacción",
            success: false,
            error: true,
            details: error.message
        });
    }
};

module.exports = {
    getAllBancardTransactionsController,
    getBancardTransactionByIdController,
    rollbackBancardTransactionController,
    checkBancardTransactionStatusController,
    createBancardTransactionController
};