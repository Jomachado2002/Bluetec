// backend/controller/bancard/bancardCardsController.js - VERSIÓN CORREGIDA

const crypto = require('crypto');
const axios = require('axios');
const { 
    validateBancardConfig,
    getBancardBaseUrl
} = require('../../helpers/bancardUtils');

/**
 * ✅ CATASTRAR NUEVA TARJETA - CORREGIDO PARA FUNCIONAR
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

        // ✅ VALIDACIONES PARA USUARIOS AUTENTICADOS
        if (!req.isAuthenticated) {
            return res.status(401).json({
                message: "Debes iniciar sesión para registrar tarjetas",
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

        // ✅ GENERAR DATOS AUTOMÁTICAMENTE SI NO SE PROPORCIONAN
        const finalCardId = card_id || Date.now() + Math.floor(Math.random() * 1000);
        
        // ✅ USAR bancardUserId DEL USUARIO O GENERAR UNO
        let finalUserId = user_id;
        if (!finalUserId && req.user) {
            // Si el usuario no tiene bancardUserId, usar su _id convertido a número
            finalUserId = req.user.bancardUserId || parseInt(req.user._id.toString().slice(-8), 16);
        }
        if (!finalUserId) {
            finalUserId = parseInt(req.userId.toString().slice(-8), 16);
        }

        const finalUserPhone = user_cell_phone || req.user?.phone || "12345678";
        const finalUserEmail = user_mail || req.user?.email;

        if (!finalUserEmail) {
            return res.status(400).json({
                message: "Email es requerido para registrar tarjetas",
                success: false,
                error: true
            });
        }

        // Validar configuración
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            console.error("❌ Configuración inválida:", configValidation.errors);
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true,
                details: configValidation.errors
            });
        }

        // ✅ GENERAR TOKEN SEGÚN DOCUMENTACIÓN BANCARD
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
                user_cell_phone: finalUserPhone.toString(),
                user_mail: finalUserEmail,
                return_url: return_url || `${process.env.FRONTEND_URL}/mi-perfil?tab=cards&status=registered`
            }
        };

        // ✅ AGREGAR test_client PARA STAGING/TESTING
        if (process.env.BANCARD_ENVIRONMENT !== 'production') {
            payload.test_client = true;
        }

        console.log("📤 Payload de catastro:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/cards/new`;
        console.log("🌐 URL de Bancard:", bancardUrl);
        
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
            res.json({
                message: "Catastro iniciado exitosamente",
                success: true,
                error: false,
                data: response.data,
                user_info: {
                    userId: finalUserId,
                    cardId: finalCardId,
                    email: finalUserEmail,
                    phone: finalUserPhone
                }
            });
        } else {
            console.error("❌ Error en respuesta de Bancard:", response.data);
            res.status(400).json({
                message: "Error al iniciar catastro",
                success: false,
                error: true,
                data: response.data
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
            // ✅ USAR bancardUserId DEL USUARIO O GENERAR UNO
            targetUserId = req.user?.bancardUserId || parseInt(req.user?._id.toString().slice(-8), 16) || parseInt(req.userId.toString().slice(-8), 16);
        }

        // Verificar que el usuario solo pueda ver sus propias tarjetas (excepto admin)
        if (req.userRole !== 'ADMIN') {
            const userBancardId = req.user?.bancardUserId || parseInt(req.user?._id.toString().slice(-8), 16) || parseInt(req.userId.toString().slice(-8), 16);
            if (targetUserId != userBancardId) {
                return res.status(403).json({
                    message: "No puedes ver tarjetas de otros usuarios",
                    success: false,
                    error: true
                });
            }
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

        // ✅ AGREGAR test_client PARA STAGING/TESTING
        if (process.env.BANCARD_ENVIRONMENT !== 'production') {
            payload.test_client = true;
        }

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
    }
};

/**
 * ✅ PAGO CON ALIAS TOKEN - CORREGIDO
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
            iva_amount,
            additional_data = ""
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
        if (!shop_process_id || !amount || !alias_token) {
            return res.status(400).json({
                message: "shop_process_id, amount y alias_token son requeridos",
                success: false,
                error: true,
                requiredFields: ['shop_process_id', 'amount', 'alias_token']
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

        // ✅ GENERAR TOKEN SEGÚN DOCUMENTACIÓN
        // md5(private_key + shop_process_id + "charge" + amount + currency + alias_token)
        const formattedAmount = Number(amount).toFixed(2);
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${shop_process_id}charge${formattedAmount}${currency}${alias_token}`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        console.log("🔐 Token generado para pago con alias:", {
            shop_process_id,
            formattedAmount,
            currency,
            alias_token: `${alias_token.substring(0, 20)}...`,
            tokenString: `${process.env.BANCARD_PRIVATE_KEY?.substring(0, 10)}...${shop_process_id}charge${formattedAmount}${currency}${alias_token.substring(0, 10)}...`,
            token
        });

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(shop_process_id),
                amount: formattedAmount,
                number_of_payments: parseInt(number_of_payments),
                currency: currency,
                additional_data: additional_data,
                description: description || "Pago BlueTec con tarjeta registrada",
                alias_token: alias_token,
                extra_response_attributes: ["confirmation.process_id"],
                return_url: return_url || `${process.env.FRONTEND_URL}/mi-perfil?tab=cards&payment=success`
            }
        };

        // ✅ AGREGAR test_client PARA STAGING/TESTING
        if (process.env.BANCARD_ENVIRONMENT !== 'production') {
            payload.test_client = true;
        }

        // Agregar IVA si se proporciona
        if (iva_amount) {
            payload.operation.iva_amount = Number(iva_amount).toFixed(2);
        }

        console.log("📤 Payload de pago con token:", JSON.stringify(payload, null, 2));

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

            if (requiresAuth) {
                console.log("🔐 Pago requiere autenticación 3DS");
                res.json({
                    message: "Pago requiere autenticación 3DS",
                    success: true,
                    error: false,
                    requires3DS: true,
                    data: response.data
                });
            } else {
                console.log("✅ Pago procesado directamente");
                res.json({
                    message: "Pago con token procesado exitosamente",
                    success: true,
                    error: false,
                    requires3DS: false,
                    data: response.data
                });
            }
        } else {
            res.status(response.status).json({
                message: "Error en pago con token",
                success: false,
                error: true,
                data: response.data
            });
        }

    } catch (error) {
        console.error("❌ Error en pago con token:", error);
        
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
            targetUserId = req.user?.bancardUserId || parseInt(req.user?._id.toString().slice(-8), 16) || parseInt(req.userId.toString().slice(-8), 16);
        }

        // Verificar que el usuario solo pueda eliminar sus propias tarjetas (excepto admin)
        if (req.userRole !== 'ADMIN') {
            const userBancardId = req.user?.bancardUserId || parseInt(req.user?._id.toString().slice(-8), 16) || parseInt(req.userId.toString().slice(-8), 16);
            if (targetUserId != userBancardId) {
                return res.status(403).json({
                    message: "No puedes eliminar tarjetas de otros usuarios",
                    success: false,
                    error: true
                });
            }
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

        // Validar configuración
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

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

        // ✅ AGREGAR test_client PARA STAGING/TESTING
        if (process.env.BANCARD_ENVIRONMENT !== 'production') {
            payload.test_client = true;
        }

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