// backend/controller/bancard/bancardTransactionsController.js - VERSIÓN CORREGIDA
const BancardTransactionModel = require('../../models/bancardTransactionModel');
const crypto = require('crypto');
const axios = require('axios');
const uploadProductPermission = require('../../helpers/permission');
const { 
    validateBancardConfig,
    getBancardBaseUrl
} = require('../../helpers/bancardUtils');

/**
 * ✅ OBTENER TODAS LAS TRANSACCIONES BANCARD - CORREGIDO PARA USUARIOS INVITADOS
 */
const getAllBancardTransactionsController = async (req, res) => {
    try {
        // ✅ VERIFICAR PERMISOS PERO NO RECHAZAR USUARIOS INVITADOS PARA SUS PROPIAS TRANSACCIONES
        const hasAdminPermission = await uploadProductPermission(req.userId);
        
        console.log("🔍 === OBTENIENDO TRANSACCIONES BANCARD ===");
        console.log("👤 Usuario:", {
            userId: req.userId,
            isAuthenticated: req.isAuthenticated,
            userRole: req.userRole,
            hasAdminPermission,
            bancardUserId: req.bancardUserId
        });

        const { 
            status, 
            startDate, 
            endDate, 
            search, 
            limit = 50, 
            page = 1, 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            user_bancard_id,
            payment_method,
            created_by // ✅ AGREGAR NUEVO FILTRO
        } = req.query;

        // ✅ CONSTRUIR QUERY MEJORADA
        let query = {};

        // ✅ SI NO ES ADMIN, SOLO MOSTRAR SUS PROPIAS TRANSACCIONES
        if (!hasAdminPermission && req.isAuthenticated) {
            console.log("🔒 Usuario sin permisos admin, filtrando por sus transacciones");
            query.$or = [
                { created_by: req.userId },
                { user_bancard_id: req.bancardUserId || req.user?.bancardUserId }
            ];
        } else if (!hasAdminPermission && !req.isAuthenticated) {
            // ✅ USUARIOS INVITADOS NO PUEDEN VER TRANSACCIONES SIN PARÁMETROS ESPECÍFICOS
            console.log("🚫 Usuario invitado sin permisos, devolviendo array vacío");
            return res.json({
                message: "Acceso denegado para usuarios no autenticados",
                data: {
                    transactions: [],
                    pagination: {
                        total: 0,
                        page: Number(page),
                        limit: Number(limit),
                        pages: 0
                    }
                },
                success: true,
                error: false
            });
        }

        // ✅ FILTROS ADICIONALES
        if (status) query.status = status;
        
        if (startDate || endDate) {
            query.transaction_date = {};
            if (startDate) query.transaction_date.$gte = new Date(startDate);
            if (endDate) query.transaction_date.$lte = new Date(endDate);
        }
        
        // ✅ FILTRO POR USUARIO MEJORADO
        if (user_bancard_id) {
            if (query.$or) {
                // Si ya hay $or, reemplazarlo con el filtro específico
                query = { ...query };
                delete query.$or;
            }
            query.$or = [
                { user_bancard_id: parseInt(user_bancard_id) },
                { user_bancard_id: user_bancard_id },
                { created_by: user_bancard_id }
            ];
        }

        if (created_by) {
            if (query.$or) {
                delete query.$or;
            }
            query.created_by = created_by;
        }
        
        if (payment_method) query.payment_method = payment_method;
        
        if (search) {
            const searchQuery = {
                $or: [
                    { shop_process_id: { $regex: search, $options: 'i' } },
                    { bancard_process_id: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { 'customer_info.name': { $regex: search, $options: 'i' } },
                    { 'customer_info.email': { $regex: search, $options: 'i' } },
                    { invoice_number: { $regex: search, $options: 'i' } },
                    { authorization_number: { $regex: search, $options: 'i' } }
                ]
            };
            
            // Si ya hay $or en query, combinarlo con AND
            if (query.$or) {
                query = {
                    $and: [
                        { $or: query.$or },
                        searchQuery
                    ],
                    ...Object.fromEntries(Object.entries(query).filter(([key]) => key !== '$or'))
                };
            } else {
                query = { ...query, ...searchQuery };
            }
        }

        // ✅ ORDENAMIENTO
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // ✅ PAGINACIÓN
        const skip = (page - 1) * limit;

        console.log("📋 Query de búsqueda construida:", {
            query: JSON.stringify(query, null, 2),
            sort,
            skip,
            limit: Number(limit),
            hasUserFilter: !!(user_bancard_id || created_by),
            isAdminRequest: hasAdminPermission
        });

        // ✅ EJECUTAR CONSULTA
        const transactions = await BancardTransactionModel
            .find(query)
            .populate('rollback_by', 'name email')
            .populate('created_by', 'name email') // ✅ AGREGAR POPULATE PARA created_by
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean(); // ✅ USAR LEAN PARA MEJOR PERFORMANCE

        const total = await BancardTransactionModel.countDocuments(query);

        console.log("📊 Resultados de consulta:", {
            transactionsFound: transactions.length,
            totalCount: total,
            firstTransactionId: transactions[0]?._id,
            queryExecuted: !!transactions
        });

        res.json({
            message: `Lista de transacciones Bancard${!hasAdminPermission ? ' (filtradas por usuario)' : ''}`,
            data: {
                transactions,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                },
                query_info: {
                    filters_applied: Object.keys(query).length,
                    is_admin_view: hasAdminPermission,
                    user_filtered: !hasAdminPermission && req.isAuthenticated
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
 * ✅ OBTENER DETALLES DE UNA TRANSACCIÓN - MEJORADO
 */
const getBancardTransactionByIdController = async (req, res) => {
    try {
        const hasAdminPermission = await uploadProductPermission(req.userId);
        
        const { transactionId } = req.params;

        console.log("🔍 Obteniendo transacción por ID:", {
            transactionId,
            userId: req.userId,
            hasAdminPermission,
            isAuthenticated: req.isAuthenticated
        });

        const transaction = await BancardTransactionModel
            .findById(transactionId)
            .populate('rollback_by', 'name email')
            .populate('created_by', 'name email')
            .lean();

        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                error: true,
                success: false
            });
        }

        // ✅ VERIFICAR PERMISOS DE ACCESO
        if (!hasAdminPermission) {
            const userCanAccess = req.isAuthenticated && (
                transaction.created_by?.toString() === req.userId ||
                transaction.user_bancard_id === req.bancardUserId ||
                transaction.user_bancard_id === req.user?.bancardUserId
            );

            if (!userCanAccess) {
                return res.status(403).json({
                    message: "No tienes permisos para ver esta transacción",
                    error: true,
                    success: false
                });
            }
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

        const transaction = await BancardTransactionModel.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                error: true,
                success: false
            });
        }

        if (transaction.status !== 'approved') {
            return res.status(400).json({
                message: "Solo se pueden reversar transacciones aprobadas",
                error: true,
                success: false
            });
        }

        if (transaction.is_rolled_back) {
            return res.status(400).json({
                message: "Esta transacción ya fue reversada",
                error: true,
                success: false
            });
        }

        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración de Bancard",
                error: true,
                success: false
            });
        }

        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${transaction.shop_process_id}rollback0.00`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: transaction.shop_process_id
            }
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
            await BancardTransactionModel.findByIdAndUpdate(transactionId, {
                is_rolled_back: true,
                rollback_date: new Date(),
                rollback_reason: reason || 'Reversado desde panel administrativo',
                rollback_by: req.userId,
                status: 'rolled_back'
            });

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

        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración de Bancard",
                error: true,
                success: false
            });
        }

        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${transaction.shop_process_id}get_confirmation`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: transaction.shop_process_id
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
 * ✅ CREAR/GUARDAR TRANSACCIÓN BANCARD - MEJORADO
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

        // ✅ NORMALIZAR CUSTOMER_INFO
        const normalizedCustomerInfo = {
            name: customer_info?.name || '',
            email: customer_info?.email || '',
            phone: customer_info?.phone || '',
            address: typeof customer_info?.address === 'string' 
                ? customer_info.address 
                : (customer_info?.address?.street || ''),
            document_type: customer_info?.document_type || 'CI',
            document_number: customer_info?.document_number || ''
        };

        // ✅ NORMALIZAR ITEMS
        const normalizedItems = (items || []).map(item => ({
            product_id: item.product_id || item._id || '',
            name: item.name || item.productName || 'Producto',
            quantity: parseInt(item.quantity) || 1,
            unit_price: parseFloat(item.unitPrice || item.unit_price || 0),
            unitPrice: parseFloat(item.unitPrice || item.unit_price || 0),
            total: parseFloat(item.total || ((item.quantity || 1) * (item.unitPrice || item.unit_price || 0))),
            category: item.category || '',
            brand: item.brand || '',
            sku: item.sku || ''
        }));

        const newTransaction = new BancardTransactionModel({
            shop_process_id,
            bancard_process_id,
            amount,
            currency,
            description,
            customer_info: normalizedCustomerInfo,
            items: normalizedItems,
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