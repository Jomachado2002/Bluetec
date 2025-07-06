// backend/controller/bancard/bancardController.js - VERSIÓN CORREGIDA PARA PAGOS OCASIONALES

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
 * ✅ CONTROLADOR MEJORADO PARA CONFIRMACIÓN - CERTIFICACIÓN
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

        // ✅ RESPONDER INMEDIATAMENTE A BANCARD (CRÍTICO PARA CERTIFICACIÓN)
        const responseData = {
            status: "success"
        };

        console.log("📤 Respondiendo a Bancard:", responseData);
        res.status(200).json(responseData);

        // ✅ PROCESAR EN BACKGROUND (NO AFECTA LA RESPUESTA A BANCARD)
        setImmediate(() => {
            processConfirmationInBackground(req.body, req.query, req.headers, req.ip);
        });

    } catch (error) {
        console.error("❌ ERROR EN CONFIRMACIÓN:", error);
        
        // ✅ SIEMPRE RESPONDER 200 A BANCARD AUNQUE HAYA ERROR
        res.status(200).json({
            status: "success", 
            message: "Confirmación recibida",
            timestamp: new Date().toISOString(),
            note: "Procesando"
        });
    }
};

const bancardConfirmGetController = (req, res) => {
    try {
        console.log("🔍 === GET REQUEST A CONFIRMACIÓN BANCARD ===");
        console.log("Query params:", req.query);
        console.log("Headers:", req.headers);
        console.log("URL completa:", req.originalUrl);
        console.log("IP origen:", req.ip);
        
        // Bancard hace GET para verificar conectividad
        res.status(200).json({
            status: "success",
            message: "Endpoint de confirmación activo y funcionando",
            timestamp: new Date().toISOString(),
            service: "bancard-confirmation",
            method: "GET",
            ready: true,
            environment: process.env.BANCARD_ENVIRONMENT || 'staging'
        });
        
    } catch (error) {
        console.error("❌ Error en GET confirmación:", error);
        res.status(200).json({
            status: "success",
            message: "Endpoint funcionando",
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * ✅ NUEVA FUNCIÓN PARA PROCESAR EN BACKGROUND
 */
const processConfirmationInBackground = async (body, query, headers, clientIp) => {
    try {
        console.log("🔄 Procesando confirmación en background...");
        
        // ✅ EXTRAER DATOS DE QUERY PARAMS (URL) Y BODY
        const queryParams = query || {};
        const { operation } = body || {};
        
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
        };

        console.log("📊 DATOS PROCESADOS:", transactionData);

        // ✅ DETERMINAR SI EL PAGO FUE EXITOSO
        const isSuccessful = (transactionData.response === 'S' && transactionData.response_code === '00') ||
                           queryParams.status === 'success' ||
                           (transactionData.authorization_number && transactionData.ticket_number);

        console.log("🎯 Resultado:", isSuccessful ? "EXITOSO" : "FALLIDO");

        // ✅ BUSCAR Y ACTUALIZAR TRANSACCIÓN
        if (transactionData.shop_process_id) {
            try {
                const transaction = await BancardTransactionModel.findOne({ 
                    shop_process_id: parseInt(transactionData.shop_process_id) 
                });
                
                console.log(`🔍 Buscando transacción: ${transactionData.shop_process_id}`, {
                    found: !!transaction,
                    isTokenPayment: transaction?.is_token_payment || false,
                    currentStatus: transaction?.status
                });

                if (transaction) {
                    if (isSuccessful) {
                        await BancardTransactionModel.findByIdAndUpdate(transaction._id, {
                            status: 'approved',
                            response: transactionData.response,
                            response_code: transactionData.response_code,
                            response_description: transactionData.response_description,
                            authorization_number: transactionData.authorization_number,
                            ticket_number: transactionData.ticket_number,
                            security_information: transactionData.security_information || {},
                            confirmation_date: new Date(),
                            extended_response_description: transactionData.extended_response_description,
                            bancard_confirmed: true
                        });

                        if (transaction.sale_id) {
                            await SaleModel.findByIdAndUpdate(transaction.sale_id, {
                                paymentStatus: 'pagado',
                                authorization_number: transactionData.authorization_number,
                                ticket_number: transactionData.ticket_number,
                                notes: `${transaction.notes || ''}\nPago aprobado - Auth: ${transactionData.authorization_number}`
                            });
                        }
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

                        if (transaction.sale_id) {
                            await SaleModel.findByIdAndUpdate(transaction.sale_id, {
                                paymentStatus: 'failed',
                                notes: `${transaction.notes || ''}\nPago rechazado: ${transactionData.response_description}`
                            });
                        }
                        console.log("❌ Transacción RECHAZADA y actualizada");
                    }
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
 * ✅ CONTROLADOR PARA CREAR PAGOS OCASIONALES - CORREGIDO PARA IFRAME
 */
const createPaymentController = async (req, res) => {
    try {
        console.log("🛒 === INICIO PROCESO DE PAGO OCASIONAL BANCARD ===");
        console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
        console.log("👤 Usuario autenticado:", req.isAuthenticated);
        console.log("🆔 User ID:", req.userId);
        
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
            customer_info,
            items,
            sale_id,
            // ✅ CAMPOS DE TRACKING
            user_type = 'GUEST',
            payment_method = 'new_card',
            user_bancard_id = null,
            user_agent = '',
            payment_session_id = '',
            device_type = 'unknown',
            cart_total_items = 0,
            referrer_url = '',
            order_notes = '',
            delivery_method = 'pickup',
            invoice_number = '',
            tax_amount = 0,
            utm_source = '',
            utm_medium = '',
            utm_campaign = ''
        } = req.body;

        // ✅ DECLARAR VARIABLES DE TRACKING AL INICIO
        const finalUserType = req.isAuthenticated ? 'REGISTERED' : 'GUEST';
        const finalUserBancardId = req.isAuthenticated ? (req.bancardUserId || req.user?.bancardUserId) : null;
        const clientIpAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        console.log("🔍 Variables de tracking declaradas:", {
            finalUserType,
            finalUserBancardId,
            clientIpAddress,
            isAuthenticated: req.isAuthenticated,
            userId: req.userId
        });

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
        
        console.log("💰 Montos formateados:", {
            amount: formattedAmount,
        });
        
        const token = generateSingleBuyToken(shopProcessId, formattedAmount, currency);

        // ✅ OBTENER URL DEL BACKEND PARA REDIRECCIONES SINCRONIZADAS
        const backendUrl = process.env.BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'https://bluetec.vercel.app';
        console.log("🔗 Backend URL para redirecciones:", backendUrl);

        // ✅ PAYLOAD CORREGIDO PARA PAGO OCASIONAL (SIN test_client)
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: shopProcessId,
                amount: formattedAmount,
                currency: currency,
                description: description.substring(0, 20),
                // ✅ URLs del FRONTEND para que el usuario vea el resultado
                return_url: `${process.env.FRONTEND_URL}/pago-exitoso`,
                cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado`,
            }
        };

        console.log("📤 Payload para Bancard (PAGO OCASIONAL):", JSON.stringify(payload, null, 2));

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
                console.log("✅ Pago ocasional creado exitosamente en Bancard");
                
                const processId = response.data.process_id;
                const iframeUrl = `${getBancardBaseUrl()}/checkout/javascript/dist/bancard-checkout-4.0.0.js`;

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
                        return_url: `${process.env.FRONTEND_URL}/pago-exitoso`,
                        cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado`,
                        status: 'pending',
                        environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                        sale_id: sale_id || null,
                        created_by: req.userId || null,
                        is_certification_test: false, // ✅ NO es test, es pago real
                        
                        // ✅ CAMPOS DE TRACKING
                        user_type: finalUserType,
                        payment_method: payment_method,
                        user_bancard_id: finalUserBancardId,
                        ip_address: clientIpAddress,
                        user_agent: user_agent,
                        payment_session_id: payment_session_id,
                        device_type: device_type,
                        cart_total_items: cart_total_items,
                        referrer_url: referrer_url,
                        order_notes: order_notes,
                        delivery_method: delivery_method,
                        invoice_number: invoice_number,
                        tax_amount: parseFloat(tax_amount) || 0,
                        utm_source: utm_source,
                        utm_medium: utm_medium,
                        utm_campaign: utm_campaign,
                        
                        // ✅ CAMPOS ESPECÍFICOS PARA PAGO OCASIONAL
                        is_token_payment: false,
                        alias_token: null
                    });

                    await newTransaction.save();
                    console.log("✅ Transacción de pago ocasional guardada en BD:", newTransaction._id);

                    if (sale_id) {
                        await SaleModel.findByIdAndUpdate(sale_id, {
                            paymentStatus: 'processing',
                            bancard_transaction_id: newTransaction._id,
                            notes: `${sale_id.notes || ''}\nTransacción Bancard iniciada: ${shopProcessId}`
                        });
                        console.log("✅ Venta actualizada con transacción Bancard");
                    }

                } catch (dbError) {
                    console.error("⚠️ Error guardando transacción en BD:", dbError);
                }
                
                console.log("🔗 URLs generadas:", {
                    process_id: processId,
                    iframe_script_url: iframeUrl
                });
                
                return res.json({
                    message: "Pago ocasional creado exitosamente",
                    success: true,
                    error: false,
                    data: {
                        shop_process_id: shopProcessId,
                        process_id: processId,
                        amount: formattedAmount,
                        currency: currency,
                        description: description,
                        
                        // ✅ DATOS PARA EL IFRAME SEGÚN DOCUMENTACIÓN BANCARD
                        iframe_config: {
                            script_url: iframeUrl,
                            process_id: processId,
                            container_id: 'bancard-iframe-container',
                            // ✅ CONFIGURACIÓN SEGÚN LA DOCUMENTACIÓN
                            initialization_code: `
                                window.onload = function() {
                                    Bancard.Checkout.createForm('bancard-iframe-container', '${processId}', {
                                        'form-background-color': '#ffffff',
                                        'button-background-color': '#2A3190',
                                        'button-text-color': '#ffffff',
                                        'button-border-color': '#2A3190',
                                        'input-background-color': '#ffffff',
                                        'input-text-color': '#555555',
                                        'input-placeholder-color': '#999999'
                                    });
                                };
                            `
                        },
                        
                        // ✅ URLs FINALES PARA EL USUARIO
                        return_url: `${process.env.FRONTEND_URL}/pago-exitoso`,
                        cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado`,
                        
                        bancard_config: {
                            environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                            base_url: getBancardBaseUrl(),
                            certification_mode: false // ✅ NO es certificación
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
 * ✅ CONTROLADOR PARA CONSULTAR ESTADO (Get Buy Single Confirmation)
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

        // ✅ GENERAR TOKEN PARA CONSULTA según documentación
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
 * ✅ CONTROLADOR PARA ROLLBACK (Single Buy Rollback)
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

        console.log("🔄 Procesando rollback para:", shop_process_id);

        // ✅ GENERAR TOKEN PARA ROLLBACK según documentación
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

        // ✅ ACTUALIZAR EN BASE DE DATOS SI ES EXITOSO
        if (response.status === 200 && response.data.status === 'success') {
            try {
                await BancardTransactionModel.findOneAndUpdate(
                    { shop_process_id: parseInt(shop_process_id) },
                    {
                        is_rolled_back: true,
                        rollback_date: new Date(),
                        rollback_reason: 'Rollback solicitado',
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
        config_details: configValidation.config
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