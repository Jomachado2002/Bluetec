// backend/helpers/bancardUtils.js
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
    
    // Formatear el monto con 2 decimales
    const formattedAmount = Number(amount).toFixed(2);
    
    // Crear string para el hash: private_key + shop_process_id + amount + currency
    const hashString = `${privateKey}${shopProcessId}${formattedAmount}${currency}`;
    
    console.log('🔐 Generando token para:', {
        shopProcessId,
        amount: formattedAmount,
        currency,
        hashString: hashString.substring(0, 20) + '...' // Solo mostrar inicio por seguridad
    });
    
    // Generar MD5
    const token = crypto.createHash('md5').update(hashString).digest('hex');
    
    return token;
};

/**
 * Genera el token MD5 para confirmación de Bancard
 * @param {string} shopProcessId - ID único de la transacción
 * @param {number} amount - Monto en guaraníes
 * @param {string} currency - Moneda (PYG)
 * @returns {string} Token MD5 para confirmación
 */
const generateConfirmToken = (shopProcessId, amount, currency = 'PYG') => {
    const privateKey = process.env.BANCARD_PRIVATE_KEY;
    
    // Formatear el monto con 2 decimales
    const formattedAmount = Number(amount).toFixed(2);
    
    // Para confirmación: private_key + shop_process_id + "confirm" + amount + currency
    const hashString = `${privateKey}${shopProcessId}confirm${formattedAmount}${currency}`;
    
    // Generar MD5
    const token = crypto.createHash('md5').update(hashString).digest('hex');
    
    return token;
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
    const expectedToken = generateConfirmToken(shopProcessId, amount, currency);
    
    console.log('🔍 Verificando token:', {
        received: receivedToken,
        expected: expectedToken,
        match: receivedToken === expectedToken
    });
    
    return receivedToken === expectedToken;
};

/**
 * Genera un ID único para shop_process_id
 * @returns {string} ID único
 */
const generateShopProcessId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `BT${timestamp}${random}`;
};

/**
 * Obtiene la URL base según el ambiente
 * @returns {string} URL base de Bancard
 */
const getBancardBaseUrl = () => {
    const environment = process.env.BANCARD_ENVIRONMENT || 'staging';
    
    if (environment === 'production') {
        return process.env.BANCARD_BASE_URL_PRODUCTION;
    } else {
        return process.env.BANCARD_BASE_URL_STAGING;
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
    
    // Validar formato de las claves
    if (process.env.BANCARD_PUBLIC_KEY && process.env.BANCARD_PUBLIC_KEY.length !== 32) {
        errors.push('BANCARD_PUBLIC_KEY debe tener 32 caracteres');
    }
    
    if (process.env.BANCARD_PRIVATE_KEY && process.env.BANCARD_PRIVATE_KEY.length !== 40) {
        errors.push('BANCARD_PRIVATE_KEY debe tener 40 caracteres');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        config: {
            publicKey: process.env.BANCARD_PUBLIC_KEY,
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
    generateConfirmToken,
    verifyConfirmationToken,
    generateShopProcessId,
    getBancardBaseUrl,
    validateBancardConfig,
    formatAmount,
    parseAmount
};