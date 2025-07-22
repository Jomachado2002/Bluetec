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
 * ✅ CONTROLADOR MEJORADO PARA CONFIRMACIÓN
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

        // ✅ RESPONDER INMEDIATAMENTE A BANCARD
        const responseData = {
            status: "success"
        };

        console.log("📤 Respondiendo a Bancard:", responseData);
        res.status(200).json(responseData);

        // ✅ PROCESAR EN BACKGROUND
        setImmediate(() => {
            processConfirmationInBackground(req.body, req.query, req.headers, req.ip);
        });

    } catch (error) {
        console.error("❌ ERROR EN CONFIRMACIÓN:", error);
        
        res.status(200).json({
            status: "success", 
            message: "Confirmación recibida",
            timestamp: new Date().toISOString()
        });
    }
};

const bancardConfirmGetController = (req, res) => {
    try {
        console.log("🔍 === GET REQUEST A CONFIRMACIÓN BANCARD ===");
        console.log("Query params:", req.query);
        console.log("Headers:", req.headers);
        
        res.status(200).json({
            status: "success",
            message: "Endpoint de confirmación activo",
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
 * ✅ PROCESAMIENTO EN BACKGROUND CORREGIDO
 */
const processConfirmationInBackground = async (body, query, headers, clientIp) => {
    try {
        console.log("🔄 Procesando confirmación en background...");
        
        const queryParams = query || {};
        const { operation } = body || {};
        
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
 * ✅ CONTROLADOR PARA CREAR PAGOS OCASIONALES - CORREGIDO
 */
const createPaymentController = async (req, res) => {
    try {
        console.log("🛒 === INICIO PROCESO DE PAGO OCASIONAL BANCARD - VERSIÓN CORREGIDA ===");
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
            // ✅ CAMPO DE PROMOCIÓN ESPECÍFICO
            promotion_code = "",
            // ✅ CAMPOS DE TRACKING CORREGIDOS
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
        const finalUserType = req.isAuthenticated === true ? 'REGISTERED' : 'GUEST';
        const finalUserBancardId = req.isAuthenticated === true ? (req.bancardUserId || req.user?.bancardUserId) : null;
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

        const backendUrl = process.env.BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'https://bluetec.vercel.app';
        console.log("🔗 Backend URL para redirecciones:", backendUrl);

        // ✅ PAYLOAD CORREGIDO PARA PAGO OCASIONAL - SIN additional_data POR DEFECTO
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: shopProcessId,
                amount: formattedAmount,
                currency: currency,
                description: description.substring(0, 20),
                return_url: `${process.env.FRONTEND_URL}/pago-exitoso`,
                cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado`
            }
        };

        // ✅ IMPORTANTE: Solo agregar additional_data si hay una promoción válida
        // Según documentación Bancard (páginas 12-13), el formato debe ser:
        // Entidad (3 dígitos) + Marca (2 caracteres) + Producto (3 caracteres) + Afinidad (6 dígitos)
        // Ejemplo válido: "099VS ORO000045"
        
        if (promotion_code && promotion_code.trim() !== "") {
            // Validar formato de promoción
            const promotionRegex = /^\d{3}[A-Z]{2}\s[A-Z]{3}\d{6}$/;
            const cleanPromotionCode = promotion_code.trim();
            
            if (promotionRegex.test(cleanPromotionCode)) {
                payload.operation.additional_data = cleanPromotionCode;
                console.log("🎟️ Promoción válida aplicada al pago ocasional:", {
                    promotion_code: promotion_code,
                    additional_data: payload.operation.additional_data
                });
            } else {
                console.log("⚠️ Formato de promoción inválido para pago ocasional, ignorando:", promotion_code);
                console.log("💡 Formato requerido: '099VS ORO000045' (Entidad+Marca+Producto+Afinidad)");
            }
        }
        // ✅ Si no hay promoción válida, NO incluir additional_data en el payload

        console.log("📤 Payload para Bancard (PAGO OCASIONAL CORREGIDO):", {
            ...JSON.parse(JSON.stringify(payload, null, 2)),
            operation: {
                ...payload.operation,
                token: "***OCULTO***" // Ocultar token en logs
            }
        });

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

                // ✅ GUARDAR TRANSACCIÓN EN BD CON DATOS NORMALIZADOS
                try {
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

                    console.log("📋 Datos normalizados:", {
                        customer_info: normalizedCustomerInfo,
                        items: normalizedItems.length,
                        user_type: finalUserType,
                        has_promotion: !!payload.operation.additional_data
                    });

                    const newTransaction = new BancardTransactionModel({
                        shop_process_id: shopProcessId,
                        bancard_process_id: processId,
                        amount: parseFloat(formattedAmount),
                        currency: currency,
                        description: description,
                        customer_info: normalizedCustomerInfo,
                        items: normalizedItems,
                        return_url: `${process.env.FRONTEND_URL}/pago-exitoso`,
                        cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado`,
                        status: 'pending',
                        environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                        sale_id: sale_id || null,
                        created_by: req.userId || null,
                        is_certification_test: false,
                        
                        // ✅ CAMPOS DE TRACKING CORREGIDOS
                        user_type: finalUserType,
                        payment_method: payment_method,
                        user_bancard_id: finalUserBancardId,
                        ip_address: clientIpAddress,
                        user_agent: user_agent || req.headers['user-agent'] || '',
                        payment_session_id: payment_session_id,
                        device_type: device_type,
                        cart_total_items: cart_total_items || normalizedItems.length,
                        referrer_url: referrer_url || req.headers.referer || '',
                        order_notes: typeof order_notes === 'object' ? JSON.stringify(order_notes) : String(order_notes || ''),
                        delivery_method: delivery_method,
                        invoice_number: invoice_number || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        tax_amount: parseFloat(tax_amount) || 0,
                        utm_source: utm_source,
                        utm_medium: utm_medium,
                        utm_campaign: utm_campaign,
                        
                        // ✅ CAMPOS ESPECÍFICOS PARA PAGO OCASIONAL
                        is_token_payment: false,
                        alias_token: null,
                        
                        // ✅ GUARDAR INFORMACIÓN DE PROMOCIÓN SI EXISTE
                        promotion_code: promotion_code || null,
                        has_promotion: !!payload.operation.additional_data
                    });

                    const savedTransaction = await newTransaction.save();
                    console.log("✅ Transacción de pago ocasional guardada en BD:", {
                        id: savedTransaction._id,
                        shop_process_id: savedTransaction.shop_process_id,
                        has_promotion: savedTransaction.has_promotion
                    });

                } catch (dbError) {
                    console.error("⚠️ Error guardando transacción en BD:", dbError);
                    // ✅ NO FALLAR EL PAGO POR ERROR DE BD
                    console.log("⚠️ Continuando con el pago aunque hubo error en BD");
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
                        has_promotion: !!payload.operation.additional_data,
                        promotion_applied: payload.operation.additional_data || null,
                        
                        // ✅ DATOS PARA EL IFRAME
                        iframe_config: {
                            script_url: iframeUrl,
                            process_id: processId,
                            container_id: 'bancard-iframe-container',
                            initialization_code: `
                                window.onload = function() {
                                    if (window.Bancard && window.Bancard.Checkout) {
                                        Bancard.Checkout.createForm('bancard-iframe-container', '${processId}', {
                                            'form-background-color': '#ffffff',
                                            'button-background-color': '#2A3190',
                                            'button-text-color': '#ffffff',
                                            'button-border-color': '#2A3190',
                                            'input-background-color': '#ffffff',
                                            'input-text-color': '#555555',
                                            'input-placeholder-color': '#999999'
                                        });
                                    }
                                };
                            `
                        },
                        
                        return_url: `${process.env.FRONTEND_URL}/pago-exitoso`,
                        cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado`,
                        
                        bancard_config: {
                            environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                            base_url: getBancardBaseUrl(),
                            certification_mode: false
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
 * ✅ CONTROLADOR PARA CONSULTAR ESTADO
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
 * ✅ CONTROLADOR PARA ROLLBACK
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