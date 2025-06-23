// backend/controller/bancard/bancardController.js - VERSIÓN ACTUALIZADA
const crypto = require('crypto');
const axios = require('axios');
const { 
    verifyConfirmationToken, 
    validateBancardConfig,
    parseAmount,
    generateSingleBuyToken,
    generateShopProcessId,
    generateAlternativeShopProcessId, // ✅ Nueva función alternativa
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
                status: "error",
                message: "Missing operation data",
                timestamp: new Date().toISOString()
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

        // Validar token de seguridad
        if (token && shop_process_id && amount && currency) {
            try {
                const isValidToken = verifyConfirmationToken(token, shop_process_id, amount, currency);
                if (!isValidToken) {
                    console.log("⚠️ WARNING: Token de confirmación inválido");
                } else {
                    console.log("✅ Token de confirmación válido");
                }
            } catch (tokenError) {
                console.log("⚠️ ERROR validando token:", tokenError.message);
            }
        }

        if (response === 'S' && response_code === '00') {
            console.log("✅ PAGO APROBADO:", shop_process_id);
            console.log("   🎫 Autorización:", authorization_number);
            console.log("   🎟️ Ticket:", ticket_number);
            
            // TODO: Aquí implementarías la lógica de tu negocio:
            // 1. Buscar la transacción por shop_process_id
            // 2. Marcar como pagada
            // 3. Crear registro en tu modelo de ventas
            // 4. Actualizar stock
            // 5. Enviar email de confirmación
            
        } else {
            console.log("❌ PAGO RECHAZADO:", shop_process_id);
            console.log("   📝 Motivo:", response_description);
            
            // TODO: Marcar transacción como fallida
        }

        const processingTime = Date.now() - startTime;
        console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);

        // RESPUESTA REQUERIDA POR BANCARD (SIEMPRE 200)
        res.status(200).json({
            status: "success",
            message: "Confirmación procesada correctamente",
            shop_process_id: shop_process_id,
            processed_at: new Date().toISOString(),
            processing_time_ms: processingTime
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error("❌ ERROR PROCESANDO CONFIRMACIÓN:", error);
        
        res.status(200).json({
            status: "error",
            message: "Error interno pero confirmación recibida",
            error: error.message,
            processed_at: new Date().toISOString(),
            processing_time_ms: processingTime
        });
    }
};

/**
 * Controlador para crear un nuevo pago con Bancard
 */
const createPaymentController = async (req, res) => {
    try {
        console.log("🛒 Creando nuevo pago con Bancard...");
        console.log("📦 Request body:", req.body);
        
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
            amount,              // Monto total en guaraníes
            currency = 'PYG',    // Moneda
            description,         // Descripción del pago
            return_url,          // URL de retorno
            cancel_url,          // URL de cancelación
            iva_amount,          // Monto del IVA
            customer_info,       // Información del cliente (opcional)
            items               // Items del carrito (opcional, para logging)
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

        // URLs por defecto si no se proporcionan
        const finalReturnUrl = return_url || `${process.env.FRONTEND_URL}/pago-exitoso`;
        const finalCancelUrl = cancel_url || `${process.env.FRONTEND_URL}/pago-cancelado`;

        // ✅ GENERAR ID ÚNICO MEJORADO
        const shopProcessId = generateShopProcessId();
        
        console.log("🆔 Shop Process ID generado:", shopProcessId);
        
        // Formatear el monto
        const formattedAmount = Number(amount).toFixed(2);
        const formattedIvaAmount = iva_amount ? Number(iva_amount).toFixed(2) : null;
        
        // Generar token de seguridad
        const token = generateSingleBuyToken(shopProcessId, formattedAmount, currency);
        
        console.log("🔐 Datos del pago:");
        console.log("   🆔 Shop Process ID:", shopProcessId);
        console.log("   💰 Monto:", formattedAmount, currency);
        console.log("   🏷️ Descripción:", description);
        console.log("   🔙 Return URL:", finalReturnUrl);
        console.log("   ❌ Cancel URL:", finalCancelUrl);
        console.log("   🔐 Token:", token);

        // Preparar payload para Bancard según su documentación
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

        // Agregar IVA si se proporciona
        if (formattedIvaAmount) {
            payload.operation.iva_amount = formattedIvaAmount;
        }

        console.log("📤 Enviando solicitud a Bancard:");
        console.log(JSON.stringify(payload, null, 2));

        // Hacer petición a Bancard
        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy`;
        console.log("🌐 URL de Bancard:", bancardUrl);
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de Bancard:", response.data);

        if (response.data.status === 'success') {
            console.log("✅ Pago creado exitosamente en Bancard");
            
            // TODO: Guardar la transacción en tu base de datos

            res.json({
                message: "Pago creado exitosamente",
                success: true,
                error: false,
                data: {
                    shop_process_id: shopProcessId,
                    process_id: response.data.process_id,
                    amount: formattedAmount,
                    currency: currency,
                    description: description,
                    // URL para iframe (para uso en frontend)
                    iframe_url: `${getBancardBaseUrl()}/checkout/new/${response.data.process_id}`,
                    // URLs de retorno
                    return_url: finalReturnUrl,
                    cancel_url: finalCancelUrl
                }
            });
        } else {
            console.error("❌ Error en respuesta de Bancard:", response.data);
            
            // ✅ SI HAY ERROR DE SHOP_PROCESS_ID DUPLICADO, INTENTAR CON ALTERNATIVO
            if (response.data.messages && response.data.messages.some(msg => 
                msg.dsc && msg.dsc.includes('Shop process has already been taken'))) {
                
                console.log("🔄 Shop process ID duplicado, intentando con ID alternativo...");
                
                // Generar ID alternativo
                const alternativeId = generateAlternativeShopProcessId();
                const alternativeToken = generateSingleBuyToken(alternativeId, formattedAmount, currency);
                
                payload.operation.shop_process_id = alternativeId;
                payload.operation.token = alternativeToken;
                
                console.log("🔄 Reintentando con ID alternativo:", alternativeId);
                
                const retryResponse = await axios.post(bancardUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'BlueTec-eCommerce/1.0'
                    },
                    timeout: 30000
                });
                
                if (retryResponse.data.status === 'success') {
                    console.log("✅ Pago creado exitosamente con ID alternativo");
                    
                    return res.json({
                        message: "Pago creado exitosamente",
                        success: true,
                        error: false,
                        data: {
                            shop_process_id: alternativeId,
                            process_id: retryResponse.data.process_id,
                            amount: formattedAmount,
                            currency: currency,
                            description: description,
                            iframe_url: `${getBancardBaseUrl()}/checkout/new/${retryResponse.data.process_id}`,
                            return_url: finalReturnUrl,
                            cancel_url: finalCancelUrl
                        }
                    });
                }
            }
            
            res.status(400).json({
                message: "Error al crear el pago en Bancard",
                success: false,
                error: true,
                details: response.data
            });
        }

    } catch (error) {
        console.error("❌ Error creando pago:", error);
        
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            
            res.status(500).json({
                message: "Error en la comunicación con Bancard",
                success: false,
                error: true,
                details: error.response.data
            });
        } else if (error.request) {
            console.error("Network error:", error.message);
            res.status(500).json({
                message: "Error de conexión con el sistema de pagos",
                success: false,
                error: true
            });
        } else {
            res.status(500).json({
                message: "Error interno del servidor",
                success: false,
                error: true,
                details: error.message
            });
        }
    }
};

/**
 * Controlador para consultar el estado de una transacción
 */
const getTransactionStatusController = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log("🔍 Consultando estado de transacción:", transactionId);
        
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        // Generar token para consulta según documentación Bancard
        const token = crypto.createHash('md5')
            .update(`${process.env.BANCARD_PRIVATE_KEY}${transactionId}get_confirmation`)
            .digest('hex');

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
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log("📥 Estado de transacción:", response.data);

        res.json({
            message: "Estado de transacción obtenido",
            success: true,
            error: false,
            data: response.data
        });

    } catch (error) {
        console.error("❌ Error consultando estado:", error);
        res.status(500).json({
            message: "Error al consultar estado de transacción",
            success: false,
            error: true,
            details: error.response?.data || error.message
        });
    }
};

/**
 * Health check para verificar que el endpoint está funcionando
 */
const bancardHealthController = (req, res) => {
    console.log("🏥 Health check de Bancard desde:", req.ip || req.connection.remoteAddress);
    
    const configValidation = validateBancardConfig();
    
    res.status(200).json({
        status: "healthy",
        message: "Endpoint de Bancard funcionando correctamente",
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
    getTransactionStatusController,
    bancardHealthController
};