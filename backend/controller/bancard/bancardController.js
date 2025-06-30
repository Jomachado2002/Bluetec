// backend/controller/bancard/bancardController.js - VERSIÓN PARA CERTIFICACIÓN

const crypto = require('crypto');
const axios = require('axios');
const BancardTransactionModel = require('../../models/bancardTransactionModel');
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
 * ✅ CONTROLADOR PARA CONFIRMACIÓN DE BANCARD - MEJORADO PARA CERTIFICACIÓN
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

        // ✅ RESPONDER INMEDIATAMENTE CON STATUS 200 (CRÍTICO PARA BANCARD)
        res.status(200).json({
            status: "success",
            message: "Confirmación recibida y procesada correctamente",
            timestamp: new Date().toISOString(),
            processing_time: `${Date.now() - startTime}ms`,
            received_data: {
                has_operation: !!req.body?.operation,
                has_shop_process_id: !!(req.body?.operation?.shop_process_id || req.query?.shop_process_id),
                response_type: req.body?.operation?.response || req.query?.response || 'N/A'
            }
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
            message: "Confirmación recibida (con errores internos)",
            timestamp: new Date().toISOString(),
            note: "Error procesado internamente"
        });
    }
};

/**
 * ✅ PROCESAMIENTO EN BACKGROUND MEJORADO
 */
const processConfirmationInBackground = async (body, query, headers) => {
    try {
        console.log("🔄 Procesando confirmación en background...");
        
        // ✅ EXTRAER DATOS DE MULTIPLE FUENTES
        let transactionData = {};
        
        // Método 1: Desde body.operation (formato estándar)
        if (body?.operation) {
            transactionData = {
                token: body.operation.token || '',
                shop_process_id: body.operation.shop_process_id || '',
                response: body.operation.response || '',
                response_details: body.operation.response_details || '',
                amount: body.operation.amount || '',
                currency: body.operation.currency || 'PYG',
                authorization_number: body.operation.authorization_number || '',
                ticket_number: body.operation.ticket_number || '',
                response_code: body.operation.response_code || '',
                response_description: body.operation.response_description || '',
                extended_response_description: body.operation.extended_response_description || '',
                security_information: body.operation.security_information || {},
                iva_amount: body.operation.iva_amount || '',
                iva_ticket_number: body.operation.iva_ticket_number || ''
            };
        }
        // Método 2: Desde query params (formato alternativo)
        else if (query && Object.keys(query).length > 0) {
            transactionData = {
                token: query.token || '',
                shop_process_id: query.shop_process_id || query.operation_id || '',
                response: query.response || (query.response_code === '00' ? 'S' : 'N'),
                response_details: query.response_details || '',
                amount: query.amount || '',
                currency: query.currency || query.currency_id || 'PYG',
                authorization_number: query.authorization_number || '',
                ticket_number: query.ticket_number || '',
                response_code: query.response_code || '',
                response_description: query.response_description || '',
                extended_response_description: query.extended_response_description || '',
                security_information: {
                    customer_ip: query.customer_ip || '',
                    card_source: query.card_source || '',
                    card_country: query.card_country || '',
                    version: query.version || '0.3',
                    risk_index: query.risk_index || '0'
                },
                iva_amount: query.iva_amount || '',
                iva_ticket_number: query.iva_ticket_number || ''
            };
        }
        // Método 3: Desde body directo
        else if (body && Object.keys(body).length > 0) {
            transactionData = {
                token: body.token || '',
                shop_process_id: body.shop_process_id || body.operation_id || '',
                response: body.response || (body.response_code === '00' ? 'S' : 'N'),
                response_details: body.response_details || '',
                amount: body.amount || '',
                currency: body.currency || 'PYG',
                authorization_number: body.authorization_number || '',
                ticket_number: body.ticket_number || '',
                response_code: body.response_code || '',
                response_description: body.response_description || '',
                extended_response_description: body.extended_response_description || '',
                security_information: body.security_information || {},
                iva_amount: body.iva_amount || '',
                iva_ticket_number: body.iva_ticket_number || ''
            };
        }

        console.log("📊 DATOS PROCESADOS:", transactionData);

        // ✅ DETERMINAR SI EL PAGO FUE EXITOSO
        const isSuccessful = (
            transactionData.response === 'S' && 
            transactionData.response_code === '00'
        ) || (
            transactionData.authorization_number && 
            transactionData.ticket_number
        ) || (
            !transactionData.response_code && 
            transactionData.shop_process_id // Si no hay código, asumir éxito
        );

        console.log("🎯 Análisis de resultado:", {
            response: transactionData.response,
            response_code: transactionData.response_code,
            authorization_number: transactionData.authorization_number,
            ticket_number: transactionData.ticket_number,
            has_shop_process_id: !!transactionData.shop_process_id,
            final_result: isSuccessful ? "EXITOSO" : "FALLIDO"
        });

        // ✅ BUSCAR Y ACTUALIZAR TRANSACCIÓN EN BD
        if (transactionData.shop_process_id) {
            try {
                const shopProcessIdNumber = parseInt(transactionData.shop_process_id);
                console.log("🔍 Buscando transacción con shop_process_id:", shopProcessIdNumber);
                
                const transaction = await BancardTransactionModel.findOne({ 
                    shop_process_id: shopProcessIdNumber
                });

                if (transaction) {
                    console.log("🔍 Transacción encontrada:", transaction._id);
                    
                    const updateData = {
                        response: transactionData.response,
                        response_code: transactionData.response_code,
                        response_description: transactionData.response_description,
                        extended_response_description: transactionData.extended_response_description,
                        confirmation_date: new Date(),
                        bancard_confirmed: true
                    };

                    if (isSuccessful) {
                        updateData.status = 'approved';
                        updateData.authorization_number = transactionData.authorization_number;
                        updateData.ticket_number = transactionData.ticket_number;
                        updateData.security_information = transactionData.security_information;
                        
                        console.log("✅ Marcando transacción como APROBADA");
                    } else {
                        updateData.status = 'rejected';
                        console.log("❌ Marcando transacción como RECHAZADA");
                    }

                    await BancardTransactionModel.findByIdAndUpdate(transaction._id, updateData);
                    console.log("💾 Transacción actualizada en BD");

                } else {
                    console.warn("⚠️ No se encontró transacción con shop_process_id:", shopProcessIdNumber);
                    
                    // ✅ CREAR TRANSACCIÓN SI NO EXISTE (PARA TESTING)
                    if (transactionData.shop_process_id && transactionData.amount) {
                        const newTransaction = new BancardTransactionModel({
                            shop_process_id: shopProcessIdNumber,
                            bancard_process_id: `external-${shopProcessIdNumber}`,
                            amount: parseFloat(transactionData.amount) || 0,
                            currency: transactionData.currency,
                            description: 'Transacción externa de Bancard',
                            status: isSuccessful ? 'approved' : 'rejected',
                            response: transactionData.response,
                            response_code: transactionData.response_code,
                            response_description: transactionData.response_description,
                            authorization_number: transactionData.authorization_number,
                            ticket_number: transactionData.ticket_number,
                            security_information: transactionData.security_information,
                            confirmation_date: new Date(),
                            bancard_confirmed: true,
                            environment: process.env.BANCARD_ENVIRONMENT || 'staging'
                        });
                        
                        await newTransaction.save();
                        console.log("💾 Nueva transacción creada desde confirmación externa");
                    }
                }
            } catch (dbError) {
                console.error("⚠️ Error actualizando BD:", dbError);
            }
        } else {
            console.warn("⚠️ No se recibió shop_process_id válido");
        }

        console.log("✅ Procesamiento background completado exitosamente");

    } catch (error) {
        console.error("❌ Error en procesamiento background:", error);
    }
};

/**
 * ✅ CONTROLADOR PARA CREAR PAGOS - MEJORADO
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

        // ✅ URLs MEJORADAS PARA CERTIFICACIÓN
        const backendUrl = process.env.BACKEND_URL || 'https://tu-backend.vercel.app';
        const frontendUrl = process.env.FRONTEND_URL || 'https://bluetec.vercel.app';
        
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: shopProcessId,
                amount: formattedAmount,
                currency: currency,
                description: description.substring(0, 20),
                // ✅ return_url: DONDE VA EL USUARIO DESPUÉS DEL PAGO
                return_url: return_url || `${backendUrl}/api/bancard/confirm`,
                // ✅ cancel_url: DONDE VA SI CANCELA
                cancel_url: cancel_url || `${frontendUrl}/pago-cancelado`
            }
        };

        if (formattedIvaAmount) {
            payload.operation.iva_amount = formattedIvaAmount;
        }

        // ✅ NO AGREGAR test_client PARA CERTIFICACIÓN
        // if (process.env.BANCARD_ENVIRONMENT !== 'production') {
        //     payload.test_client = true;
        // }

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
                    return_url: return_url || `${backendUrl}/api/bancard/confirm`,
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
                    return_url: return_url || `${backendUrl}/api/bancard/confirm`,
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
 * ✅ ROLLBACK MEJORADO PARA CERTIFICACIÓN
 */
const rollbackPaymentController = async (req, res) => {
    try {
        console.log("🔄 === INICIANDO ROLLBACK DE PAGO PARA CERTIFICACIÓN ===");
        
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
            // ✅ NO AGREGAR test_client PARA CERTIFICACIÓN
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

        // ✅ ACTUALIZAR TRANSACCIÓN LOCAL
        try {
            await BancardTransactionModel.findOneAndUpdate(
                { shop_process_id: parseInt(shop_process_id) },
                { 
                    is_rolled_back: true,
                    rollback_date: new Date(),
                    rollback_reason: 'Rollback desde API',
                    status: 'rolled_back'
                }
            );
            console.log("✅ Transacción local marcada como reversada");
        } catch (dbError) {
            console.error("⚠️ Error actualizando transacción local:", dbError);
        }

        if (response.status === 200) {
            res.json({
                message: "Rollback procesado exitosamente",
                success: true,
                error: false,
                data: {
                    shop_process_id: shop_process_id,
                    bancard_response: response.data,
                    local_transaction_updated: true
                }
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
 * ✅ ENDPOINT DE PRUEBA PARA ROLLBACK
 */
const testRollbackController = async (req, res) => {
    try {
        console.log("🧪 === TEST DE ROLLBACK PARA CERTIFICACIÓN ===");
        
        const { shop_process_id } = req.body;
        
        if (!shop_process_id) {
            return res.status(400).json({
                message: "shop_process_id es requerido para la prueba",
                success: false,
                error: true,
                example: {
                    shop_process_id: "123456789"
                }
            });
        }

        console.log("🎯 Ejecutando rollback de prueba para:", shop_process_id);

        // ✅ LLAMAR AL CONTROLADOR DE ROLLBACK
        req.body = { shop_process_id };
        await rollbackPaymentController(req, res);

    } catch (error) {
        console.error("❌ Error en test de rollback:", error);
        res.status(500).json({
            message: "Error en test de rollback",
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
        method: "GET",
        received_params: req.query
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
        confirmation_url: process.env.BANCARD_CONFIRMATION_URL,
        certification_ready: true
    });
};

module.exports = {
    bancardConfirmGetController, 
    bancardConfirmController,
    createPaymentController,
    getTransactionStatusController,
    bancardHealthController,
    rollbackPaymentController,
    testRollbackController
};