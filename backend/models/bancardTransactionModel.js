// backend/models/bancardTransactionModel.js - VERSIÓN MEJORADA PARA TRACKING COMPLETO
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
        maxlength: 200
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
    
    // ===== INFORMACIÓN DEL CLIENTE =====
    customer_info: {
        name: {
            type: String,
            required: false,
            maxlength: 100
        },
        email: {
            type: String,
            required: false,
            lowercase: true,
            maxlength: 150
        },
        phone: {
            type: String,
            required: false,
            maxlength: 20
        },
        address: {
            type: String,
            required: false,
            maxlength: 200
        },
        document_type: {
            type: String,
            enum: ['CI', 'RUC', 'PASSPORT', 'OTHER'],
            default: 'CI'
        },
        document_number: {
            type: String,
            required: false
        }
    },
    
    // ===== ITEMS DEL CARRITO =====
    items: [{
        product_id: {
            type: String,
            required: false
        },
        name: {
            type: String,
            required: true,
            maxlength: 100
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unit_price: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
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
        customer_ip: {
            type: String,
            required: false
        },
        card_source: {
            type: String,
            enum: ['L', 'I', null], // Local, Internacional
            default: null
        },
        card_country: {
            type: String,
            required: false
        },
        card_type: {
            type: String,
            enum: ['credit', 'debit', null],
            default: null
        },
        card_brand: {
            type: String,
            enum: ['VISA', 'MASTERCARD', 'AMERICAN_EXPRESS', 'BANCARD', null],
            default: null
        },
        risk_index: {
            type: String,
            default: '0'
        },
        version: {
            type: String,
            default: '0.3'
        }
    },
    
    // ===== TRACKING Y ANÁLISIS =====
    user_type: {
        type: String,
        enum: ['GUEST', 'REGISTERED', 'PREMIUM', 'VIP'],
        default: 'GUEST',
        index: true
    },
    user_bancard_id: {
        type: Number,
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
        maxlength: 500
    },
    device_type: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown'
    },
    browser_info: {
        name: String,
        version: String,
        os: String
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
        maxlength: 500
    },
    landing_page: {
        type: String,
        required: false
    },
    
    // ===== MARKETING Y UTM =====
    utm_source: {
        type: String,
        required: false,
        maxlength: 100
    },
    utm_medium: {
        type: String,
        required: false,
        maxlength: 100
    },
    utm_campaign: {
        type: String,
        required: false,
        maxlength: 100
    },
    utm_term: {
        type: String,
        required: false,
        maxlength: 100
    },
    utm_content: {
        type: String,
        required: false,
        maxlength: 100
    },
    
    // ===== INFORMACIÓN DE ENTREGA =====
    delivery_method: {
        type: String,
        enum: ['pickup', 'delivery', 'shipping', 'digital'],
        default: 'pickup'
    },
    delivery_address: {
        street: String,
        city: String,
        state: String,
        zip_code: String,
        country: String,
        instructions: String
    },
    estimated_delivery: {
        type: Date,
        required: false
    },
    
    // ===== INFORMACIÓN ADICIONAL =====
    order_notes: {
        type: String,
        required: false,
        maxlength: 500
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
        maxlength: 500
    },
    cancel_url: {
        type: String,
        required: false,
        maxlength: 500
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
        maxlength: 200
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
        type: mongoose.Schema.ObjectId,
        ref: 'user',
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
        time_to_purchase: Number, // tiempo en segundos desde el primer click
        abandoned_carts: Number,
        retry_attempts: Number,
        referral_source: String
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
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'bancard_transactions'
});

// ===== ÍNDICES COMPUESTOS PARA CONSULTAS EFICIENTES =====
bancardTransactionSchema.index({ shop_process_id: 1, status: 1 });
bancardTransactionSchema.index({ created_by: 1, status: 1, createdAt: -1 });
bancardTransactionSchema.index({ user_bancard_id: 1, is_token_payment: 1 });
bancardTransactionSchema.index({ authorization_number: 1, ticket_number: 1 });
bancardTransactionSchema.index({ environment: 1, is_certification_test: 1 });
bancardTransactionSchema.index({ payment_method: 1, device_type: 1 });
bancardTransactionSchema.index({ 'customer_info.email': 1, status: 1 });
bancardTransactionSchema.index({ invoice_number: 1 }, { sparse: true });

// ===== ÍNDICES DE TEXTO PARA BÚSQUEDAS =====
bancardTransactionSchema.index({
    'description': 'text',
    'customer_info.name': 'text',
    'customer_info.email': 'text',
    'items.name': 'text'
});

// ===== MÉTODOS VIRTUALES =====
bancardTransactionSchema.virtual('isSuccessful').get(function() {
    return this.response === 'S' && this.response_code === '00' && this.status === 'approved';
});

bancardTransactionSchema.virtual('isPending').get(function() {
    return ['pending', 'processing', 'requires_3ds'].includes(this.status);
});

bancardTransactionSchema.virtual('isFailed').get(function() {
    return ['failed', 'rejected', 'cancelled'].includes(this.status) || 
           (this.response === 'N' && this.response_code !== '00');
});

bancardTransactionSchema.virtual('isTokenPayment').get(function() {
    return this.is_token_payment === true && this.alias_token;
});

bancardTransactionSchema.virtual('totalAmount').get(function() {
    return this.amount + (this.tax_amount || 0);
});

bancardTransactionSchema.virtual('formattedAmount').get(function() {
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: this.currency || 'PYG'
    }).format(this.amount);
});

// ===== MÉTODOS ESTÁTICOS =====
bancardTransactionSchema.statics.findByShopProcessId = function(shopProcessId) {
    return this.findOne({ shop_process_id: parseInt(shopProcessId) });
};

bancardTransactionSchema.statics.findByBancardProcessId = function(bancardProcessId) {
    return this.findOne({ bancard_process_id: bancardProcessId });
};

bancardTransactionSchema.statics.findByUser = function(userId, options = {}) {
    const query = { created_by: userId };
    
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

bancardTransactionSchema.statics.findTokenPayments = function(userId) {
    return this.find({ 
        created_by: userId, 
        is_token_payment: true,
        status: { $in: ['approved', 'pending', 'processing'] }
    }).sort({ createdAt: -1 });
};

bancardTransactionSchema.statics.findByAuthNumber = function(authNumber) {
    return this.findOne({ authorization_number: authNumber });
};

bancardTransactionSchema.statics.findByTicketNumber = function(ticketNumber) {
    return this.findOne({ ticket_number: ticketNumber });
};

bancardTransactionSchema.statics.getRevenueByPeriod = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                status: 'approved',
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                total_revenue: { $sum: '$amount' },
                total_tax: { $sum: '$tax_amount' },
                transaction_count: { $sum: 1 },
                average_amount: { $avg: '$amount' }
            }
        }
    ]);
};

bancardTransactionSchema.statics.getPaymentMethodStats = function(userId = null) {
    const matchStage = { status: 'approved' };
    if (userId) {
        matchStage.created_by = userId;
    }
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$payment_method',
                count: { $sum: 1 },
                total_amount: { $sum: '$amount' },
                average_amount: { $avg: '$amount' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

// ===== MÉTODOS DE INSTANCIA =====
bancardTransactionSchema.methods.markAsConfirmed = function(confirmationData) {
    this.bancard_confirmed = true;
    this.confirmation_date = new Date();
    this.response = confirmationData.response;
    this.response_code = confirmationData.response_code;
    this.response_description = confirmationData.response_description;
    this.authorization_number = confirmationData.authorization_number;
    this.ticket_number = confirmationData.ticket_number;
    this.status = confirmationData.response === 'S' ? 'approved' : 'rejected';
    
    if (confirmationData.security_information) {
        this.security_information = { ...this.security_information, ...confirmationData.security_information };
    }
    
    return this.save();
};

bancardTransactionSchema.methods.rollback = function(reason, userId) {
    this.is_rolled_back = true;
    this.rollback_date = new Date();
    this.rollback_reason = reason;
    this.rollback_by = userId;
    this.status = 'rolled_back';
    
    return this.save();
};

bancardTransactionSchema.methods.updateStatus = function(newStatus, reason = null, userId = null) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    // Agregar al historial de cambios
    this.update_history.push({
        updated_by: userId,
        updated_at: new Date(),
        changes: {
            status: { from: oldStatus, to: newStatus }
        },
        reason: reason
    });
    
    if (userId) {
        this.last_updated_by = userId;
    }
    
    return this.save();
};

bancardTransactionSchema.methods.addNote = function(note, userId) {
    const currentNotes = this.order_notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${note}`;
    
    this.order_notes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;
    this.last_updated_by = userId;
    
    return this.save();
};

bancardTransactionSchema.methods.generateReceiptData = function() {
    return {
        transaction_id: this._id,
        shop_process_id: this.shop_process_id,
        amount: this.amount,
        currency: this.currency,
        tax_amount: this.tax_amount,
        total_amount: this.amount + (this.tax_amount || 0),
        payment_method: this.payment_method,
        authorization_number: this.authorization_number,
        ticket_number: this.ticket_number,
        transaction_date: this.createdAt,
        customer: this.customer_info,
        items: this.items,
        status: this.status,
        environment: this.environment
    };
};

// ===== MIDDLEWARE HOOKS =====

// Antes de guardar
bancardTransactionSchema.pre('save', function(next) {
    // Validar que el amount sea positivo
    if (this.amount <= 0) {
        next(new Error('El monto debe ser mayor a 0'));
        return;
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
    
    // Validar items si existen
    if (this.items && this.items.length > 0) {
        let calculatedTotal = 0;
        this.items.forEach(item => {
            if (item.quantity <= 0 || item.unit_price < 0) {
                next(new Error('Cantidad y precio unitario deben ser válidos'));
                return;
            }
            calculatedTotal += item.quantity * item.unit_price;
        });
        
        // Verificar que el total calculado coincida aproximadamente con el amount
        const tolerance = 0.01;
        if (Math.abs(calculatedTotal - this.amount) > tolerance) {
            console.warn(`Discrepancia en el total: calculado ${calculatedTotal}, registrado ${this.amount}`);
        }
    }
    
    next();
});

// Después de guardar
bancardTransactionSchema.post('save', function(doc) {
    console.log(`✅ Transacción ${doc.shop_process_id} guardada con estado: ${doc.status}`);
});

// Antes de eliminar
bancardTransactionSchema.pre('remove', function(next) {
    console.log(`⚠️ Eliminando transacción ${this.shop_process_id}`);
    next();
});

// ===== VALIDACIONES PERSONALIZADAS =====
bancardTransactionSchema.path('customer_info.email').validate(function(email) {
    if (!email) return true; // Email es opcional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}, 'Email inválido');

bancardTransactionSchema.path('customer_info.phone').validate(function(phone) {
    if (!phone) return true; // Teléfono es opcional
    
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 7;
}, 'Número de teléfono inválido');

// ===== CONFIGURACIÓN DEL MODELO =====
const BancardTransactionModel = mongoose.model('BancardTransaction', bancardTransactionSchema);

module.exports = BancardTransactionModel;