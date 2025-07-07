// backend/models/bancardTransactionModel.js - VERSIÓN CORREGIDA
const mongoose = require('mongoose');

const bancardTransactionSchema = mongoose.Schema({
    // ===== DATOS PRINCIPALES DE LA TRANSACCIÓN =====
    shop_process_id: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    bancard_process_id: {
        type: String,
        required: false,
        index: true
    },
    
    // ===== INFORMACIÓN FINANCIERA =====
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'PYG',
        enum: ['PYG', 'USD', 'EUR']
    },
    tax_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    number_of_payments: {
        type: Number,
        default: 1,
        min: 1
    },
    description: {
        type: String,
        required: true,
        maxlength: 500 // ✅ AUMENTADO
    },
    
    // ===== TIPO DE PAGO =====
    is_token_payment: {
        type: Boolean,
        default: false,
        index: true
    },
    alias_token: {
        type: String,
        default: null,
        index: true
    },
    payment_method: {
        type: String,
        enum: ['new_card', 'saved_card', 'zimple', 'cash', 'transfer'],
        default: 'new_card',
        index: true
    },
    
    // ===== ESTADO DE LA TRANSACCIÓN =====
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'rolled_back', 'failed', 'requires_3ds', 'processing', 'cancelled'],
        default: 'pending',
        index: true
    },
    
    // ===== RESPUESTA DE BANCARD =====
    response: {
        type: String,
        enum: ['S', 'N', null],
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
        default: null,
        index: true
    },
    ticket_number: {
        type: String,
        default: null,
        index: true
    },
    
    // ===== INFORMACIÓN DEL CLIENTE - CORREGIDO =====
    customer_info: {
        type: mongoose.Schema.Types.Mixed, // ✅ CAMBIADO A Mixed para flexibilidad
        default: {}
    },
    
    // ===== ITEMS DEL CARRITO - CORREGIDO =====
    items: [{
        product_id: {
            type: String,
            required: false
        },
        name: {
            type: String,
            required: false // ✅ CAMBIADO A false
        },
        quantity: {
            type: Number,
            required: false, // ✅ CAMBIADO A false
            min: 0,
            default: 1
        },
        unit_price: {
            type: Number,
            required: false, // ✅ CAMBIADO A false - ERA EL ERROR PRINCIPAL
            min: 0,
            default: 0
        },
        unitPrice: { // ✅ AGREGAR ALIAS PARA COMPATIBILIDAD
            type: Number,
            required: false,
            min: 0,
            default: 0
        },
        total: {
            type: Number,
            required: false, // ✅ CAMBIADO A false
            min: 0,
            default: 0
        },
        category: {
            type: String,
            required: false
        },
        brand: {
            type: String,
            required: false
        },
        sku: {
            type: String,
            required: false
        }
    }],
    
    // ===== INFORMACIÓN DE SEGURIDAD =====
    security_information: {
        type: mongoose.Schema.Types.Mixed, // ✅ CAMBIADO A Mixed
        default: {}
    },
    
    // ===== TRACKING Y ANÁLISIS =====
    user_type: {
        type: String,
        enum: ['GUEST', 'REGISTERED', 'PREMIUM', 'VIP'],
        default: 'GUEST',
        index: true
    },
    user_bancard_id: {
        type: mongoose.Schema.Types.Mixed, // ✅ CAMBIADO PARA ACEPTAR Number O String
        default: null,
        index: true
    },
    ip_address: {
        type: String,
        required: false
    },
    user_agent: {
        type: String,
        required: false,
        maxlength: 1000 // ✅ AUMENTADO
    },
    device_type: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown'
    },
    browser_info: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // ===== INFORMACIÓN DE SESIÓN =====
    payment_session_id: {
        type: String,
        required: false,
        index: true
    },
    cart_total_items: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // ===== INFORMACIÓN DE ORIGEN =====
    referrer_url: {
        type: String,
        required: false,
        maxlength: 1000 // ✅ AUMENTADO
    },
    landing_page: {
        type: String,
        required: false
    },
    
    // ===== MARKETING Y UTM =====
    utm_source: {
        type: String,
        required: false,
        maxlength: 200
    },
    utm_medium: {
        type: String,
        required: false,
        maxlength: 200
    },
    utm_campaign: {
        type: String,
        required: false,
        maxlength: 200
    },
    utm_term: {
        type: String,
        required: false,
        maxlength: 200
    },
    utm_content: {
        type: String,
        required: false,
        maxlength: 200
    },
    
    // ===== INFORMACIÓN DE ENTREGA =====
    delivery_method: {
        type: String,
        enum: ['pickup', 'delivery', 'shipping', 'digital'],
        default: 'pickup'
    },
    delivery_address: {
        type: mongoose.Schema.Types.Mixed, // ✅ CAMBIADO A Mixed
        default: {}
    },
    estimated_delivery: {
        type: Date,
        required: false
    },
    
    // ===== INFORMACIÓN ADICIONAL =====
    order_notes: {
        type: String,
        required: false,
        maxlength: 1000 // ✅ AUMENTADO
    },
    invoice_number: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    receipt_url: {
        type: String,
        required: false
    },
    
    // ===== URLs DE REDIRECCIÓN =====
    return_url: {
        type: String,
        required: false,
        maxlength: 1000
    },
    cancel_url: {
        type: String,
        required: false,
        maxlength: 1000
    },
    
    // ===== INFORMACIÓN DE ROLLBACK =====
    is_rolled_back: {
        type: Boolean,
        default: false,
        index: true
    },
    rollback_date: {
        type: Date,
        default: null
    },
    rollback_reason: {
        type: String,
        required: false,
        maxlength: 500
    },
    rollback_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        default: null
    },
    
    // ===== RELACIONES =====
    sale_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Sale',
        default: null,
        index: true
    },
    created_by: {
        type: mongoose.Schema.Types.Mixed, // ✅ CAMBIADO PARA ACEPTAR ObjectId O string guest
        required: false,
        index: true
    },
    
    // ===== FECHAS IMPORTANTES =====
    transaction_date: {
        type: Date,
        default: Date.now,
        index: true
    },
    confirmation_date: {
        type: Date,
        default: null
    },
    
    // ===== CONTROL DE CALIDAD =====
    bancard_confirmed: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // ===== CONFIGURACIÓN DE ENTORNO =====
    environment: {
        type: String,
        enum: ['staging', 'production'],
        default: 'staging',
        index: true
    },
    is_certification_test: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // ===== SOPORTE PARA 3DS =====
    requires_3ds: {
        type: Boolean,
        default: false
    },
    iframe_url: {
        type: String,
        default: null
    },
    three_ds_version: {
        type: String,
        enum: ['1.0', '2.0', '2.1', '2.2', null],
        default: null
    },
    
    // ===== ANÁLISIS Y REPORTES =====
    conversion_data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // ===== DATOS ADICIONALES FLEXIBLES =====
    additional_data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // ===== METADATOS DE AUDITORÍA =====
    last_updated_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        default: null
    },
    update_history: [{
        updated_by: {
            type: mongoose.Schema.ObjectId,
            ref: 'user'
        },
        updated_at: {
            type: Date,
            default: Date.now
        },
        changes: {
            type: mongoose.Schema.Types.Mixed
        },
        reason: String
    }]
    
}, {
    timestamps: true,
    collection: 'bancard_transactions',
    strict: false // ✅ AGREGAR PARA MAYOR FLEXIBILIDAD
});

// ===== ÍNDICES COMPUESTOS =====
bancardTransactionSchema.index({ shop_process_id: 1, status: 1 });
bancardTransactionSchema.index({ created_by: 1, status: 1, createdAt: -1 });
bancardTransactionSchema.index({ user_bancard_id: 1, is_token_payment: 1 });
bancardTransactionSchema.index({ authorization_number: 1, ticket_number: 1 });
bancardTransactionSchema.index({ environment: 1, is_certification_test: 1 });
bancardTransactionSchema.index({ payment_method: 1, device_type: 1 });
bancardTransactionSchema.index({ 'customer_info.email': 1, status: 1 });
bancardTransactionSchema.index({ invoice_number: 1 }, { sparse: true });

// ===== MIDDLEWARE PRE-SAVE MEJORADO =====
bancardTransactionSchema.pre('save', function(next) {
    try {
        // ✅ NORMALIZAR ITEMS PARA COMPATIBILIDAD
        if (this.items && Array.isArray(this.items)) {
            this.items = this.items.map(item => {
                // Normalizar unit_price vs unitPrice
                if (item.unitPrice && !item.unit_price) {
                    item.unit_price = item.unitPrice;
                }
                if (item.unit_price && !item.unitPrice) {
                    item.unitPrice = item.unit_price;
                }
                
                // Asegurar valores por defecto
                return {
                    ...item,
                    quantity: item.quantity || 1,
                    unit_price: item.unit_price || item.unitPrice || 0,
                    unitPrice: item.unitPrice || item.unit_price || 0,
                    total: item.total || ((item.quantity || 1) * (item.unit_price || item.unitPrice || 0)),
                    name: item.name || 'Producto'
                };
            });
        }
        
        // Auto-generar invoice_number si no existe
        if (!this.invoice_number && this.status === 'approved') {
            this.invoice_number = `INV-${Date.now()}-${this.shop_process_id}`;
        }
        
        // Actualizar requires_3ds basado en el estado
        if (this.status === 'requires_3ds') {
            this.requires_3ds = true;
        }
        
        // Si hay respuesta de Bancard, marcar como confirmado
        if (this.response && this.response_code && !this.bancard_confirmed) {
            this.bancard_confirmed = true;
            
            if (!this.confirmation_date) {
                this.confirmation_date = new Date();
            }
        }
        
        next();
    } catch (error) {
        console.error('❌ Error en pre-save middleware:', error);
        next(error);
    }
});

// ===== MÉTODOS ESTÁTICOS CORREGIDOS =====
bancardTransactionSchema.statics.findByShopProcessId = function(shopProcessId) {
    return this.findOne({ shop_process_id: parseInt(shopProcessId) });
};

bancardTransactionSchema.statics.findByUser = function(userId, options = {}) {
    const query = {};
    
    // ✅ MEJORAR CONSULTA POR USUARIO
    if (typeof userId === 'string' && userId.startsWith('guest-')) {
        query.created_by = userId;
    } else {
        query.$or = [
            { created_by: userId },
            { user_bancard_id: parseInt(userId) },
            { user_bancard_id: userId }
        ];
    }
    
    if (options.status) {
        query.status = options.status;
    }
    
    if (options.onlySuccessful) {
        query.$or = [
            { status: 'approved' },
            { response: 'S', response_code: '00' }
        ];
    }
    
    return this.find(query).sort({ createdAt: -1 });
};

const BancardTransactionModel = mongoose.model('BancardTransaction', bancardTransactionSchema);

module.exports = BancardTransactionModel;