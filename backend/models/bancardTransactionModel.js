// backend/models/bancardTransactionModel.js - VERSIÓN ACTUALIZADA PARA PAGOS CON TOKEN
const mongoose = require('mongoose');

const bancardTransactionSchema = mongoose.Schema({
    // Datos de la transacción original
    shop_process_id: {
        type: Number,
        required: true,
        unique: true
    },
    bancard_process_id: {
        type: String,
        required: false // Puede ser null al inicio
    },
    
    // Datos del pago
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'PYG'
    },
    description: {
        type: String,
        required: true
    },
    
    // ✅ CAMPOS ESPECÍFICOS PARA PAGOS CON TOKEN
    is_token_payment: {
        type: Boolean,
        default: false
    },
    alias_token: {
        type: String,
        default: null
    },
    user_bancard_id: {
        type: Number,
        default: null
    },
    
    // Estado de la transacción
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'rolled_back', 'failed', 'requires_3ds'],
        default: 'pending'
    },
    
    // Datos de respuesta de Bancard
    response: {
        type: String, // 'S' o 'N'
        default: null
    },
    response_code: {
        type: String,
        default: null
    },
    response_description: {
        type: String,
        default: null
    },
    extended_response_description: {
        type: String,
        default: null
    },
    authorization_number: {
        type: String,
        default: null
    },
    ticket_number: {
        type: String,
        default: null
    },
    
    // Datos del cliente
    customer_info: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    
    // Items del carrito
    items: [{
        name: String,
        quantity: Number,
        unitPrice: Number,
        total: Number,
        product_id: String
    }],
    
    // Información de seguridad
    security_information: {
        customer_ip: String,
        card_source: String, // 'L' o 'I'
        card_country: String,
        risk_index: String,
        version: String
    },
    
    // URLs
    return_url: String,
    cancel_url: String,
    
    // Rollback
    is_rolled_back: {
        type: Boolean,
        default: false
    },
    rollback_date: {
        type: Date,
        default: null
    },
    rollback_reason: {
        type: String,
        default: null
    },
    rollback_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        default: null
    },
    
    // Relación con venta
    sale_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Sale',
        default: null
    },
    
    // Fechas
    transaction_date: {
        type: Date,
        default: Date.now
    },
    confirmation_date: {
        type: Date,
        default: null
    },
    
    // ✅ CAMPO PARA CONFIRMAR QUE BANCARD ENVIÓ CONFIRMACIÓN
    bancard_confirmed: {
        type: Boolean,
        default: false
    },
    
    // Metadatos
    environment: {
        type: String,
        enum: ['staging', 'production'],
        default: 'staging'
    },
    
    // Usuario que creó la transacción
    created_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },
    
    
    // ✅ CAMPOS PARA TRACKING DE 3DS
    requires_3ds: {
        type: Boolean,
        default: false
    },
    iframe_url: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Índices para búsquedas eficientes
bancardTransactionSchema.index({ shop_process_id: 1 });
bancardTransactionSchema.index({ bancard_process_id: 1 });
bancardTransactionSchema.index({ status: 1 });
bancardTransactionSchema.index({ transaction_date: -1 });
bancardTransactionSchema.index({ sale_id: 1 });
bancardTransactionSchema.index({ alias_token: 1 }); // ✅ NUEVO ÍNDICE
bancardTransactionSchema.index({ is_token_payment: 1 }); // ✅ NUEVO ÍNDICE
bancardTransactionSchema.index({ created_by: 1 }); // ✅ NUEVO ÍNDICE

// ✅ MÉTODOS VIRTUALES
bancardTransactionSchema.virtual('isSuccessful').get(function() {
    return this.response === 'S' && this.response_code === '00';
});

bancardTransactionSchema.virtual('isPending').get(function() {
    return this.status === 'pending' || this.status === 'requires_3ds';
});

bancardTransactionSchema.virtual('isFailed').get(function() {
    return this.status === 'failed' || this.status === 'rejected' || 
           (this.response === 'N' && this.response_code !== '00');
});

// ✅ MÉTODOS ESTÁTICOS
bancardTransactionSchema.statics.findByShopProcessId = function(shopProcessId) {
    return this.findOne({ shop_process_id: parseInt(shopProcessId) });
};

bancardTransactionSchema.statics.findByBancardProcessId = function(bancardProcessId) {
    return this.findOne({ bancard_process_id: bancardProcessId });
};

bancardTransactionSchema.statics.findByUser = function(userId) {
    return this.find({ created_by: userId }).sort({ createdAt: -1 });
};

bancardTransactionSchema.statics.findTokenPayments = function(userId) {
    return this.find({ 
        created_by: userId, 
        is_token_payment: true 
    }).sort({ createdAt: -1 });
};

// ✅ MIDDLEWARE PARA ACTUALIZAR AUTOMÁTICAMENTE EL ESTADO
bancardTransactionSchema.pre('save', function(next) {
    // Actualizar requires_3ds basado en el estado
    if (this.status === 'requires_3ds') {
        this.requires_3ds = true;
    }
    
    // Si hay respuesta de Bancard, actualizar bancard_confirmed
    if (this.response && this.response_code) {
        this.bancard_confirmed = true;
        
        // Actualizar confirmation_date si no existe
        if (!this.confirmation_date) {
            this.confirmation_date = new Date();
        }
    }
    
    next();
});

const BancardTransactionModel = mongoose.model('BancardTransaction', bancardTransactionSchema);

module.exports = BancardTransactionModel;