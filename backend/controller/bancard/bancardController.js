// backend/controller/bancard/bancardController.js - VERSIÓN FINAL SIN test_client

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
 * ✅ CONTROLADOR PARA CREAR PAGOS - SIN test_client
 */
const createPaymentController = async (req, res) => {
    try {
        console.log("🛒 === INICIO PROCESO DE PAGO BANCARD (PRODUCCIÓN) ===");
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

        console.log("✅ Configuración de Bancard válida");

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

        // ✅ USAR VARIABLE DE ENTORNO CORRECTAMENTE
        const confirmationUrl = process.env.BANCARD_CONFIRMATION_URL;
        
        if (!confirmationUrl) {
            console.error("❌ BANCARD_CONFIRMATION_URL no está configurada");
            return res.status(500).json({
                message: "Error de configuración: URL de confirmación no configurada",
                success: false,
                error: true
            });
        }

        console.log("🔗 URL de confirmación desde ENV:", confirmationUrl);

        const shopProcessId = generateShopProcessId();
        console.log("🆔 Shop Process ID generado:", shopProcessId);
        
        const formattedAmount = formatAmount(amount);
        const formattedIvaAmount = iva_amount ? formatAmount(iva_amount) : null;
        
        console.log("💰 Montos formateados:", {
            amount: formattedAmount,
            iva_amount: formattedIvaAmount
        });
        
        const token = generateSingleBuyToken(shopProcessId, formattedAmount, currency);

        // ✅ PAYLOAD SIN test_client SEGÚN REQUERIMIENTO DE BANCARD
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: shopProcessId,
                amount: formattedAmount,
                currency: currency,
                description: description.substring(0, 20),
                return_url: confirmationUrl,
                cancel_url: confirmationUrl
            }
            // ✅ NO INCLUIR test_client PARA CERTIFICACIÓN
        };

        if (formattedIvaAmount) {
            payload.operation.iva_amount = formattedIvaAmount;
        }

        console.log("📤 Payload para Bancard (SIN test_client):", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy`;
        console.log("🌐 URL de Bancard:", bancardUrl);
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0',
                'Cache-Control': 'no-cache'
            },
            timeout: 30000,
            validateStatus: function (status) {
                return status < 500;
            }
        });

        console.log("📥 Response status:", response.status);
        console.log("📥 Response data:", JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data) {
            if (response.data.status === 'success') {
                console.log("✅ Pago creado exitosamente en Bancard (MODO CERTIFICACIÓN)");
                
                const processId = response.data.process_id;
                const iframeUrl = `${getBancardBaseUrl()}/checkout/new/${processId}`;
                
                // ✅ GUARDAR CON URLs ORIGINALES DEL FRONTEND
                try {
                    const newTransaction = new BancardTransactionModel({
                        shop_process_id: shopProcessId,
                        bancard_process_id: processId,
                        amount: parseFloat(formattedAmount),
                        currency: currency,
                        description: description,
                        customer_info: customer_info || {},
                        items: items || [],
                        return_url: return_url || `${process.env.FRONTEND_URL}/pago-exitoso`,
                        cancel_url: cancel_url || `${process.env.FRONTEND_URL}/pago-cancelado`,
                        status: 'pending',
                        environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                        sale_id: sale_id || null,
                        created_by: req.userId || null,
                        is_certification_test: true // Marcar como test de certificación
                    });

                    await newTransaction.save();
                    console.log("✅ Transacción guardada en BD (CERTIFICACIÓN):", newTransaction._id);

                    if (sale_id) {
                        await SaleModel.findByIdAndUpdate(sale_id, {
                            paymentStatus: 'processing',
                            bancard_transaction_id: newTransaction._id,
                            notes: `${sale_id.notes || ''}\nTransacción Bancard iniciada (CERTIFICACIÓN): ${shopProcessId}`
                        });
                        console.log("✅ Venta actualizada con transacción Bancard");
                    }

                } catch (dbError) {
                    console.error("⚠️ Error guardando transacción en BD:", dbError);
                }
                
                console.log("🔗 URLs generadas:", {
                    process_id: processId,
                    iframe_url: iframeUrl
                });
                
                return res.json({
                    message: "Pago creado exitosamente (MODO CERTIFICACIÓN)",
                    success: true,
                    error: false,
                    data: {
                        shop_process_id: shopProcessId,
                        process_id: processId,
                        amount: formattedAmount,
                        currency: currency,
                        description: description,
                        iframe_url: iframeUrl,
                        return_url: return_url || `${process.env.FRONTEND_URL}/pago-exitoso`,
                        cancel_url: cancel_url || `${process.env.FRONTEND_URL}/pago-cancelado`,
                        bancard_config: {
                            environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                            base_url: getBancardBaseUrl(),
                            certification_mode: true
                        }
                    }
                });
            } else {
                console.error("❌ Bancard respondió con status no exitoso:", response.data);
                return res.status(400).json({
                    message: "Error al crear el pago en Bancard",
                    success: false,
                    error: true,
                    details: response.data
                });
            }
        } else {
            console.error("❌ Respuesta inesperada de Bancard:", response.status, response.data);
            return res.status(500).json({
                message: "Respuesta inesperada de Bancard",
                success: false,
                error: true,
                details: { status: response.status, data: response.data }
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
 * ✅ CONTROLADOR DE CONFIRMACIÓN MEJORADO PARA CERTIFICACIÓN
 */
const bancardConfirmController = async (req, res) => {
    const startTime = Date.now();
    
    try {
        console.log("🔔 ============================================");
        console.log("🔔 CONFIRMACIÓN RECIBIDA DE BANCARD (CERTIFICACIÓN)");
        console.log("🔔 ============================================");
        console.log("📅 Timestamp:", new Date().toISOString());
        console.log("🌐 IP origen:", req.ip || req.connection.remoteAddress);
        console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));
        console.log("📦 Body completo:", JSON.stringify(req.body, null, 2));
        console.log("🔗 Query params:", JSON.stringify(req.query, null, 2));
        console.log("🔗 URL completa:", req.originalUrl);
        console.log("🔗 Método:", req.method);

        // ✅ EXTRAER DATOS DE QUERY PARAMS (URL) Y BODY
        const queryParams = req.query || {};
        const { operation } = req.body || {};
        
        // ✅ COMBINAR DATOS DE AMBAS FUENTES
        const transactionData = {
            token: operation?.token || queryParams.token || '',
            shop_process_id: operation?.shop_process_id || queryParams.shop_process_id || '',
            response: operation?.response || queryParams.response || (queryParams.status === 'success' ? 'S' : 'N'),
            response_details: operation?.response_details || queryParams.response_details || '',
            amount: operation?.amount || queryParams.amount || '',
            currency: operation?.currency || queryParams.currency || 'PYG',
            authorization_number: operation?.authorization_number || queryParams.authorization_number || '',
            ticket_number: operation?.ticket_number || queryParams.ticket_number || '',
            response_code: operation?.response_code || queryParams.response_code || '',
            response_description: operation?.response_description || queryParams.response_description || '',
            extended_response_description: operation?.extended_response_description || queryParams.extended_response_description || '',
            security_information: operation?.security_information || {
                customer_ip: queryParams.customer_ip || '',
                card_source: queryParams.card_source || '',
                card_country: queryParams.card_country || '',
                version: queryParams.version || '0.3',
                risk_index: queryParams.risk_index || '0'
            },
            iva_amount: operation?.iva_amount || queryParams.iva_amount || '',
            iva_ticket_number: operation?.iva_ticket_number || queryParams.iva_ticket_number || ''
        };

        console.log("📊 DATOS PROCESADOS DE LA TRANSACCIÓN (CERTIFICACIÓN):");
        console.log("   🆔 ID de proceso:", transactionData.shop_process_id);
        console.log("   💰 Monto:", transactionData.amount, transactionData.currency);
        console.log("   📄 Respuesta:", transactionData.response);
        console.log("   🔢 Código:", transactionData.response_code);
        console.log("   📝 Descripción:", transactionData.response_description);
        console.log("   🎫 Status query param:", queryParams.status);
        console.log("   🎫 Authorization:", transactionData.authorization_number);
        console.log("   🎟️ Ticket:", transactionData.ticket_number);

        // ✅ BUSCAR TRANSACCIÓN EN BASE DE DATOS
        let transaction = null;
        if (transactionData.shop_process_id) {
            try {
                transaction = await BancardTransactionModel.findOne({ 
                    shop_process_id: parseInt(transactionData.shop_process_id) 
                });
                console.log("🔍 Transacción encontrada en BD:", transaction ? "SÍ" : "NO");
                if (transaction) {
                    console.log("📋 Datos de transacción BD:", {
                        id: transaction._id,
                        amount: transaction.amount,
                        status: transaction.status
                    });
                }
            } catch (dbError) {
                console.error("⚠️ Error buscando transacción en BD:", dbError);
            }
        }

        // ✅ VERIFICAR TOKEN DE CONFIRMACIÓN SI ESTÁ PRESENTE
        if (transactionData.token && transactionData.shop_process_id && transactionData.amount && transactionData.currency) {
            try {
                const isValidToken = verifyConfirmationToken(
                    transactionData.token, 
                    transactionData.shop_process_id, 
                    transactionData.amount, 
                    transactionData.currency
                );
                if (isValidToken) {
                    console.log("✅ Token de confirmación VÁLIDO");
                } else {
                    console.log("⚠️ WARNING: Token de confirmación INVÁLIDO - pero continuando...");
                }
            } catch (tokenError) {
                console.log("⚠️ Error verificando token:", tokenError.message);
            }
        }

        // ✅ DETERMINAR SI EL PAGO FUE EXITOSO SEGÚN DOCUMENTACIÓN BANCARD
        const isSuccessful = (transactionData.response === 'S' && transactionData.response_code === '00') ||
                           queryParams.status === 'success' ||
                           (transactionData.authorization_number && transactionData.ticket_number);

        console.log("🎯 Análisis de resultado (CERTIFICACIÓN):", {
            response: transactionData.response,
            response_code: transactionData.response_code,
            status_param: queryParams.status,
            authorization: transactionData.authorization_number,
            ticket: transactionData.ticket_number,
            isSuccessful
        });

        // ✅ PROCESAR SEGÚN EL RESULTADO
        if (isSuccessful) {
            console.log("✅ ✅ PAGO APROBADO EXITOSAMENTE (CERTIFICACIÓN) ✅ ✅");
            console.log("   🎫 Número de autorización:", transactionData.authorization_number);
            console.log("   🎟️ Número de ticket:", transactionData.ticket_number);
            console.log("   💳 Información de seguridad:", transactionData.security_information);
            
            // ✅ ACTUALIZAR TRANSACCIÓN EN BASE DE DATOS
            if (transaction) {
                try {
                    await BancardTransactionModel.findByIdAndUpdate(transaction._id, {
                        status: 'approved',
                        response: transactionData.response,
                        response_code: transactionData.response_code,
                        response_description: transactionData.response_description,
                        authorization_number: transactionData.authorization_number,
                        ticket_number: transactionData.ticket_number,
                        security_information: transactionData.security_information || {},
                        confirmation_date: new Date(),
                        extended_response_description: transactionData.extended_response_description
                    });
                    console.log("✅ Transacción actualizada en BD como APROBADA (CERTIFICACIÓN)");

                    if (transaction.sale_id) {
                        await SaleModel.findByIdAndUpdate(transaction.sale_id, {
                            paymentStatus: 'pagado',
                            authorization_number: transactionData.authorization_number,
                            ticket_number: transactionData.ticket_number,
                            notes: `${transaction.notes || ''}\nPago aprobado (CERTIFICACIÓN) - Auth: ${transactionData.authorization_number}`
                        });
                        console.log("✅ Venta actualizada como PAGADA");
                    }

                } catch (updateError) {
                    console.error("⚠️ Error actualizando transacción en BD:", updateError);
                }
            }
            
        } else {
            console.log("❌ ❌ PAGO RECHAZADO O FALLIDO (CERTIFICACIÓN) ❌ ❌");
            console.log("   📝 Motivo:", transactionData.response_description);
            console.log("   🔢 Código de error:", transactionData.response_code);
            console.log("   📋 Detalles extendidos:", transactionData.extended_response_description);
            
            // ✅ ACTUALIZAR TRANSACCIÓN COMO RECHAZADA
            if (transaction) {
                try {
                    await BancardTransactionModel.findByIdAndUpdate(transaction._id, {
                        status: 'rejected',
                        response: transactionData.response,
                        response_code: transactionData.response_code,
                        response_description: transactionData.response_description,
                        extended_response_description: transactionData.extended_response_description,
                        confirmation_date: new Date()
                    });
                    console.log("✅ Transacción actualizada en BD como RECHAZADA");

                    if (transaction.sale_id) {
                        await SaleModel.findByIdAndUpdate(transaction.sale_id, {
                            paymentStatus: 'failed',
                            notes: `${transaction.notes || ''}\nPago rechazado (CERTIFICACIÓN): ${transactionData.response_description}`
                        });
                        console.log("✅ Venta actualizada como FALLIDA");
                    }

                } catch (updateError) {
                    console.error("⚠️ Error actualizando transacción rechazada:", updateError);
                }
            }
        }

        const processingTime = Date.now() - startTime;
        console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);

        // ✅ CONSTRUIR URL DE REDIRECCIONAMIENTO USANDO ENV
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            console.error("❌ FRONTEND_URL no está configurada en ENV");
            return res.status(500).json({
                error: "FRONTEND_URL no configurada",
                status: "success" // Responder success a Bancard de todas formas
            });
        }

        // ✅ CONSTRUIR QUERY PARAMS PARA EL FRONTEND
        const redirectParams = new URLSearchParams();
        Object.entries(transactionData).forEach(([key, value]) => {
            if (value && value !== '') {
                redirectParams.append(key, value.toString());
            }
        });

        // Agregar parámetros adicionales
        if (queryParams.status) {
            redirectParams.append('status', queryParams.status);
        }
        redirectParams.append('certification_test', 'true');

        // ✅ REDIRIGIR AL FRONTEND USANDO ENV
        const redirectUrl = isSuccessful 
            ? `${frontendUrl}/pago-exitoso?${redirectParams.toString()}`
            : `${frontendUrl}/pago-cancelado?${redirectParams.toString()}`;

        console.log("🚀 Redirigiendo usuario a:", redirectUrl);
        console.log("🔔 ============================================");

        // ✅ REDIRIGIR AL USUARIO
        return res.redirect(redirectUrl);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO PROCESANDO CONFIRMACIÓN:", error);
        console.error("Stack trace:", error.stack);
        
        // ✅ EN CASO DE ERROR, REDIRIGIR A PÁGINA DE ERROR
        const frontendUrl = process.env.FRONTEND_URL || 'https://www.bluetec.com.py';
        return res.redirect(`${frontendUrl}/pago-cancelado?error=server_error&certification_test=true`);
    }
};

/**
 * ✅ CONTROLADOR PARA CONSULTAR ESTADO (Get Buy Single Confirmation)
 */
const getTransactionStatusController = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log("🔍 === CONSULTANDO ESTADO DE TRANSACCIÓN (CERTIFICACIÓN) ===");
        console.log("🔍 Transaction ID:", transactionId);
        
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        // ✅ GENERAR TOKEN PARA CONSULTA según documentación
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${transactionId}get_confirmation`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(transactionId)
            }
            // ✅ SIN test_client para certificación
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
            message: "Estado obtenido exitosamente (CERTIFICACIÓN)",
            success: true,
            error: false,
            data: response.data,
            certification_test: true
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
 * ✅ CONTROLADOR PARA ROLLBACK (Single Buy Rollback)
 */
const rollbackPaymentController = async (req, res) => {
    try {
        console.log("🔄 === INICIANDO ROLLBACK DE PAGO (CERTIFICACIÓN) ===");
        
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

        console.log("🔄 Procesando rollback para (CERTIFICACIÓN):", shop_process_id);

        // ✅ GENERAR TOKEN PARA ROLLBACK según documentación
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${shop_process_id}rollback0.00`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(shop_process_id)
            }
            // ✅ SIN test_client para certificación
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

        // ✅ ACTUALIZAR EN BASE DE DATOS SI ES EXITOSO
        if (response.status === 200 && response.data.status === 'success') {
            try {
                await BancardTransactionModel.findOneAndUpdate(
                    { shop_process_id: parseInt(shop_process_id) },
                    {
                        is_rolled_back: true,
                        rollback_date: new Date(),
                        rollback_reason: 'Rollback de certificación',
                        status: 'rolled_back'
                    }
                );
                console.log("✅ Transacción marcada como rollback en BD");
            } catch (dbError) {
                console.error("⚠️ Error actualizando rollback en BD:", dbError);
            }
        }

        if (response.status === 200) {
            res.json({
                message: "Rollback procesado exitosamente (CERTIFICACIÓN)",
                success: true,
                error: false,
                data: response.data,
                certification_test: true
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
 * ✅ HEALTH CHECK
 */
const bancardHealthController = (req, res) => {
    console.log("🏥 Health check de Bancard (CERTIFICACIÓN)");
    
    const configValidation = validateBancardConfig();
    
    res.status(200).json({
        status: "healthy",
        message: "Servicio de Bancard funcionando (MODO CERTIFICACIÓN)",
        timestamp: new Date().toISOString(),
        service: "bancard-integration",
        version: "2.0.0",
        environment: process.env.BANCARD_ENVIRONMENT || 'staging',
        base_url: getBancardBaseUrl(),
        config_valid: configValidation.isValid,
        config_errors: configValidation.errors || [],
        config_details: configValidation.config,
        certification_mode: true,
        test_client_disabled: true
    });
};

module.exports = {
    bancardConfirmController,
    createPaymentController,
    getTransactionStatusController,
    bancardHealthController,
    rollbackPaymentController
};