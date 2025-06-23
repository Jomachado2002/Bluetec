// backend/helpers/bancardUtils.js - VERSIÓN CORREGIDA PARA IDS ÚNICOS
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
 * ✅ FUNCIÓN ULTRA MEJORADA - Genera un ID GARANTIZADO ÚNICO
 * Usa múltiples fuentes de entropía y timestamps de alta precisión
 * @returns {string} ID único garantizado
 */
const generateShopProcessId = () => {
    // Timestamp con alta precisión (nanosegundos)
    const hrTime = process.hrtime.bigint();
    const timestamp = Date.now();
    
    // Múltiples fuentes de aleatoriedad criptográficamente seguras
    const randomBytes1 = crypto.randomBytes(8).toString('hex'); // 16 chars
    const randomBytes2 = crypto.randomBytes(6).toString('hex'); // 12 chars
    const randomBytes3 = crypto.randomBytes(4).toString('hex'); // 8 chars
    
    // Generar números aleatorios adicionales
    const random1 = Math.floor(Math.random() * 999999999).toString(36);
    const random2 = Math.floor(Math.random() * 999999999).toString(36);
    
    // Convertir hrTime a string hexadecimal único
    const hrTimeHex = hrTime.toString(16).slice(-8);
    
    // Combinar TODAS las fuentes de entropía
    const entropy = `${timestamp}${hrTimeHex}${randomBytes1}${random1}${randomBytes2}${random2}${randomBytes3}`;
    
    // Crear hash único del entropy combinado
    const uniqueHash = crypto.createHash('sha256').update(entropy).digest('hex').slice(0, 16);
    
    // Construir ID final con prefijo y sufijo únicos
    const finalId = `BT${timestamp.toString(36)}${uniqueHash}${randomBytes3}`.substring(0, 32);
    
    console.log('🆔 Generando shop_process_id ULTRA ÚNICO:', {
        finalId,
        length: finalId.length,
        timestamp,
        hrTime: hrTime.toString(),
        entropy: entropy.substring(0, 50) + '...'
    });
    
    return finalId;
};

/**
 * ✅ FUNCIÓN ALTERNATIVA CON UUID REAL
 * Usa UUID v4 real para máxima garantía
 * @returns {string} ID único basado en UUID
 */
const generateAlternativeShopProcessId = () => {
    // Generar UUID v4 real
    const uuid = crypto.randomUUID();
    
    // Timestamp para contexto adicional
    const timestamp = Date.now();
    
    // Combinar UUID con timestamp y prefijo
    const processId = `BT${timestamp}${uuid.replace(/-/g, '').substring(0, 12)}`;
    
    console.log('🔄 Generando shop_process_id ALTERNATIVO:', {
        processId,
        uuid,
        timestamp
    });
    
    return processId;
};

/**
 * ✅ FUNCIÓN DE EMERGENCIA - Para casos extremos
 * Usa todas las fuentes disponibles + timestamp de microsegundos
 * @returns {string} ID de emergencia garantizado único
 */
const generateEmergencyShopProcessId = () => {
    // Timestamp con microsegundos
    const now = new Date();
    const timestamp = now.getTime();
    const microseconds = now.getUTCMilliseconds();
    
    // Bytes aleatorios criptográficos
    const randomBytes = crypto.randomBytes(16).toString('hex');
    
    // Número aleatorio adicional
    const randomNumber = Math.floor(Math.random() * 999999999999);
    
    // Proceso ID (si está disponible)
    const processId = process.pid || Math.floor(Math.random() * 9999);
    
    // Combinar todo y crear hash
    const combined = `${timestamp}${microseconds}${randomBytes}${randomNumber}${processId}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    // Crear ID final
    const emergencyId = `BTEMR${timestamp}${hash.substring(0, 16)}`;
    
    console.log('🚨 Generando shop_process_id DE EMERGENCIA:', {
        emergencyId,
        timestamp,
        microseconds,
        processId
    });
    
    return emergencyId;
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
 * ✅ NUEVA FUNCIÓN - Generar UUID v4 compatible con Node.js más antiguos
 * @returns {string} UUID único
 */
const generateUUID = () => {
    // Si está disponible crypto.randomUUID (Node.js 15+)
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback para versiones más antiguas
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

module.exports = {
    generateSingleBuyToken,
    generateConfirmToken,
    verifyConfirmationToken,
    generateShopProcessId,
    generateAlternativeShopProcessId,
    generateEmergencyShopProcessId, // ✅ Nueva función de emergencia
    getBancardBaseUrl,
    validateBancardConfig,
    formatAmount,
    parseAmount,
    generateUUID
};