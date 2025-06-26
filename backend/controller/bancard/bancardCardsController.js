// backend/controller/bancard/bancardCardsController.js - VERSIÓN MEJORADA PARA CERTIFICACIÓN
const crypto = require('crypto');
const axios = require('axios');
const { 
    validateBancardConfig,
    getBancardBaseUrl
} = require('../../helpers/bancardUtils');

/**
 * ✅ CATASTRAR NUEVA TARJETA - MEJORADO PARA CERTIFICACIÓN
 */
const createCardController = async (req, res) => {
    try {
        console.log("💳 === INICIANDO CATASTRO DE TARJETA (CERTIFICACIÓN) ===");
        
        const {
            card_id,
            user_id,
            user_cell_phone,
            user_mail,
            return_url
        } = req.body;

        // ✅ VALIDACIONES MEJORADAS
        if (!card_id || !user_id || !user_cell_phone || !user_mail) {
            return res.status(400).json({
                message: "Todos los campos son requeridos: card_id, user_id, user_cell_phone, user_mail",
                success: false,
                error: true,
                requiredFields: ['card_id', 'user_id', 'user_cell_phone', 'user_mail']
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user_mail)) {
            return res.status(400).json({
                message: "El formato del email no es válido",
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
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${card_id}${user_id}request_new_card`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        console.log("🔐 Token generado para catastro:", {
            card_id,
            user_id,
            tokenString: `${process.env.BANCARD_PRIVATE_KEY?.substring(0, 10)}...${card_id}${user_id}request_new_card`,
            token
        });

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN (SIN test_client PARA CERTIFICACIÓN)
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                card_id: parseInt(card_id),
                user_id: parseInt(user_id),
                user_cell_phone: user_cell_phone.toString(),
                user_mail: user_mail,
                return_url: return_url || `${process.env.FRONTEND_URL}/mi-perfil?tab=cards&status=registered`
            }
            // ✅ SIN test_client para certificación
        };

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
                message: "Catastro iniciado exitosamente (CERTIFICACIÓN)",
                success: true,
                error: false,
                data: response.data,
                certification_mode: true
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
 * ✅ LISTAR TARJETAS DE UN USUARIO - MEJORADO
 */
const getUserCardsController = async (req, res) => {
    try {
        const { user_id } = req.params;
        
        console.log("📋 === OBTENIENDO TARJETAS PARA USUARIO (CERTIFICACIÓN) ===");
        console.log("👤 User ID:", user_id);

        if (!user_id) {
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
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${user_id}request_user_cards`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        console.log("🔐 Token generado para listar:", {
            user_id,
            tokenString: `${process.env.BANCARD_PRIVATE_KEY?.substring(0, 10)}...${user_id}request_user_cards`,
            token
        });

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN (SIN test_client PARA CERTIFICACIÓN)
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                extra_response_attributes: ["cards.bancard_proccesed"]
            }
            // ✅ SIN test_client para certificación
        };

        console.log("📤 Payload para listar tarjetas:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/users/${user_id}/cards`;
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
                message: "Tarjetas obtenidas exitosamente (CERTIFICACIÓN)",
                success: true,
                error: false,
                data: response.data,
                certification_mode: true
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
 * ✅ PAGO CON ALIAS TOKEN - MEJORADO PARA CERTIFICACIÓN
 */
const chargeWithTokenController = async (req, res) => {
    try {
        console.log("💳 === PAGO CON ALIAS TOKEN (CERTIFICACIÓN) ===");
        
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

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN (SIN test_client PARA CERTIFICACIÓN)
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
            // ✅ SIN test_client para certificación
        };

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
                    data: response.data,
                    certification_mode: true
                });
            } else {
                console.log("✅ Pago procesado directamente");
                res.json({
                    message: "Pago con token procesado exitosamente (CERTIFICACIÓN)",
                    success: true,
                    error: false,
                    requires3DS: false,
                    data: response.data,
                    certification_mode: true
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
 * ✅ ELIMINAR TARJETA - NUEVO ENDPOINT MEJORADO
 */
const deleteCardController = async (req, res) => {
    try {
        console.log("🗑️ === ELIMINANDO TARJETA (CERTIFICACIÓN) ===");
        
        const { user_id } = req.params;
        const { alias_token } = req.body;

        // Validaciones
        if (!user_id || !alias_token) {
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
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}delete_card${user_id}${alias_token}`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        console.log("🔐 Token generado para eliminar:", {
            user_id,
            alias_token: `${alias_token.substring(0, 20)}...`,
            tokenString: `${process.env.BANCARD_PRIVATE_KEY?.substring(0, 10)}...delete_card${user_id}${alias_token.substring(0, 10)}...`,
            token
        });

        // ✅ PAYLOAD SEGÚN DOCUMENTACIÓN (SIN test_client PARA CERTIFICACIÓN)
        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                alias_token: alias_token
            }
            // ✅ SIN test_client para certificación
        };

        console.log("📤 Payload para eliminar tarjeta:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/users/${user_id}/cards`;
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
                message: "Tarjeta eliminada exitosamente (CERTIFICACIÓN)",
                success: true,
                error: false,
                data: response.data,
                certification_mode: true
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