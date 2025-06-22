// backend/controller/bancard/bancardController.js
const crypto = require('crypto');
const { 
    verifyConfirmationToken, 
    validateBancardConfig,
    parseAmount 
} = require('../../helpers/bancardUtils');

/**
 * Controlador para recibir confirmaciones de Bancard
 * Esta URL es llamada automáticamente por Bancard cuando se procesa un pago
 */
const bancardConfirmController = async (req, res) => {
    try {
        // Log para debugging
        console.log("🔔 Confirmación recibida de Bancard:");
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);
        console.log("Timestamp:", new Date().toISOString());

        // Extraer datos de la confirmación
        const {
            operation
        } = req.body;

        if (!operation) {
            console.log("❌ No se recibió información de la operación");
            return res.status(400).json({
                status: "error",
                message: "Missing operation data"
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
            security_information
        } = operation;

        // Log de los datos principales
        console.log("📊 Datos de la transacción:");
        console.log("- ID de proceso:", shop_process_id);
        console.log("- Respuesta:", response);
        console.log("- Monto:", amount, currency);
        console.log("- Código de respuesta:", response_code);
        console.log("- Descripción:", response_description);

        // Validar el token para seguridad
        if (token && amount && currency) {
            const isValidToken = verifyConfirmationToken(token, shop_process_id, amount, currency);
            if (!isValidToken) {
                console.log("⚠️ Token de confirmación inválido");
                // Aún procesamos pero loggeamos la advertencia
            } else {
                console.log("✅ Token de confirmación válido");
            }
        }

        // Procesar según el resultado
        if (response === 'S' && response_code === '00') {
            // ✅ PAGO EXITOSO
            console.log("✅ PAGO APROBADO:", shop_process_id);
            
            // TODO: Actualizar la base de datos
            // - Buscar la transacción por shop_process_id
            // - Marcar como pagada
            // - Crear registro de venta
            // - Actualizar stock si es necesario
            // - Enviar email de confirmación

        } else {
            // ❌ PAGO RECHAZADO O ERROR
            console.log("❌ PAGO RECHAZADO:", shop_process_id);
            console.log("Motivo:", response_description);
            
            // TODO: Actualizar la base de datos
            // - Marcar la transacción como fallida
            // - Registrar el motivo del rechazo
        }

        // IMPORTANTE: Bancard requiere que respondamos con status 200
        // Si no respondemos correctamente, Bancard reintentará el envío
        res.status(200).json({
            status: "success",
            message: "Confirmación procesada correctamente",
            shop_process_id: shop_process_id
        });

    } catch (error) {
        console.error("❌ Error procesando confirmación de Bancard:", error);
        
        // Aún así respondemos 200 para evitar reintentos innecesarios
        res.status(200).json({
            status: "error",
            message: "Error interno pero recibido",
            error: error.message
        });
    }
};

/**
 * Controlador para crear un nuevo pago con Bancard
 * Esta función se llamará desde el frontend cuando el usuario quiera pagar
 */
const createPaymentController = async (req, res) => {
    try {
        console.log("🛒 Creando nuevo pago con Bancard...");
        
        // TODO: Implementar la creación del pago
        // Por ahora solo respondemos que está en desarrollo
        res.json({
            message: "Función de pago en desarrollo",
            success: false,
            error: false
        });

    } catch (error) {
        console.error("❌ Error creando pago:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            success: false,
            error: true
        });
    }
};

/**
 * Controlador para consultar el estado de una transacción
 */
const getTransactionStatusController = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log("🔍 Consultando estado de transacción:", transactionId);
        
        // TODO: Implementar consulta de estado
        res.json({
            message: "Consulta de estado en desarrollo",
            transactionId,
            success: false,
            error: false
        });

    } catch (error) {
        console.error("❌ Error consultando estado:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            success: false,
            error: true
        });
    }
};

module.exports = {
    bancardConfirmController,
    createPaymentController,
    getTransactionStatusController
};