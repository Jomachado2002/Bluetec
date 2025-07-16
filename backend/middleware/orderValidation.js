// backend/middleware/orderValidation.js - MIDDLEWARE DE VALIDACIÓN DE PEDIDOS
const { body, validationResult } = require('express-validator');

/**
 * ✅ VALIDACIONES PARA CREAR PEDIDO
 */
const validateCreateOrder = [
    // Validar información del cliente
    body('customer_info.name')
        .notEmpty()
        .withMessage('El nombre del cliente es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .trim(),
    
    body('customer_info.email')
        .isEmail()
        .withMessage('Formato de email inválido')
        .normalizeEmail(),
    
    body('customer_info.phone')
        .notEmpty()
        .withMessage('El teléfono es requerido')
        .isMobilePhone('es-PY')
        .withMessage('Formato de teléfono paraguayo inválido'),
    
    // Validar ubicación de entrega
    body('delivery_location.lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitud debe estar entre -90 y 90'),
    
    body('delivery_location.lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitud debe estar entre -180 y 180'),
    
    body('delivery_location.address')
        .notEmpty()
        .withMessage('La dirección de entrega es requerida')
        .isLength({ min: 10, max: 500 })
        .withMessage('La dirección debe tener entre 10 y 500 caracteres')
        .trim(),
    
    // Validar productos
    body('items')
        .isArray({ min: 1 })
        .withMessage('Debe incluir al menos un producto'),
    
    body('items.*.name')
        .notEmpty()
        .withMessage('El nombre del producto es requerido')
        .trim(),
    
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('La cantidad debe ser un número entero mayor a 0'),
    
    body('items.*.unit_price')
        .isFloat({ min: 0 })
        .withMessage('El precio unitario debe ser un número mayor o igual a 0'),
    
    body('items.*.total_price')
        .isFloat({ min: 0 })
        .withMessage('El precio total debe ser un número mayor o igual a 0'),
    
    // Validar método de pago
    body('payment_method')
        .isIn(['bancard', 'bank_transfer', 'quote'])
        .withMessage('Método de pago inválido'),
    
    // Validar notas del pedido (opcional)
    body('order_notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Las notas del pedido no pueden exceder 1000 caracteres')
        .trim(),
    
    // Middleware para manejar errores de validación
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de pedido inválidos',
                success: false,
                error: true,
                validation_errors: errors.array()
            });
        }
        next();
    }
];

/**
 * ✅ VALIDACIONES PARA ACTUALIZAR ESTADO DE PEDIDO
 */
const validateUpdateOrderStatus = [
    body('status')
        .isIn(['pending', 'confirmed', 'processing', 'completed', 'cancelled'])
        .withMessage('Estado de pedido inválido'),
    
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres')
        .trim(),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de actualización inválidos',
                success: false,
                error: true,
                validation_errors: errors.array()
            });
        }
        next();
    }
];

/**
 * ✅ VALIDACIONES PARA TRANSFERENCIA BANCARIA
 */
const validateBankTransfer = [
    body('customer_transfer_info.reference_number')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('El número de referencia debe tener entre 3 y 50 caracteres')
        .trim(),
    
    body('customer_transfer_info.customer_bank')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre del banco debe tener entre 3 y 100 caracteres')
        .trim(),
    
    body('customer_transfer_info.customer_account')
        .optional()
        .isLength({ min: 5, max: 30 })
        .withMessage('El número de cuenta debe tener entre 5 y 30 caracteres')
        .trim(),
    
    body('customer_transfer_info.transfer_notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las notas de transferencia no pueden exceder 500 caracteres')
        .trim(),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de transferencia inválidos',
                success: false,
                error: true,
                validation_errors: errors.array()
            });
        }
        next();
    }
];

/**
 * ✅ VALIDACIONES PARA APROBACIÓN/RECHAZO DE TRANSFERENCIA
 */
const validateTransferApproval = [
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres')
        .trim(),
    
    body('verification_amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El monto de verificación debe ser un número mayor o igual a 0'),
    
    body('reason')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La razón no puede exceder 500 caracteres')
        .trim(),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Datos de aprobación inválidos',
                success: false,
                error: true,
                validation_errors: errors.array()
            });
        }
        next();
    }
];

/**
 * ✅ MIDDLEWARE PARA VALIDAR PERMISOS DE ADMIN
 */
const validateAdminPermissions = (req, res, next) => {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({
            message: 'Se requieren permisos de administrador',
            success: false,
            error: true
        });
    }
    next();
};

/**
 * ✅ MIDDLEWARE PARA VALIDAR USUARIO AUTENTICADO
 */
const validateAuthentication = (req, res, next) => {
    if (!req.isAuthenticated || !req.userId) {
        return res.status(401).json({
            message: 'Debes iniciar sesión para realizar esta acción',
            success: false,
            error: true
        });
    }
    next();
};

/**
 * ✅ MIDDLEWARE PARA VALIDAR PARÁMETROS DE PAGINACIÓN
 */
const validatePagination = (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;
    
    if (isNaN(page) || page < 1) {
        return res.status(400).json({
            message: 'Número de página inválido',
            success: false,
            error: true
        });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            message: 'Límite de resultados inválido (debe ser entre 1 y 100)',
            success: false,
            error: true
        });
    }
    
    next();
};

/**
 * ✅ MIDDLEWARE PARA VALIDAR FORMATO DE FECHA
 */
const validateDateRange = (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (startDate && isNaN(new Date(startDate))) {
        return res.status(400).json({
            message: 'Fecha de inicio inválida',
            success: false,
            error: true
        });
    }
    
    if (endDate && isNaN(new Date(endDate))) {
        return res.status(400).json({
            message: 'Fecha de fin inválida',
            success: false,
            error: true
        });
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
            message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
            success: false,
            error: true
        });
    }
    
    next();
};

/**
 * ✅ MIDDLEWARE PARA VALIDAR ID DE PEDIDO
 */
const validateOrderId = (req, res, next) => {
    const { orderId } = req.params;
    
    if (!orderId || orderId.trim() === '') {
        return res.status(400).json({
            message: 'ID de pedido requerido',
            success: false,
            error: true
        });
    }
    
    next();
};

/**
 * ✅ MIDDLEWARE PARA VALIDAR ID DE TRANSFERENCIA
 */
const validateTransferId = (req, res, next) => {
    const { transferId } = req.params;
    
    if (!transferId || transferId.trim() === '') {
        return res.status(400).json({
            message: 'ID de transferencia requerido',
            success: false,
            error: true
        });
    }
    
    next();
};

module.exports = {
    validateCreateOrder,
    validateUpdateOrderStatus,
    validateBankTransfer,
    validateTransferApproval,
    validateAdminPermissions,
    validateAuthentication,
    validatePagination,
    validateDateRange,
    validateOrderId,
    validateTransferId
};