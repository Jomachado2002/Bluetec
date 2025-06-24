// backend/helpers/bancardUtils.js - VERSIÓN CORREGIDA
const crypto = require('crypto');

/**
 * Utilidades para trabajar con Bancard vPOS 2.0
 */

/**
 * Genera el token MD5 requerido por Bancard para single_buy
 * @param {string} shopProcessId - ID único de la transacción
 * @param {number} amount - Monto en guaraníes
 * @param {string} currency - Moneda (PYG)
 * @returns {string} Token MD5
 */
const generateSingleBuyToken = (shopProcessId, amount, currency = 'PYG') => {
    const privateKey = process.env.BANCARD_PRIVATE_KEY;
    
    // ✅ IMPORTANTE: Formatear el monto EXACTAMENTE como lo requiere Bancard
    const formattedAmount = Number(amount).toFixed(2);
    
    // ✅ ORDEN CORRECTO: private_key + shop_process_id + amount + currency
    const hashString = `${privateKey}${shopProcessId}${formattedAmount}${currency}`;
    
    console.log('🔐 Generando token MD5 para Bancard:', {
        privateKey: privateKey ? `${privateKey.substring(0, 10)}...` : 'NO CONFIGURADA',
        shopProcessId,
        amount: formattedAmount,
        currency,
        hashString: `${hashString.substring(0, 20)}...` // Solo mostrar inicio por seguridad
    });
    
    // ✅ Generar MD5
    const token = crypto.createHash('md5').update(hashString, 'utf8').digest('hex');
    
    console.log('🔐 Token generado:', token);
    
    return token;
};

/**
 * Genera un ID de proceso único (SOLO NÚMEROS como requiere Bancard)
 * @returns {number} ID único numérico
 */
const generateShopProcessId = () => {
    // ✅ NUEVA ESTRATEGIA: Usar microsegundos + PID + aleatorio
    const now = Date.now();
    const microseconds = process.hrtime ? process.hrtime.bigint() : BigInt(now * 1000);
    const pid = process.pid || Math.floor(Math.random() * 9999);
    const random = Math.floor(Math.random() * 99999);
    
    // Crear ID único basado en timestamp + microsegundos + random
    const uniquePart = Number(microseconds.toString().slice(-8)); // Últimos 8 dígitos de microsegundos
    const shopProcessId = Number(`${now.toString().slice(-6)}${uniquePart.toString().slice(-4)}${random.toString().slice(-3)}`);
    
    console.log('🆔 Generando shop_process_id ULTRA ÚNICO:', {
        shopProcessId,
        timestamp: now,
        microseconds: microseconds.toString(),
        random,
        pid
    });
    
    return shopProcessId;
};

/**
 * Verifica si un token de confirmación es válido
 * @param {string} receivedToken - Token recibido de Bancard
 * @param {string} shopProcessId - ID de la transacción
 * @param {number} amount - Monto de la transacción
 * @param {string} currency - Moneda
 * @returns {boolean} True si el token es válido
 */
const verifyConfirmationToken = (receivedToken, shopProcessId, amount, currency = 'PYG') => {
    const privateKey = process.env.BANCARD_PRIVATE_KEY;
    const formattedAmount = Number(amount).toFixed(2);
    
    // ✅ Para confirmación: private_key + shop_process_id + "confirm" + amount + currency
    const hashString = `${privateKey}${shopProcessId}confirm${formattedAmount}${currency}`;
    const expectedToken = crypto.createHash('md5').update(hashString, 'utf8').digest('hex');
    
    console.log('🔍 Verificando token de confirmación:', {
        received: receivedToken,
        expected: expectedToken,
        match: receivedToken === expectedToken
    });
    
    return receivedToken === expectedToken;
};

/**
 * Obtiene la URL base según el ambiente
 * @returns {string} URL base de Bancard
 */
const getBancardBaseUrl = () => {
    const environment = process.env.BANCARD_ENVIRONMENT || 'staging';
    
    if (environment === 'production') {
        return 'https://vpos.infonet.com.py';
    } else {
        return 'https://vpos.infonet.com.py:8888';
    }
};

/**
 * Valida la configuración de Bancard
 * @returns {Object} Resultado de la validación
 */
const validateBancardConfig = () => {
    const errors = [];
    
    if (!process.env.BANCARD_PUBLIC_KEY) {
        errors.push('BANCARD_PUBLIC_KEY no está configurada');
    }
    
    if (!process.env.BANCARD_PRIVATE_KEY) {
        errors.push('BANCARD_PRIVATE_KEY no está configurada');
    }
    
    if (!process.env.BANCARD_CONFIRMATION_URL) {
        errors.push('BANCARD_CONFIRMATION_URL no está configurada');
    }
    
    // ✅ Validar formato de las claves según documentación
    if (process.env.BANCARD_PUBLIC_KEY && process.env.BANCARD_PUBLIC_KEY.length !== 32) {
        errors.push('BANCARD_PUBLIC_KEY debe tener exactamente 32 caracteres');
    }
    
    if (process.env.BANCARD_PRIVATE_KEY && process.env.BANCARD_PRIVATE_KEY.length !== 40) {
        errors.push('BANCARD_PRIVATE_KEY debe tener exactamente 40 caracteres');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        config: {
            publicKey: process.env.BANCARD_PUBLIC_KEY,
            privateKey: process.env.BANCARD_PRIVATE_KEY ? `${process.env.BANCARD_PRIVATE_KEY.substring(0, 10)}...` : null,
            environment: process.env.BANCARD_ENVIRONMENT || 'staging',
            baseUrl: getBancardBaseUrl(),
            confirmationUrl: process.env.BANCARD_CONFIRMATION_URL
        }
    };
};

/**
 * Formatea un monto para Bancard (siempre con 2 decimales)
 * @param {number} amount - Monto a formatear
 * @returns {string} Monto formateado
 */
const formatAmount = (amount) => {
    return Number(amount).toFixed(2);
};

/**
 * Parsea el monto desde string a número
 * @param {string} amountStr - Monto como string
 * @returns {number} Monto como número
 */
const parseAmount = (amountStr) => {
    return parseFloat(amountStr || '0');
};

module.exports = {
    generateSingleBuyToken,
    verifyConfirmationToken,
    generateShopProcessId,
    getBancardBaseUrl,
    validateBancardConfig,
    formatAmount,
    parseAmount
};