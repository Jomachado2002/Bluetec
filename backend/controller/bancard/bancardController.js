// backend/controller/bancard/bancardController.js - VERSIÓN CORREGIDA
const crypto = require('crypto');
const axios = require('axios');
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
 * ✅ CONTROLADOR PRINCIPAL PARA CREAR PAGOS
 */
const createPaymentController = async (req, res) => {
    try {
        console.log("🛒 === INICIO PROCESO DE PAGO BANCARD ===");
        console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
        
        // ✅ 1. Validar configuración de Bancard
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

        // ✅ 2. Extraer y validar datos del request
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

        // ✅ 3. Validaciones de datos
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

        // ✅ 4. Configurar URLs (usar la URL de tu frontend)
        const baseUrl = process.env.FRONTEND_URL || 'https://bluetec.vercel.app';
        const finalReturnUrl = return_url || `${baseUrl}/pago-exitoso`;
        const finalCancelUrl = cancel_url || `${baseUrl}/pago-cancelado`;

        console.log("🔗 URLs configuradas:", {
            return_url: finalReturnUrl,
            cancel_url: finalCancelUrl
        });

        // ✅ 5. Generar ID único NUMÉRICO
        const shopProcessId = generateShopProcessId();
        console.log("🆔 Shop Process ID generado:", shopProcessId);
        
        // ✅ 6. Formatear monto
        const formattedAmount = formatAmount(amount);
        const formattedIvaAmount = iva_amount ? formatAmount(iva_amount) : null;
        
        console.log("💰 Montos formateados:", {
            amount: formattedAmount,
            iva_amount: formattedIvaAmount
        });
        
        // ✅ 7. Generar token MD5
        const token = generateSingleBuyToken(shopProcessId, formattedAmount, currency);

        // ✅ 8. Preparar payload para Bancard
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: shopProcessId,
                amount: formattedAmount,
                currency: currency,
                description: description.substring(0, 20), // Máximo 20 caracteres
                return_url: finalReturnUrl,
                cancel_url: finalCancelUrl
            },
            // ✅ AGREGAR PARA TESTING EN STAGING
            test_client: process.env.BANCARD_ENVIRONMENT === 'staging'};

        // Agregar IVA si está presente
        if (formattedIvaAmount) {
            payload.operation.iva_amount = formattedIvaAmount;
        }

        console.log("📤 Payload para Bancard:", JSON.stringify(payload, null, 2));

        // ✅ 9. Hacer llamada a Bancard
        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy`;
        console.log("🌐 URL de Bancard:", bancardUrl);
        
        try {
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

            // ✅ 10. Procesar respuesta de Bancard
            if (response.status === 200 && response.data) {
                if (response.data.status === 'success') {
                    console.log("✅ Pago creado exitosamente en Bancard");
                    
                    const processId = response.data.process_id;
                    
                    // ✅ CONSTRUIR URL DEL IFRAME CORRECTA
                    const iframeUrl = `${getBancardBaseUrl()}/checkout/new/${processId}`;
                    
                    console.log("🔗 URLs generadas:", {
                        process_id: processId,
                        iframe_url: iframeUrl
                    });
                    
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
                            return_url: finalReturnUrl,
                            cancel_url: finalCancelUrl,
                            // ✅ DATOS ADICIONALES PARA EL FRONTEND
                            bancard_config: {
                                environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                                base_url: getBancardBaseUrl()
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

        } catch (axiosError) {
            console.error("❌ Error en petición a Bancard:", axiosError.message);
            
            if (axiosError.response) {
                console.error("❌ Response status:", axiosError.response.status);
                console.error("❌ Response data:", axiosError.response.data);
                
                return res.status(500).json({
                    message: "Error en la comunicación con Bancard",
                    success: false,
                    error: true,
                    details: axiosError.response.data,
                    status_code: axiosError.response.status
                });
            } else {
                return res.status(500).json({
                    message: "Error de conexión con el sistema de pagos",
                    success: false,
                    error: true,
                    details: axiosError.message
                });
            }
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
 * ✅ CONTROLADOR MEJORADO PARA RECIBIR CONFIRMACIONES DE BANCARD
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
            // ✅ RESPONDER INMEDIATAMENTE CON ÉXITO PARA BANCARD
            return res.status(200).json({ status: "success" });
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

        // ✅ VERIFICAR TOKEN DE CONFIRMACIÓN SI ESTÁ PRESENTE
        if (token && shop_process_id && amount && currency) {
            try {
                const isValidToken = verifyConfirmationToken(token, shop_process_id, amount, currency);
                if (isValidToken) {
                    console.log("✅ Token de confirmación VÁLIDO");
                } else {
                    console.log("⚠️ WARNING: Token de confirmación INVÁLIDO - pero continuando...");
                }
            } catch (tokenError) {
                console.log("⚠️ Error verificando token:", tokenError.message);
            }
        }

        // ✅ PROCESAR SEGÚN EL RESULTADO
        if (response === 'S' && response_code === '00') {
            console.log("✅ ✅ PAGO APROBADO EXITOSAMENTE ✅ ✅");
            console.log("   🎫 Número de autorización:", authorization_number);
            console.log("   🎟️ Número de ticket:", ticket_number);
            console.log("   🛡️ Información de seguridad:", security_information);
            
            // ✅ AQUÍ PUEDES AGREGAR TU LÓGICA DE NEGOCIO:
            // - Actualizar base de datos
            // - Marcar orden como pagada
            // - Enviar email de confirmación
            // - Actualizar inventario
            // - Enviar notificaciones
            
            // Ejemplo de lógica que podrías agregar:
            try {
                // await updateOrderStatus(shop_process_id, 'paid');
                // await sendConfirmationEmail(customer_email);
                // await updateInventory(items);
                console.log("💾 Procesamiento interno completado para:", shop_process_id);
            } catch (processingError) {
                console.error("⚠️ Error en procesamiento interno:", processingError);
                // Nota: Aún así debemos responder éxito a Bancard
            }
            
        } else if (response === 'N' || response_code !== '00') {
            console.log("❌ ❌ PAGO RECHAZADO ❌ ❌");
            console.log("   📝 Motivo:", response_description);
            console.log("   🔢 Código de error:", response_code);
            console.log("   📋 Detalles extendidos:", extended_response_description);
            
            // ✅ LÓGICA PARA PAGOS RECHAZADOS:
            // - Marcar orden como fallida
            // - Enviar notificación de pago fallido
            // - Liberar inventario reservado
            
        } else {
            console.log("⚠️ ESTADO DE PAGO DESCONOCIDO");
            console.log("   Response:", response);
            console.log("   Response code:", response_code);
        }

        const processingTime = Date.now() - startTime;
        console.log(`⏱️ Tiempo de procesamiento: ${processingTime}ms`);
        console.log("🔔 ============================================");

        // ✅ SIEMPRE RESPONDER CON ÉXITO A BANCARD (ESTO ES CRÍTICO)
        res.status(200).json({
            status: "success"
        });

    } catch (error) {
        console.error("❌ ERROR CRÍTICO PROCESANDO CONFIRMACIÓN:", error);
        console.error("Stack trace:", error.stack);
        
        // ✅ INCLUSO CON ERROR CRÍTICO, RESPONDER ÉXITO A BANCARD
        // Esto evita que Bancard reintente la confirmación
        res.status(200).json({
            status: "success"
        });
    }
};

/**
 * ✅ CONTROLADOR PARA CONSULTAR ESTADO DE TRANSACCIÓN
 */
const getTransactionStatusController = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log("🔍 Consultando estado de transacción:", transactionId);
        
        // Validar configuración
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        // Generar token para consulta
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${transactionId}get_confirmation`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(transactionId)
            }
        };

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy/confirmations`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Estado obtenido:", response.data);

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
        config_details: configValidation.config
    });
};

/**
 * ✅ CONTROLADOR DE PRUEBA
 */
const testBancardSimpleController = async (req, res) => {
    try {
        console.log("🧪 === PRUEBA SIMPLE DE BANCARD ===");
        
        const testShopProcessId = generateShopProcessId();
        const testAmount = "1000.00";
        const testCurrency = "PYG";
        
        const testToken = generateSingleBuyToken(testShopProcessId, testAmount, testCurrency);
        
        const testPayload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: testToken,
                shop_process_id: testShopProcessId,
                amount: testAmount,
                currency: testCurrency,
                description: "Test BlueTec",
                return_url: `${process.env.FRONTEND_URL || 'https://bluetec.vercel.app'}/pago-exitoso`,
                cancel_url: `${process.env.FRONTEND_URL || 'https://bluetec.vercel.app'}/pago-cancelado`
            },
            // ✅ AGREGAR PARA TESTING
            test_client: true
        };
        
        console.log("🧪 Payload de prueba:", JSON.stringify(testPayload, null, 2));
        
        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy`;
        
        const response = await axios.post(bancardUrl, testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 15000,
            validateStatus: () => true
        });
        
        console.log("🧪 Respuesta de Bancard:", response.status, JSON.stringify(response.data, null, 2));
        
        res.json({
            message: "Prueba de Bancard completada",
            success: response.status === 200,
            test_data: {
                status_code: response.status,
                shop_process_id: testShopProcessId,
                token: testToken,
                bancard_response: response.data,
                environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                base_url: getBancardBaseUrl()
            }
        });
        
    } catch (error) {
        console.error("❌ Error en prueba:", error.message);
        
        res.status(500).json({
            message: "Error en prueba de Bancard",
            success: false,
            error: error.response?.data || error.message,
            status_code: error.response?.status,
            environment: process.env.BANCARD_ENVIRONMENT || 'staging'
        });
    }
};

/**
 * ✅ CONTROLADOR PARA ROLLBACK (CANCELAR PAGOS)
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

        // Validar configuración
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        console.log("🔄 Procesando rollback para:", shop_process_id);

        // ✅ GENERAR TOKEN PARA ROLLBACK
        // Según documentación: md5(private_key + shop_process_id + "rollback" + "0.00")
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${shop_process_id}rollback0.00`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(shop_process_id)
            },
            test_client: process.env.BANCARD_ENVIRONMENT === 'staging'
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
module.exports = {
    bancardConfirmController,
    createPaymentController,
    testBancardSimpleController,
    getTransactionStatusController,
    bancardHealthController,
    rollbackPaymentController
};