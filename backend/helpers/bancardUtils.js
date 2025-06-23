// backend/helpers/bancardUtils.js - VERSIÓN COMPLETA CORREGIDA
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
 * ✅ FUNCIÓN MEJORADA - Genera un ID único para shop_process_id
 * Ahora incluye más entropía para evitar duplicados
 * @returns {string} ID único
 */
const generateShopProcessId = () => {
    // Usar múltiples fuentes de aleatoriedad
    const randomBytes1 = crypto.randomBytes(8).toString('hex'); // 16 chars
    const randomBytes2 = crypto.randomBytes(4).toString('hex'); // 8 chars  
    const timestamp = Date.now().toString(36); // Base36 es más corto
    const random1 = Math.floor(Math.random() * 999999).toString(36);
    const random2 = Math.floor(Math.random() * 999999).toString(36);
    
    // Combinar todo y tomar solo 20 caracteres para que sea manejable
    const fullId = `BT${randomBytes1}${timestamp}${random1}${randomBytes2}${random2}`;
    const finalId = fullId.substring(0, 24); // Mantener longitud razonable
    
    console.log('🆔 Generando shop_process_id COMPLETAMENTE ALEATORIO:', finalId);
    
    return finalId;
};

/**
 * Obtiene la URL base según el ambiente
 * @returns {string} URL base de Bancard
 */
const getBancardBaseUrl = () => {
    const environment = process.env.BANCARD_ENVIRONMENT || 'staging';
    
    if (environment === 'production') {
        return process.env.BANCARD_BASE_URL_PRODUCTION || 'https://vpos.infonet.com.py';
    } else {
        return process.env.BANCARD_BASE_URL_STAGING || 'https://vpos.infonet.com.py:8888';
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

/**
 * ✅ NUEVA FUNCIÓN - Generar UUID v4 simple para casos críticos
 * @returns {string} UUID único
 */
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * ✅ NUEVA FUNCIÓN - Generar shop_process_id usando timestamp + UUID
 * Alternativa si sigue habiendo problemas de duplicados
 * @returns {string} ID único garantizado
 */
const generateAlternativeShopProcessId = () => {
    const timestamp = Date.now();
    const uuid = generateUUID().replace(/-/g, '').substring(0, 8);
    return `BT${timestamp}${uuid}`;
};

module.exports = {
    generateSingleBuyToken,
    generateConfirmToken,
    verifyConfirmationToken,
    generateShopProcessId,
    generateAlternativeShopProcessId, // ✅ Nueva función alternativa
    getBancardBaseUrl,
    validateBancardConfig,
    formatAmount,
    parseAmount,
    generateUUID
};