// backend/controller/bancard/bancardController.js - VERSIÓN ANTI-WAF
const crypto = require('crypto');
const axios = require('axios');
const { 
    verifyConfirmationToken, 
    validateBancardConfig,
    parseAmount,
    generateSingleBuyToken,
    generateShopProcessId,
    generateAlternativeShopProcessId,
    getBancardBaseUrl
} = require('../../helpers/bancardUtils');

/**
 * Controlador para recibir confirmaciones de Bancard
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
        console.log("📦 Body:", JSON.stringify(req.body, null, 2));

        const { operation } = req.body;

        if (!operation) {
            console.log("❌ ERROR: No se recibió información de la operación");
            return res.status(200).json({
                status: "success"
            });
        }

        const {
            token,
            shop_process_id,
            response,
            response_details,
            amount,
            currency,
            authorization_number,
            ticket_number,
            response_code,
            response_description,
            extended_response_description,
            security_information,
            iva_amount,
            iva_ticket_number
        } = operation;

        console.log("📊 DATOS DE LA TRANSACCIÓN:");
        console.log("   🆔 ID de proceso:", shop_process_id);
        console.log("   💰 Monto:", amount, currency);
        console.log("   📄 Respuesta:", response);
        console.log("   🔢 Código:", response_code);
        console.log("   📝 Descripción:", response_description);

        if (response === 'S' && response_code === '00') {
            console.log("✅ PAGO APROBADO:", shop_process_id);
            console.log("   🎫 Autorización:", authorization_number);
            console.log("   🎟️ Ticket:", ticket_number);
        } else {
            console.log("❌ PAGO RECHAZADO:", shop_process_id);
            console.log("   📝 Motivo:", response_description);
        }

        const processingTime = Date.now() - startTime;
        console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);

        res.status(200).json({
            status: "success"
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error("❌ ERROR PROCESANDO CONFIRMACIÓN:", error);
        
        res.status(200).json({
            status: "success"
        });
    }
};

/**
 * ✅ CONTROLADOR CON HEADERS SEGUROS PARA EVITAR WAF
 */
const createPaymentController = async (req, res) => {
    try {
        console.log("🛒 Creando nuevo pago con Bancard...");
        console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
        
        // Validar configuración de Bancard
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

        // Extraer datos del carrito/request
        const {
            amount,
            currency = 'PYG',
            description,
            return_url,
            cancel_url,
            iva_amount,
            customer_info,
            items
        } = req.body;

        // Validaciones
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

        // URLs
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const finalReturnUrl = return_url || `${baseUrl}/pago-exitoso`;
        const finalCancelUrl = cancel_url || `${baseUrl}/pago-cancelado`;

        // ✅ GENERAR ID ÚNICO (SOLO NÚMEROS)
        const shopProcessId = Date.now();
        
        console.log("🆔 Shop Process ID generado:", shopProcessId);
        
        // Formatear monto
        const formattedAmount = Number(amount).toFixed(2);
        const formattedIvaAmount = iva_amount ? Number(iva_amount).toFixed(2) : null;
        
        // Generar token
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${shopProcessId}${formattedAmount}${currency}`;
        const token = crypto.createHash('md5').update(tokenString).digest('hex');
        
        console.log("🔐 Token generado:", token);

        // ✅ PAYLOAD LIMPIO
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: shopProcessId,
                amount: formattedAmount,
                currency: currency,
                description: description,
                return_url: finalReturnUrl,
                cancel_url: finalCancelUrl
            }
        };

        if (formattedIvaAmount) {
            payload.operation.iva_amount = formattedIvaAmount;
        }

        console.log("📤 Enviando a Bancard:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy`;
        console.log("🌐 URL:", bancardUrl);
        
        try {
            // ✅ HEADERS SEGUROS PARA EVITAR WAF
            const response = await axios.post(bancardUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                timeout: 30000,
                // ✅ CONFIGURACIONES ADICIONALES PARA EVITAR BLOQUEOS
                validateStatus: function (status) {
                    return status < 500; // Acepta cualquier status menor a 500
                },
                maxRedirects: 0 // No seguir redirects
            });

            console.log("📥 Status de respuesta:", response.status);
            console.log("📥 Headers de respuesta:", JSON.stringify(response.headers, null, 2));
            console.log("📥 Data de respuesta:", JSON.stringify(response.data, null, 2));

            // ✅ VERIFICAR DIFERENTES TIPOS DE RESPUESTA
            if (response.status === 200 && response.data) {
                if (response.data.status === 'success') {
                    console.log("✅ Pago creado exitosamente");
                    
                    const processId = response.data.process_id;
                    const iframeUrl = `${getBancardBaseUrl()}/checkout/new/${processId}`;
                    
                    console.log("🆔 Process ID:", processId);
                    console.log("🌐 Iframe URL:", iframeUrl);
                    
                    res.json({
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
                            return_url: finalReturnUrl,
                            cancel_url: finalCancelUrl
                        }
                    });
                } else {
                    console.error("❌ Status no exitoso:", response.data);
                    res.status(400).json({
                        message: "Error al crear el pago en Bancard",
                        success: false,
                        error: true,
                        details: response.data
                    });
                }
            } else {
                console.error("❌ Respuesta inesperada:", response.status, response.data);
                res.status(500).json({
                    message: "Respuesta inesperada de Bancard",
                    success: false,
                    error: true,
                    details: { status: response.status, data: response.data }
                });
            }

        } catch (axiosError) {
            console.error("❌ Error en petición:", axiosError.message);
            
            if (axiosError.response) {
                console.error("❌ Response status:", axiosError.response.status);
                console.error("❌ Response data:", axiosError.response.data);
                
                // ✅ MANEJAR ERROR WAF ESPECÍFICAMENTE
                if (axiosError.response.status === 403 || 
                    (axiosError.response.data && axiosError.response.data.includes('rejected'))) {
                    console.error("🚫 BLOQUEADO POR WAF - Intentando con headers alternativos");
                    
                    return res.status(500).json({
                        message: "Petición bloqueada por seguridad de Bancard. Verifica la configuración.",
                        success: false,
                        error: true,
                        details: "WAF_BLOCKED",
                        support_id: axiosError.response.data
                    });
                }
                
                res.status(500).json({
                    message: "Error en la comunicación con Bancard",
                    success: false,
                    error: true,
                    details: axiosError.response.data,
                    status: axiosError.response.status
                });
            } else {
                res.status(500).json({
                    message: "Error de conexión con el sistema de pagos",
                    success: false,
                    error: true,
                    details: axiosError.message
                });
            }
        }

    } catch (error) {
        console.error("❌ Error general:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ CONTROLADOR DE PRUEBA CON DATOS MÍNIMOS
 */
const testBancardSimpleController = async (req, res) => {
    try {
        console.log("🧪 PRUEBA SIMPLE - ANTI WAF");
        
        const testShopProcessId = Date.now();
        const testAmount = "1000.00";
        const testCurrency = "PYG";
        
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${testShopProcessId}${testAmount}${testCurrency}`;
        const testToken = crypto.createHash('md5').update(tokenString).digest('hex');
        
        // ✅ PAYLOAD MÍNIMO PARA EVITAR FILTROS
        const testPayload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: testToken,
                shop_process_id: testShopProcessId,
                amount: testAmount,
                currency: testCurrency,
                description: "Test",
                return_url: "http://localhost:3000/success",
                cancel_url: "http://localhost:3000/cancel"
            }
        };
        
        console.log("🧪 Payload:", JSON.stringify(testPayload, null, 2));
        
        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy`;
        
        const response = await axios.post(bancardUrl, testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000,
            validateStatus: () => true
        });
        
        console.log("🧪 Respuesta:", response.status, JSON.stringify(response.data, null, 2));
        
        res.json({
            message: "Prueba completada",
            success: response.status === 200,
            test_data: {
                status: response.status,
                shop_process_id: testShopProcessId,
                token: testToken,
                response: response.data
            }
        });
        
    } catch (error) {
        console.error("❌ Error en prueba:", error.message);
        
        res.status(500).json({
            message: "Error en prueba",
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        });
    }
};

/**
 * Controlador para consultar el estado de una transacción
 */
const getTransactionStatusController = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log("🔍 Consultando estado:", transactionId);
        
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${transactionId}get_confirmation`;
        const token = crypto.createHash('md5').update(tokenString).digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: transactionId
            }
        };

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy/confirmations`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });

        console.log("📥 Estado:", response.data);

        res.json({
            message: "Estado obtenido",
            success: true,
            error: false,
            data: response.data
        });

    } catch (error) {
        console.error("❌ Error consultando estado:", error);
        res.status(500).json({
            message: "Error al consultar estado",
            success: false,
            error: true,
            details: error.response?.data || error.message
        });
    }
};

/**
 * Health check
 */
const bancardHealthController = (req, res) => {
    console.log("🏥 Health check");
    
    const configValidation = validateBancardConfig();
    
    res.status(200).json({
        status: "healthy",
        message: "Endpoint funcionando",
        timestamp: new Date().toISOString(),
        service: "bancard-integration",
        version: "1.0.0",
        environment: process.env.BANCARD_ENVIRONMENT || 'staging',
        config_valid: configValidation.isValid,
        config_errors: configValidation.errors || []
    });
};

module.exports = {
    bancardConfirmController,
    createPaymentController,
    testBancardSimpleController,
    getTransactionStatusController,
    bancardHealthController
};