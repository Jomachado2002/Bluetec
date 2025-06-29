// backend/controller/bancard/bancardController.js - VERSIÓN CORREGIDA

const crypto = require('crypto');
const axios = require('axios');
const BancardTransactionModel = require('../../models/bancardTransactionModel');
const SaleModel = require('../../models/saleModel');
const { 
    verifyConfirmationToken, 
    validateBancardConfig,
    parseAmount,
    generateSingleBuyToken,
    generateShopProcessId,
    getBancardBaseUrl,
    formatAmount
} = require('../../helpers/bancardUtils');

/**
 * ✅ CONTROLADOR PARA CONFIRMACIÓN DE BANCARD - CORREGIDO
 */
const bancardConfirmController = async (req, res) => {
    const startTime = Date.now();
    
    try {
        console.log("🔔 ============================================");
        console.log("🔔 CONFIRMACIÓN RECIBIDA DE BANCARD");
        console.log("🔔 ============================================");
        console.log("📅 Timestamp:", new Date().toISOString());
        console.log("🌐 IP origen:", req.ip || req.connection.remoteAddress);
        console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));
        console.log("📦 Body completo:", JSON.stringify(req.body, null, 2));
        console.log("🔗 Query params:", JSON.stringify(req.query, null, 2));
        console.log("🔗 URL completa:", req.originalUrl);
        console.log("🔗 Método:", req.method);

        // ✅ RESPONDER INMEDIATAMENTE A BANCARD CON STATUS 200 (CRÍTICO)
        res.status(200).json({
            status: "success",
            message: "Confirmación recibida correctamente",
            timestamp: new Date().toISOString(),
            processing_time: `${Date.now() - startTime}ms`
        });

        // ✅ PROCESAR EN BACKGROUND PARA NO BLOQUEAR LA RESPUESTA
        setImmediate(() => {
            processConfirmationInBackground(req.body, req.query, req.headers);
        });

    } catch (error) {
        console.error("❌ ERROR EN CONFIRMACIÓN:", error);
        
        // ✅ SIEMPRE RESPONDER 200 A BANCARD AUNQUE HAYA ERROR INTERNO
        res.status(200).json({
            status: "success", 
            message: "Confirmación recibida",
            timestamp: new Date().toISOString(),
            note: "Procesando en background"
        });
    }
};

/**
 * ✅ PROCESAMIENTO EN BACKGROUND
 */
const processConfirmationInBackground = async (body, query, headers) => {
    try {
        console.log("🔄 Procesando confirmación en background...");
        
        const { operation } = body || {};
        
        if (!operation) {
            console.warn("⚠️ No se recibió objeto 'operation' en el body");
            return;
        }

        const transactionData = {
            token: operation.token || '',
            shop_process_id: operation.shop_process_id || '',
            response: operation.response || '',
            response_details: operation.response_details || '',
            amount: operation.amount || '',
            currency: operation.currency || 'PYG',
            authorization_number: operation.authorization_number || '',
            ticket_number: operation.ticket_number || '',
            response_code: operation.response_code || '',
            response_description: operation.response_description || '',
            extended_response_description: operation.extended_response_description || '',
            security_information: operation.security_information || {},
            iva_amount: operation.iva_amount || '',
            iva_ticket_number: operation.iva_ticket_number || ''
        };

        console.log("📊 DATOS PROCESADOS:", transactionData);

        // ✅ DETERMINAR SI EL PAGO FUE EXITOSO
        const isSuccessful = (transactionData.response === 'S' && transactionData.response_code === '00');

        console.log("🎯 Resultado:", isSuccessful ? "EXITOSO" : "FALLIDO", {
            response: transactionData.response,
            response_code: transactionData.response_code
        });

        // ✅ BUSCAR Y ACTUALIZAR TRANSACCIÓN
        if (transactionData.shop_process_id) {
            try {
                const transaction = await BancardTransactionModel.findOne({ 
                    shop_process_id: parseInt(transactionData.shop_process_id) 
                });

                if (transaction) {
                    console.log("🔍 Transacción encontrada:", transaction._id);
                    
                    if (isSuccessful) {
                        await BancardTransactionModel.findByIdAndUpdate(transaction._id, {
                            status: 'approved',
                            response: transactionData.response,
                            response_code: transactionData.response_code,
                            response_description: transactionData.response_description,
                            authorization_number: transactionData.authorization_number,
                            ticket_number: transactionData.ticket_number,
                            security_information: transactionData.security_information,
                            confirmation_date: new Date(),
                            extended_response_description: transactionData.extended_response_description,
                            bancard_confirmed: true
                        });

                        console.log("✅ Transacción APROBADA y actualizada");
                    } else {
                        await BancardTransactionModel.findByIdAndUpdate(transaction._id, {
                            status: 'rejected',
                            response: transactionData.response,
                            response_code: transactionData.response_code,
                            response_description: transactionData.response_description,
                            extended_response_description: transactionData.extended_response_description,
                            confirmation_date: new Date(),
                            bancard_confirmed: true
                        });

                        console.log("❌ Transacción RECHAZADA y actualizada");
                    }
                } else {
                    console.warn("⚠️ No se encontró transacción con shop_process_id:", transactionData.shop_process_id);
                }
            } catch (dbError) {
                console.error("⚠️ Error actualizando BD:", dbError);
            }
        }

        console.log("✅ Procesamiento background completado");

    } catch (error) {
        console.error("❌ Error en procesamiento background:", error);
    }
};

/**
 * ✅ CONTROLADOR PARA CREAR PAGOS - CORREGIDO URLS
 */
const createPaymentController = async (req, res) => {
    try {
        console.log("🛒 === INICIO PROCESO DE PAGO BANCARD ===");
        console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
        
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            console.error("❌ Configuración de Bancard inválida:", configValidation.errors);
            return res.status(500).json({
                message: "Error de configuración del sistema de pagos",
                success: false,
                error: true,
                details: configValidation.errors
            });
        }

        const {
            amount,
            currency = 'PYG',
            description,
            return_url,
            cancel_url,
            iva_amount,
            customer_info,
            items,
            sale_id
        } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "El monto debe ser mayor a 0",
                success: false,
                error: true
            });
        }

        if (!description) {
            return res.status(400).json({
                message: "La descripción es requerida",
                success: false,
                error: true
            });
        }

        const shopProcessId = generateShopProcessId();
        console.log("🆔 Shop Process ID generado:", shopProcessId);
        
        const formattedAmount = formatAmount(amount);
        const formattedIvaAmount = iva_amount ? formatAmount(iva_amount) : null;
        
        const token = generateSingleBuyToken(shopProcessId, formattedAmount, currency);

        // ✅ URLS CORREGIDAS - SEPARAR CLARAMENTE return_url de callback
        const frontendUrl = process.env.FRONTEND_URL || 'https://bluetec.vercel.app';
        
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: shopProcessId,
                amount: formattedAmount,
                currency: currency,
                description: description.substring(0, 20),
                // ✅ return_url: A DONDE VA EL USUARIO DESPUÉS DEL PAGO
                return_url: return_url || `${frontendUrl}/api/bancard/confirm`,
                // ✅ cancel_url: A DONDE VA SI CANCELA
                cancel_url: cancel_url || `${frontendUrl}/pago-cancelado`
            }
        };

        if (formattedIvaAmount) {
            payload.operation.iva_amount = formattedIvaAmount;
        }

        console.log("📤 Payload para Bancard:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy`;
        console.log("🌐 URL de Bancard:", bancardUrl);
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Response status:", response.status);
        console.log("📥 Response data:", JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data && response.data.status === 'success') {
            console.log("✅ Pago creado exitosamente en Bancard");
            
            const processId = response.data.process_id;
            const iframeUrl = `${getBancardBaseUrl()}/checkout/new/${processId}`;
            
            // ✅ GUARDAR TRANSACCIÓN EN BD
            try {
                const newTransaction = new BancardTransactionModel({
                    shop_process_id: shopProcessId,
                    bancard_process_id: processId,
                    amount: parseFloat(formattedAmount),
                    currency: currency,
                    description: description,
                    customer_info: customer_info || {},
                    items: items || [],
                    return_url: return_url || `${frontendUrl}/api/bancard/confirm`,
                    cancel_url: cancel_url || `${frontendUrl}/pago-cancelado`,
                    status: 'pending',
                    environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                    sale_id: sale_id || null,
                    created_by: req.userId || null
                });

                await newTransaction.save();
                console.log("✅ Transacción guardada en BD:", newTransaction._id);

            } catch (dbError) {
                console.error("⚠️ Error guardando transacción en BD:", dbError);
            }
            
            return res.json({
                message: "Pago creado exitosamente",
                success: true,
                error: false,
                data: {
                    shop_process_id: shopProcessId,
                    process_id: processId,
                    amount: formattedAmount,
                    currency: currency,
                    description: description,
                    iframe_url: iframeUrl,
                    return_url: return_url || `${frontendUrl}/api/bancard/confirm`,
                    cancel_url: cancel_url || `${frontendUrl}/pago-cancelado`,
                    bancard_config: {
                        environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                        base_url: getBancardBaseUrl()
                    }
                }
            });
        } else {
            console.error("❌ Bancard respondió con error:", response.data);
            return res.status(400).json({
                message: "Error al crear el pago en Bancard",
                success: false,
                error: true,
                details: response.data
            });
        }

    } catch (error) {
        console.error("❌ Error general en createPaymentController:", error);
        return res.status(500).json({
            message: "Error interno del servidor",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ GET para confirmación - Bancard a veces hace GET primero
 */
const bancardConfirmGetController = (req, res) => {
    console.log("🔍 === GET REQUEST A CONFIRMACIÓN BANCARD ===");
    console.log("Query params:", req.query);
    console.log("Headers:", req.headers);
    
    // Responder OK para GET
    res.status(200).json({
        status: "success",
        message: "Endpoint de confirmación activo",
        timestamp: new Date().toISOString(),
        method: "GET"
    });
};

/**
 * ✅ CONSULTAR ESTADO DE TRANSACCIÓN
 */
const getTransactionStatusController = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log("🔍 === CONSULTANDO ESTADO DE TRANSACCIÓN ===");
        console.log("🔍 Transaction ID:", transactionId);
        
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        // ✅ GENERAR TOKEN PARA CONSULTA
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${transactionId}get_confirmation`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(transactionId)
            }
        };

        console.log("📤 Payload para consulta:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy/confirmations`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Estado obtenido de Bancard:", response.status, JSON.stringify(response.data, null, 2));

        res.json({
            message: "Estado obtenido exitosamente",
            success: true,
            error: false,
            data: response.data
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
 * ✅ ROLLBACK DE PAGO
 */
const rollbackPaymentController = async (req, res) => {
    try {
        console.log("🔄 === INICIANDO ROLLBACK DE PAGO ===");
        
        const { shop_process_id } = req.body;
        
        if (!shop_process_id) {
            return res.status(400).json({
                message: "shop_process_id es requerido",
                success: false,
                error: true
            });
        }

        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        // ✅ GENERAR TOKEN PARA ROLLBACK
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${shop_process_id}rollback0.00`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(shop_process_id)
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

        console.log("📥 Respuesta de rollback:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            res.json({
                message: "Rollback procesado exitosamente",
                success: true,
                error: false,
                data: response.data
            });
        } else {
            res.status(response.status).json({
                message: "Error en rollback",
                success: false,
                error: true,
                data: response.data
            });
        }

    } catch (error) {
        console.error("❌ Error en rollback:", error);
        res.status(500).json({
            message: "Error al procesar rollback",
            success: false,
            error: true,
            details: error.response?.data || error.message
        });
    }
};

/**
 * ✅ HEALTH CHECK
 */
const bancardHealthController = (req, res) => {
    console.log("🏥 Health check de Bancard");
    
    const configValidation = validateBancardConfig();
    
    res.status(200).json({
        status: "healthy",
        message: "Servicio de Bancard funcionando",
        timestamp: new Date().toISOString(),
        service: "bancard-integration",
        version: "2.0.0",
        environment: process.env.BANCARD_ENVIRONMENT || 'staging',
        base_url: getBancardBaseUrl(),
        config_valid: configValidation.isValid,
        config_errors: configValidation.errors || [],
        confirmation_url: process.env.BANCARD_CONFIRMATION_URL
    });
};

module.exports = {
    bancardConfirmGetController, 
    bancardConfirmController,
    createPaymentController,
    getTransactionStatusController,
    bancardHealthController,
    rollbackPaymentController
};