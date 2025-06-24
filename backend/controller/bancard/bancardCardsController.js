// backend/controller/bancard/bancardCardsController.js
const crypto = require('crypto');
const axios = require('axios');
const { 
    validateBancardConfig,
    getBancardBaseUrl
} = require('../../helpers/bancardUtils');

/**
 * ✅ CATASTRAR NUEVA TARJETA
 */
const createCardController = async (req, res) => {
    try {
        console.log("💳 === INICIANDO CATASTRO DE TARJETA ===");
        
        const {
            card_id,
            user_id,
            user_cell_phone,
            user_mail,
            return_url
        } = req.body;

        // Validaciones
        if (!card_id || !user_id || !user_cell_phone || !user_mail) {
            return res.status(400).json({
                message: "Todos los campos son requeridos",
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

        // ✅ GENERAR TOKEN PARA CATASTRO
        // md5(private_key + card_id + user_id + "request_new_card")
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${card_id}${user_id}request_new_card`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                card_id: parseInt(card_id),
                user_id: parseInt(user_id),
                user_cell_phone: user_cell_phone,
                user_mail: user_mail,
                return_url: return_url || `${process.env.FRONTEND_URL}/catastro-exitoso`
            },
            test_client: process.env.BANCARD_ENVIRONMENT === 'staging'
        };

        console.log("📤 Payload de catastro:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/cards/new`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de catastro:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data.status === 'success') {
            res.json({
                message: "Catastro iniciado exitosamente",
                success: true,
                error: false,
                data: response.data
            });
        } else {
            res.status(400).json({
                message: "Error al iniciar catastro",
                success: false,
                error: true,
                data: response.data
            });
        }

    } catch (error) {
        console.error("❌ Error en catastro:", error);
        res.status(500).json({
            message: "Error al procesar catastro",
            success: false,
            error: true,
            details: error.response?.data || error.message
        });
    }
};

/**
 * ✅ LISTAR TARJETAS DE UN USUARIO
 */
const getUserCardsController = async (req, res) => {
    try {
        const { user_id } = req.params;
        
        console.log("📋 Obteniendo tarjetas para usuario:", user_id);

        // Validar configuración
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        // ✅ GENERAR TOKEN PARA LISTAR TARJETAS
        // md5(private_key + user_id + "request_user_cards")
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${user_id}request_user_cards`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                extra_response_attributes: ["cards.bancard_proccesed"]
            },
            test_client: process.env.BANCARD_ENVIRONMENT === 'staging'
        };

        console.log("📤 Payload para listar tarjetas:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/users/${user_id}/cards`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de tarjetas:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            res.json({
                message: "Tarjetas obtenidas exitosamente",
                success: true,
                error: false,
                data: response.data
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
        res.status(500).json({
            message: "Error al obtener tarjetas",
            success: false,
            error: true,
            details: error.response?.data || error.message
        });
    }
};

/**
 * ✅ PAGO CON ALIAS TOKEN
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
            return_url
        } = req.body;

        // Validaciones
        if (!shop_process_id || !amount || !alias_token) {
            return res.status(400).json({
                message: "shop_process_id, amount y alias_token son requeridos",
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

        // ✅ GENERAR TOKEN PARA PAGO CON ALIAS
        // md5(private_key + shop_process_id + "charge" + amount + currency + alias_token)
        const formattedAmount = Number(amount).toFixed(2);
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${shop_process_id}charge${formattedAmount}${currency}${alias_token}`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(shop_process_id),
                amount: formattedAmount,
                number_of_payments: number_of_payments,
                currency: currency,
                additional_data: "",
                description: description || "Pago BlueTec",
                alias_token: alias_token,
                extra_response_attributes: ["confirmation.process_id"],
                return_url: return_url || `${process.env.FRONTEND_URL}/pago-exitoso`
            },
            test_client: process.env.BANCARD_ENVIRONMENT === 'staging'
        };

        console.log("📤 Payload de pago con token:", JSON.stringify(payload, null, 2));

        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/charge`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de pago con token:", response.status, JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            res.json({
                message: "Pago con token procesado",
                success: true,
                error: false,
                data: response.data
            });
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
        res.status(500).json({
            message: "Error al procesar pago con token",
            success: false,
            error: true,
            details: error.response?.data || error.message
        });
    }
};

module.exports = {
    createCardController,
    getUserCardsController,
    chargeWithTokenController
};