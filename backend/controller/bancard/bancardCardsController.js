// backend/controller/bancard/bancardCardsController.js - VERSIÓN CORREGIDA CON BD
const crypto = require('crypto');
const axios = require('axios');
const BancardTransactionModel = require('../../models/bancardTransactionModel'); // ✅ AGREGAR IMPORT
const { 
    validateBancardConfig,
    getBancardBaseUrl,
    generateShopProcessId, // ✅ AGREGAR IMPORT
    formatAmount
} = require('../../helpers/bancardUtils');

/**
 * ✅ CATASTRAR NUEVA TARJETA - CORREGIDO PARA USUARIOS GENERALES
 */
const createCardController = async (req, res) => {
    try {
        console.log("💳 === INICIANDO CATASTRO DE TARJETA ===");
        console.log("👤 Usuario del request:", {
            userId: req.userId,
            isAuthenticated: req.isAuthenticated,
            userRole: req.userRole,
            bancardUserId: req.bancardUserId,
            user: req.user ? { name: req.user.name, email: req.user.email } : null
        });
        
        const {
            card_id,
            user_id,
            user_cell_phone,
            user_mail,
            return_url
        } = req.body;

        // ✅ VALIDACIÓN CORREGIDA: Verificar autenticación real
        if (!req.isAuthenticated || !req.userId) {
            console.log("❌ Usuario no autenticado:", {
                isAuthenticated: req.isAuthenticated,
                userId: req.userId,
                cookies: req.cookies ? Object.keys(req.cookies) : 'Sin cookies'
            });
            return res.status(401).json({
                message: "Debes iniciar sesión para registrar tarjetas",
                success: false,
                error: true,
                redirectTo: "/iniciar-sesion",
                debug: {
                    isAuthenticated: req.isAuthenticated,
                    hasUserId: !!req.userId,
                    userRole: req.userRole
                }
            });
        }

        // ✅ VALIDACIÓN MEJORADA: Verificar que no es usuario invitado
        if (typeof req.userId === 'string' && req.userId.startsWith('guest-')) {
            console.log("❌ Usuario invitado intentando catastro:", req.userId);
            return res.status(401).json({
                message: "Los usuarios invitados no pueden registrar tarjetas",
                success: false,
                error: true,
                redirectTo: "/iniciar-sesion"
            });
        }

        if (req.userRole !== 'GENERAL' && req.userRole !== 'ADMIN') {
            return res.status(403).json({
                message: "No tienes permisos para registrar tarjetas",
                success: false,
                error: true
            });
        }

        // ✅ USAR DATOS DEL USUARIO AUTENTICADO
        const finalCardId = card_id || Date.now();
        const finalUserId = req.bancardUserId || req.user?.bancardUserId || user_id;
        const finalUserPhone = user_cell_phone || req.user?.phone || "12345678";
        const finalUserEmail = user_mail || req.user?.email;

        console.log("📋 Datos finales para catastro:", {
            finalCardId,
            finalUserId,
            finalUserPhone,
            finalUserEmail,
            originalUserId: user_id
        });

        if (!finalUserId) {
            return res.status(400).json({
                message: "Usuario no tiene ID de Bancard asignado",
                success: false,
                error: true,
                details: "Contacta al administrador para configurar tu cuenta"
            });
        }

        if (!finalUserEmail) {
            return res.status(400).json({
                message: "Email es requerido para registrar tarjetas",
                success: false,
                error: true
            });
        }

        // ✅ VALIDAR CONFIGURACIÓN DE BANCARD
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true,
                details: configValidation.errors
            });
        }

        // ✅ GENERAR TOKEN MD5 SEGÚN DOCUMENTACIÓN BANCARD
        // md5(private_key + card_id + user_id + "request_new_card")
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${finalCardId}${finalUserId}request_new_card`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        console.log("🔐 Token generado para catastro:", {
            card_id: finalCardId,
            user_id: finalUserId,
            tokenString: `${process.env.BANCARD_PRIVATE_KEY?.substring(0, 10)}...${finalCardId}${finalUserId}request_new_card`,
            token
        });

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN BANCARD
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                card_id: parseInt(finalCardId),
                user_id: parseInt(finalUserId),
                user_cell_phone: finalUserPhone,
                user_mail: finalUserEmail,
                return_url: `${process.env.FRONTEND_URL}/catastro-resultado`

            }
        };

        console.log("📤 Payload para catastro:", JSON.stringify(payload, null, 2));

        // ✅ HACER PETICIÓN A BANCARD
        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/cards/new`;
        console.log("🌐 URL de Bancard para catastro:", bancardUrl);
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de catastro:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data.status === 'success') {
            console.log("✅ Catastro iniciado exitosamente");
            
            res.json({
                message: "Catastro iniciado exitosamente",
                success: true,
                error: false,
                data: {
                    process_id: response.data.process_id,
                    card_id: finalCardId,
                    user_id: finalUserId,
                    iframe_url: `${getBancardBaseUrl()}/checkout/new/${response.data.process_id}`,
                    bancard_response: response.data
                }
            });
        } else {
            console.error("❌ Bancard respondió con error:", response.data);
            res.status(400).json({
                message: "Error al iniciar catastro en Bancard",
                success: false,
                error: true,
                details: response.data
            });
        }

        
    } catch (error) {
        console.error("❌ Error en catastro:", error);
        
        let errorMessage = "Error al procesar catastro";
        let errorDetails = error.message;
        
        if (error.response) {
            errorDetails = error.response.data;
            console.error("📥 Error response de Bancard:", error.response.data);
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
 * ✅ LISTAR TARJETAS DE UN USUARIO - CORREGIDO
 */
const getUserCardsController = async (req, res) => {
    // ✅ VERIFICAR SI YA SE ENVIÓ UNA RESPUESTA (ANTI-BUCLE)
if (res.headersSent) {
    console.log("⚠️ Headers ya enviados, evitando respuesta duplicada");
    return;
}

// ✅ VERIFICAR PROCESAMIENTO ÚNICO
const requestKey = `${req.method}_${req.originalUrl}_${Date.now()}`;
if (req.processing) {
    console.log("⚠️ Request ya en procesamiento, evitando duplicación");
    return;
}
req.processing = true;
    try {
        console.log("📋 === OBTENIENDO TARJETAS PARA USUARIO ===");
        
        // ✅ USAR USER_ID DEL USUARIO AUTENTICADO
        let targetUserId = req.params.user_id;
        
        // Si no se proporciona user_id, usar el del usuario autenticado
        if (!targetUserId || targetUserId === 'me') {
            if (!req.isAuthenticated) {
                return res.status(401).json({
                    message: "Debes iniciar sesión para ver tus tarjetas",
                    success: false,
                    error: true
                });
            }
            targetUserId = req.bancardUserId || req.user.bancardUserId;
        }

        // Verificar que el usuario solo pueda ver sus propias tarjetas (excepto admin)
        if (req.userRole !== 'ADMIN' && targetUserId != (req.bancardUserId || req.user.bancardUserId)) {
            return res.status(403).json({
                message: "No puedes ver tarjetas de otros usuarios",
                success: false,
                error: true
            });
        }

        console.log("👤 Target User ID:", targetUserId);

        if (!targetUserId) {
            return res.status(400).json({
                message: "user_id es requerido",
                success: false,
                error: true
            });
        }

        // Validar configuración
        const configValidation = validateBancardConfig();
        // ✅ DECLARAR VARIABLES FALTANTES
        const finalUserType = req.isAuthenticated ? 'REGISTERED' : 'GUEST';
        const finalUserBancardId = req.bancardUserId || req.user?.bancardUserId || user_bancard_id;
        const clientIpAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        // ✅ GENERAR TOKEN SEGÚN DOCUMENTACIÓN
        // md5(private_key + user_id + "request_user_cards")
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${targetUserId}request_user_cards`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        console.log("🔐 Token generado para listar:", {
            user_id: targetUserId,
            tokenString: `${process.env.BANCARD_PRIVATE_KEY?.substring(0, 10)}...${targetUserId}request_user_cards`,
            token
        });

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                extra_response_attributes: ["cards.bancard_proccesed"]
            }
        };

       
        console.log("📤 Payload para listar tarjetas:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/users/${targetUserId}/cards`;
        console.log("🌐 URL de Bancard:", bancardUrl);
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de tarjetas:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            res.json({
                message: "Tarjetas obtenidas exitosamente",
                success: true,
                error: false,
                data: response.data,
                user_id: targetUserId
            });
        } else {
            res.status(response.status).json({
                message: "Error al obtener tarjetas",
                success: false,
                error: true,
                data: response.data
            });
        }

       } catch (error) {
        console.error("❌ Error obteniendo tarjetas:", error);
        
        let errorMessage = "Error al obtener tarjetas";
        let errorDetails = error.message;
        
        if (error.response) {
            errorDetails = error.response.data;
            console.error("📥 Error response de Bancard:", error.response.data);
        }
        
        res.status(500).json({
            message: errorMessage,
            success: false,
            error: true,
            details: errorDetails
        });
    } finally {
        req.processing = false;
    }
};

/**
 * ✅ PAGO CON ALIAS TOKEN - CORREGIDO CON INTEGRACIÓN A BD
 */
const chargeWithTokenController = async (req, res) => {
    try {
        console.log("💳 === PAGO CON ALIAS TOKEN ===");
        
       const {
            shop_process_id,
            amount,
            currency = 'PYG',
            alias_token,
            number_of_payments = 1,
            description,
            return_url,
            additional_data = "",
            customer_info,
            items,
            // ✅ NUEVOS CAMPOS DE TRACKING
            user_type = 'REGISTERED',
            payment_method = 'saved_card',
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

        // ✅ VALIDACIONES PARA USUARIOS AUTENTICADOS
        if (!req.isAuthenticated) {
            return res.status(401).json({
                message: "Debes iniciar sesión para realizar pagos",
                success: false,
                error: true
            });
        }

        // ✅ VALIDACIONES MEJORADAS
        if (!amount || !alias_token) {
            return res.status(400).json({
                message: "amount y alias_token son requeridos",
                success: false,
                error: true,
                requiredFields: ['amount', 'alias_token']
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                message: "El monto debe ser mayor a 0",
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

        // ✅ GENERAR shop_process_id SI NO SE PROPORCIONA
        const finalShopProcessId = shop_process_id || generateShopProcessId();
      const clientIpAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const finalUserBancardId = user_bancard_id || req.bancardUserId || req.user?.bancardUserId;
        console.log("🆔 Shop Process ID:", finalShopProcessId);

        // ✅ GENERAR TOKEN SEGÚN DOCUMENTACIÓN
        // md5(private_key + shop_process_id + "charge" + amount + currency + alias_token)
        const formattedAmount = formatAmount(amount);
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${finalShopProcessId}charge${formattedAmount}${currency}${alias_token}`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        console.log("🔐 Token generado para pago con alias:", {
            shop_process_id: finalShopProcessId,
            formattedAmount,
            currency,
            alias_token: `${alias_token.substring(0, 20)}...`,
            tokenString: `${process.env.BANCARD_PRIVATE_KEY?.substring(0, 10)}...${finalShopProcessId}charge${formattedAmount}${currency}${alias_token.substring(0, 10)}...`,
            token
        });

        // ✅ OBTENER URLs DEL BACKEND PARA REDIRECCIÓN SINCRONIZADA
        const backendUrl = process.env.BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'https://bluetec.vercel.app';

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(finalShopProcessId),
                amount: formattedAmount,
                number_of_payments: parseInt(number_of_payments),
                currency: currency,
                additional_data: additional_data,
                description: description || "Pago BlueTec con tarjeta registrada",
                alias_token: alias_token,
                // ✅ USAR URLs DEL BACKEND PARA REDIRECCIÓN SINCRONIZADA
                return_url: `${backendUrl}/api/bancard/redirect/success`
            }
        };

        
        console.log("📤 Payload de pago con token:", {
            shop_process_id: payload.operation.shop_process_id,
            amount: payload.operation.amount,
            currency: payload.operation.currency,
            alias_token: `${payload.operation.alias_token.substring(0, 20)}...`,
            description: payload.operation.description,
            is_token_payment: true
        });

        // ✅ GUARDAR TRANSACCIÓN EN BD ANTES DE ENVIAR A BANCARD
        try {
            const newTransaction = new BancardTransactionModel({
                shop_process_id: parseInt(finalShopProcessId),
                bancard_process_id: null, // Se actualizará después
                amount: parseFloat(formattedAmount),
                currency: currency,
                description: description || "Pago BlueTec con tarjeta registrada",
                customer_info: customer_info || {
                    name: req.user?.name || 'Usuario registrado',
                    email: req.user?.email || '',
                    phone: req.user?.phone || ''
                },
                items: items || [],
                return_url: `${backendUrl}/api/bancard/redirect/success`,
                cancel_url: `${backendUrl}/api/bancard/redirect/cancel`,
                status: 'pending',
                environment: process.env.BANCARD_ENVIRONMENT || 'staging',
                created_by: req.userId,
                
                // ✅ CAMPOS DE TRACKING Y ANÁLISIS CORREGIDOS
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
                
                // ✅ CAMPOS ESPECÍFICOS PARA PAGO CON TOKEN
                is_token_payment: true,
                alias_token: alias_token
            });

            await newTransaction.save();
            console.log("✅ Transacción guardada exitosamente:", {
                id: newTransaction._id,
                shop_process_id: newTransaction.shop_process_id,
                user_bancard_id: finalUserBancardId,
                user_type: finalUserType,
                amount: newTransaction.amount,
                created_by: req.userId
            });
            console.log("✅ Transacción guardada en BD:", newTransaction._id);

        } catch (dbError) {
            console.error("⚠️ Error guardando transacción en BD:", {
                error: dbError.message,
                stack: dbError.stack,
                finalUserBancardId,
                finalUserType,
                req_userId: req.userId
            });
            // Continuar con el pago aunque falle el guardado en BD
        }

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/charge`;
        console.log("🌐 URL de Bancard:", bancardUrl);
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de pago con token:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            // ✅ VERIFICAR SI REQUIERE 3DS
            const requiresAuth = response.data?.operation?.process_id && 
                               !response.data?.operation?.response;

            // ✅ ACTUALIZAR TRANSACCIÓN CON process_id DE BANCARD
            try {
                await BancardTransactionModel.findOneAndUpdate(
                    { shop_process_id: parseInt(finalShopProcessId) },
                    { 
                        bancard_process_id: response.data?.operation?.process_id || response.data?.process_id,
                        is_token_payment: true,
                        alias_token: alias_token,
                        user_bancard_id: req.bancardUserId || req.user?.bancardUserId,
                        // Si no requiere 3DS y hay respuesta inmediata, actualizar estado
                        ...(response.data?.operation?.response && {
                            response: response.data.operation.response,
                            response_code: response.data.operation.response_code,
                            response_description: response.data.operation.response_description,
                            authorization_number: response.data.operation.authorization_number,
                            ticket_number: response.data.operation.ticket_number,
                            status: response.data.operation.response === 'S' ? 'approved' : 'rejected'
                        })
                    }
                );
                console.log("✅ Transacción actualizada con process_id de Bancard");
            } catch (dbError) {
                console.error("⚠️ Error actualizando transacción:", dbError);
            }

            if (requiresAuth) {
                console.log("🔐 Pago requiere autenticación 3DS");
                res.json({
                    message: "Pago requiere autenticación 3DS",
                    success: true,
                    error: false,
                    requires3DS: true,
                    data: {
                        ...response.data,
                        shop_process_id: finalShopProcessId,
                        iframe_url: response.data?.operation?.process_id ? 
                            `${getBancardBaseUrl()}/checkout/new/${response.data.operation.process_id}` : null
                    }
                });
            } else {
                console.log("✅ Pago procesado directamente");
                res.json({
                    message: "Pago con token procesado exitosamente",
                    success: true,
                    error: false,
                    requires3DS: false,
                    data: {
                        ...response.data,
                        shop_process_id: finalShopProcessId
                    }
                });
            }
        } else {
            // ✅ ACTUALIZAR TRANSACCIÓN COMO FALLIDA
            try {
                await BancardTransactionModel.findOneAndUpdate(
                    { shop_process_id: parseInt(finalShopProcessId) },
                    { 
                        status: 'failed',
                        response_description: response.data?.message || 'Error en Bancard'
                    }
                );
            } catch (dbError) {
                console.error("⚠️ Error actualizando transacción fallida:", dbError);
            }

            res.status(response.status).json({
                message: "Error en pago con token",
                success: false,
                error: true,
                data: response.data
            });
        }

    } catch (error) {
        console.error("❌ Error en pago con token:", error);
        
        // ✅ ACTUALIZAR TRANSACCIÓN COMO ERROR
        if (req.body.shop_process_id || error.shop_process_id) {
            try {
                await BancardTransactionModel.findOneAndUpdate(
                    { shop_process_id: parseInt(req.body.shop_process_id || error.shop_process_id) },
                    { 
                        status: 'failed',
                        response_description: error.message || 'Error interno'
                    }
                );
            } catch (dbError) {
                console.error("⚠️ Error actualizando transacción en catch:", dbError);
            }
        }
        
        let errorMessage = "Error al procesar pago con token";
        let errorDetails = error.message;
        
        if (error.response) {
            errorDetails = error.response.data;
            console.error("📥 Error response de Bancard:", error.response.data);
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
 * ✅ ELIMINAR TARJETA - CORREGIDO
 */
const deleteCardController = async (req, res) => {
    try {
        console.log("🗑️ === ELIMINANDO TARJETA ===");
        
        let targetUserId = req.params.user_id;
        const { alias_token } = req.body;

        // ✅ VALIDACIONES DE AUTENTICACIÓN
        if (!req.isAuthenticated) {
            return res.status(401).json({
                message: "Debes iniciar sesión para eliminar tarjetas",
                success: false,
                error: true
            });
        }

        // Si no se proporciona user_id, usar el del usuario autenticado
        if (!targetUserId || targetUserId === 'me') {
            targetUserId = req.bancardUserId || req.user.bancardUserId;
        }

        // Verificar que el usuario solo pueda eliminar sus propias tarjetas (excepto admin)
        if (req.userRole !== 'ADMIN' && targetUserId != (req.bancardUserId || req.user.bancardUserId)) {
            return res.status(403).json({
                message: "No puedes eliminar tarjetas de otros usuarios",
                success: false,
                error: true
            });
        }

        // Validaciones
        if (!targetUserId || !alias_token) {
            return res.status(400).json({
                message: "user_id y alias_token son requeridos",
                success: false,
                error: true,
                requiredFields: ['user_id', 'alias_token']
            });
        }

       // ✅ DECLARAR VARIABLES FALTANTES PARA PAGO CON TOKEN
        const finalUserType = req.isAuthenticated ? 'REGISTERED' : 'GUEST';
        const finalUserBancardId = user_bancard_id || req.bancardUserId || req.user?.bancardUserId;
        const clientIpAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        console.log("🔍 Variables declaradas para pago con token:", {
            finalUserType,
            finalUserBancardId,
            clientIpAddress,
            isAuthenticated: req.isAuthenticated,
            userId: req.userId
        });

        // ✅ GENERAR TOKEN SEGÚN DOCUMENTACIÓN
        // md5(private_key + "delete_card" + user_id + alias_token)
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}delete_card${targetUserId}${alias_token}`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        console.log("🔐 Token generado para eliminar:", {
            user_id: targetUserId,
            alias_token: `${alias_token.substring(0, 20)}...`,
            tokenString: `${process.env.BANCARD_PRIVATE_KEY?.substring(0, 10)}...delete_card${targetUserId}${alias_token.substring(0, 10)}...`,
            token
        });

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                alias_token: alias_token
            }
        };

       

        console.log("📤 Payload para eliminar tarjeta:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/users/${targetUserId}/cards`;
        console.log("🌐 URL de Bancard:", bancardUrl);
        
        const response = await axios.delete(bancardUrl, {
            data: payload,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de eliminación:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            res.json({
                message: "Tarjeta eliminada exitosamente",
                success: true,
                error: false,
                data: response.data,
                user_id: targetUserId
            });
        } else {
            res.status(response.status).json({
                message: "Error al eliminar tarjeta",
                success: false,
                error: true,
                data: response.data
            });
        }

    } catch (error) {
        console.error("❌ Error eliminando tarjeta:", error);
        
        let errorMessage = "Error al eliminar tarjeta";
        let errorDetails = error.message;
        
        if (error.response) {
            errorDetails = error.response.data;
            console.error("📥 Error response de Bancard:", error.response.data);
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
    createCardController,
    getUserCardsController,
    chargeWithTokenController,
    deleteCardController
};