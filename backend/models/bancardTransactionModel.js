// backend/models/bancardTransactionModel.js
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
        required: true
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
    
    // Estado de la transacción
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'rolled_back', 'failed'],
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
        total: Number
    }],
    
    // Información de seguridad
    security_information: {
        customer_ip: String,
        card_source: String, // 'L' o 'I'
        card_country: String,
        risk_index: String
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

const BancardTransactionModel = mongoose.model('BancardTransaction', bancardTransactionSchema);

module.exports = BancardTransactionModel;