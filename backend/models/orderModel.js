// backend/models/orderModel.js - MODELO UNIFICADO DE PEDIDOS
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // ✅ IDENTIFICACIÓN ÚNICA
    order_id: {
        type: String,
        unique: true,
        required: false
    },
    
    // ✅ USUARIO (puede ser null para invitados)
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    
    // ✅ DATOS DEL CLIENTE
    customer_info: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            trim: true
        }
    },
    
    // ✅ UBICACIÓN DE ENTREGA (Google Maps)
    delivery_location: {
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        googleMapsUrl: {
            type: String,
            trim: true
        }
    },
    
    // ✅ PRODUCTOS DEL PEDIDO
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
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
        total_price: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            trim: true
        },
        brand: {
            type: String,
            trim: true
        },
        image_url: {
            type: String,
            trim: true
        }
    }],
    
    // ✅ INFORMACIÓN DE PAGO
    payment_method: {
        type: String,
        enum: ['bancard', 'bank_transfer', 'quote'],
        required: true
    },
    
    payment_status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    // ✅ MONTOS
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    
    tax_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // ✅ REFERENCIAS A OTROS SISTEMAS
    bancard_transaction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'bancard_transaction',
        default: null
    },
    
    bank_transfer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'bank_transfer',
        default: null
    },
    
    // ✅ ESTADO GENERAL DEL PEDIDO
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    // ✅ INFORMACIÓN ADICIONAL
    order_notes: {
        type: String,
        trim: true
    },
    
    // ✅ DATOS DE SESIÓN Y TRACKING
    session_id: {
        type: String,
        trim: true
    },
    
    user_agent: {
        type: String,
        trim: true
    },
    
    ip_address: {
        type: String,
        trim: true
    },
    
    device_type: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop'],
        default: 'desktop'
    },
    
    // ✅ DATOS DE CONFIRMACIÓN
    confirmation_date: {
        type: Date
    },
    
    estimated_delivery_date: {
        type: Date
    },
    
    // ✅ AUDITORÍA DE CAMBIOS
    status_history: [{
        status: {
            type: String,
            required: true
        },
        changed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        changed_at: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            trim: true
        }
    }],
    
    // ✅ NOTIFICACIONES
    notifications_sent: {
        email_confirmation: {
            type: Boolean,
            default: false
        },
        whatsapp_sent: {
            type: Boolean,
            default: false
        },
        admin_notified: {
            type: Boolean,
            default: false
        }
    }
    
}, {
    timestamps: true
});

// ✅ MIDDLEWARE PARA GENERAR ORDER_ID
orderSchema.pre('save', function(next) {
    if (this.isNew && !this.order_id) {
        // Generar ID único: ORD-TIMESTAMP-RANDOM
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.order_id = `ORD-${timestamp}-${random}`;
    }
    next();
});

// ✅ MIDDLEWARE PARA ACTUALIZAR TOTAL_AMOUNT
orderSchema.pre('save', function(next) {
    if (this.isModified('items') || this.isModified('subtotal') || this.isModified('tax_amount')) {
        // Recalcular subtotal si los items cambiaron
        if (this.isModified('items')) {
            this.subtotal = this.items.reduce((sum, item) => sum + item.total_price, 0);
        }
        
        // Recalcular total
        this.total_amount = this.subtotal + this.tax_amount;
    }
    next();
});

// ✅ MIDDLEWARE PARA HISTORIAL DE ESTADOS
orderSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.status_history.push({
            status: this.status,
            changed_at: new Date(),
            notes: `Estado cambiado a: ${this.status}`
        });
    }
    next();
});

// ✅ MÉTODOS VIRTUALES
orderSchema.virtual('formatted_order_id').get(function() {
    return this.order_id || `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

orderSchema.virtual('items_count').get(function() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

orderSchema.virtual('is_bancard_order').get(function() {
    return this.payment_method === 'bancard';
});

orderSchema.virtual('is_transfer_order').get(function() {
    return this.payment_method === 'bank_transfer';
});

orderSchema.virtual('is_quote_order').get(function() {
    return this.payment_method === 'quote';
});

// ✅ MÉTODOS DE INSTANCIA
orderSchema.methods.addStatusHistory = function(status, changedBy, notes) {
    this.status_history.push({
        status,
        changed_by: changedBy,
        changed_at: new Date(),
        notes
    });
    this.status = status;
    return this.save();
};

orderSchema.methods.markAsConfirmed = function(confirmedBy) {
    this.status = 'confirmed';
    this.payment_status = 'completed';
    this.confirmation_date = new Date();
    return this.addStatusHistory('confirmed', confirmedBy, 'Pedido confirmado');
};

orderSchema.methods.markAsCompleted = function(completedBy) {
    this.status = 'completed';
    return this.addStatusHistory('completed', completedBy, 'Pedido completado');
};

orderSchema.methods.cancel = function(cancelledBy, reason) {
    this.status = 'cancelled';
    this.payment_status = 'cancelled';
    return this.addStatusHistory('cancelled', cancelledBy, reason || 'Pedido cancelado');
};

// ✅ MÉTODOS ESTÁTICOS
orderSchema.statics.findByOrderId = function(orderId) {
    return this.findOne({ order_id: orderId })
        .populate('user_id', 'name email phone')
        .populate('items.product_id', 'productName category brandName')
        //.populate('bancard_transaction_id')
        //.populate('bank_transfer_id');
};

orderSchema.statics.findUserOrders = function(userId, options = {}) {
    const query = { user_id: userId };
    
    // Aplicar filtros
    if (options.status) query.status = options.status;
    if (options.payment_method) query.payment_method = options.payment_method;
    if (options.payment_status) query.payment_status = options.payment_status;
    
    return this.find(query)
        .populate('bancard_transaction_id')
        .populate('bank_transfer_id')
        .sort({ createdAt: -1 });
};

orderSchema.statics.getPendingTransfers = function() {
    return this.find({
        payment_method: 'bank_transfer',
        payment_status: 'pending'
    })
    .populate('user_id', 'name email phone')
    .populate('bank_transfer_id')
    .sort({ createdAt: -1 });
};

orderSchema.statics.getOrderStats = function(startDate, endDate) {
    const matchQuery = {};
    
    if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    return this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$payment_method',
                count: { $sum: 1 },
                total_amount: { $sum: '$total_amount' },
                avg_amount: { $avg: '$total_amount' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

// ✅ ÍNDICES PARA MEJORAR RENDIMIENTO
orderSchema.index({ order_id: 1 });
orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ payment_method: 1, payment_status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer_info.email': 1 });

// ✅ CONFIGURAR VIRTUALS EN JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const OrderModel = mongoose.model('order', orderSchema);

module.exports = OrderModel;