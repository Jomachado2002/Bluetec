// backend/models/bankTransferModel.js - MODELO DE TRANSFERENCIAS BANCARIAS
const mongoose = require('mongoose');

const bankTransferSchema = new mongoose.Schema({
    // ✅ IDENTIFICACIÓN ÚNICA
    transfer_id: {
        type: String,
        unique: true,
        required: true
    },
    
    // ✅ REFERENCIA AL PEDIDO
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
        required: true
    },
    
    // ✅ DATOS BANCARIOS DE DESTINO (COMPULANDIA)
    bank_details: {
        bank_name: {
            type: String,
            default: 'BANCO CONTINENTAL',
            required: true
        },
        account_type: {
            type: String,
            default: 'CTA CTE Gs',
            required: true
        },
        account_number: {
            type: String,
            default: '66-214830-07',
            required: true
        },
        account_holder: {
            type: String,
            default: 'COMPULANDIA SRL',
            required: true
        },
        bank_code: {
            type: String,
            default: 'CONTINENTAL'
        }
    },
    
    // ✅ DATOS DE LA TRANSFERENCIA REALIZADA POR EL CLIENTE
    customer_transfer_info: {
        reference_number: {
            type: String,
            trim: true
        },
        transfer_amount: {
            type: Number,
            required: true,
            min: 0
        },
        transfer_date: {
            type: Date
        },
        customer_bank: {
            type: String,
            trim: true
        },
        customer_account: {
            type: String,
            trim: true
        },
        transfer_notes: {
            type: String,
            trim: true
        }
    },
    
    // ✅ COMPROBANTE DE TRANSFERENCIA
    transfer_proof: {
        file_url: {
            type: String,
            trim: true
        },
        file_name: {
            type: String,
            trim: true
        },
        file_size: {
            type: Number
        },
        file_type: {
            type: String,
            trim: true
        },
        uploaded_at: {
            type: Date
        }
    },
    
    // ✅ VERIFICACIÓN POR ADMINISTRADOR
    admin_verification: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'requires_review'],
            default: 'pending'
        },
        verified_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: null
        },
        verification_date: {
            type: Date
        },
        admin_notes: {
            type: String,
            trim: true
        },
        verification_amount: {
            type: Number
        },
        discrepancy_notes: {
            type: String,
            trim: true
        }
    },
    
    // ✅ HISTORIAL DE VERIFICACIONES
    verification_history: [{
        action: {
            type: String,
            enum: ['submitted', 'approved', 'rejected', 'requires_review', 'updated'],
            required: true
        },
        performed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        performed_at: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            trim: true
        },
        previous_status: {
            type: String
        },
        new_status: {
            type: String
        }
    }],
    
    // ✅ NOTIFICACIONES
    notifications: {
        customer_notified_pending: {
            type: Boolean,
            default: false
        },
        customer_notified_approved: {
            type: Boolean,
            default: false
        },
        customer_notified_rejected: {
            type: Boolean,
            default: false
        },
        admin_notified_new: {
            type: Boolean,
            default: false
        },
        whatsapp_sent: {
            type: Boolean,
            default: false
        }
    },
    
    // ✅ INFORMACIÓN DE AUDITORÍA
    audit_info: {
        ip_address: {
            type: String,
            trim: true
        },
        user_agent: {
            type: String,
            trim: true
        },
        session_id: {
            type: String,
            trim: true
        },
        device_type: {
            type: String,
            enum: ['mobile', 'tablet', 'desktop'],
            default: 'desktop'
        }
    },
    
    // ✅ FECHAS IMPORTANTES
    expected_verification_date: {
        type: Date
    },
    
    reminder_sent_at: {
        type: Date
    },
    
    // ✅ CONFIGURACIÓN
    auto_approve_threshold: {
        type: Number,
        default: 0 // Monto bajo el cual se puede auto-aprobar
    },
    
    requires_manual_review: {
        type: Boolean,
        default: false
    }
    
}, {
    timestamps: true
});

// ✅ MIDDLEWARE PARA GENERAR TRANSFER_ID
bankTransferSchema.pre('save', function(next) {
    if (this.isNew && !this.transfer_id) {
        // Generar ID único: TRF-TIMESTAMP-RANDOM
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.transfer_id = `TRF-${timestamp}-${random}`;
    }
    next();
});

// ✅ MIDDLEWARE PARA HISTORIAL DE VERIFICACIONES
bankTransferSchema.pre('save', function(next) {
    if (this.isModified('admin_verification.status') && !this.isNew) {
        const previousStatus = this.admin_verification.status;
        
        this.verification_history.push({
            action: this.admin_verification.status,
            performed_by: this.admin_verification.verified_by,
            performed_at: new Date(),
            notes: this.admin_verification.admin_notes,
            previous_status: previousStatus,
            new_status: this.admin_verification.status
        });
    }
    next();
});

// ✅ MIDDLEWARE PARA FECHA DE VERIFICACIÓN
bankTransferSchema.pre('save', function(next) {
    if (this.isModified('admin_verification.status') && 
        ['approved', 'rejected'].includes(this.admin_verification.status)) {
        this.admin_verification.verification_date = new Date();
    }
    next();
});

// ✅ MÉTODOS VIRTUALES
bankTransferSchema.virtual('formatted_transfer_id').get(function() {
    return this.transfer_id || `TRF-${this._id.toString().slice(-8).toUpperCase()}`;
});

bankTransferSchema.virtual('is_pending').get(function() {
    return this.admin_verification.status === 'pending';
});

bankTransferSchema.virtual('is_approved').get(function() {
    return this.admin_verification.status === 'approved';
});

bankTransferSchema.virtual('is_rejected').get(function() {
    return this.admin_verification.status === 'rejected';
});

bankTransferSchema.virtual('days_since_submission').get(function() {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

bankTransferSchema.virtual('has_proof').get(function() {
    return !!(this.transfer_proof && this.transfer_proof.file_url);
});

// ✅ MÉTODOS DE INSTANCIA
bankTransferSchema.methods.approve = function(adminId, notes, verificationAmount) {
    this.admin_verification.status = 'approved';
    this.admin_verification.verified_by = adminId;
    this.admin_verification.verification_date = new Date();
    this.admin_verification.admin_notes = notes;
    this.admin_verification.verification_amount = verificationAmount || this.customer_transfer_info.transfer_amount;
    
    return this.save();
};

bankTransferSchema.methods.reject = function(adminId, notes, reason) {
    this.admin_verification.status = 'rejected';
    this.admin_verification.verified_by = adminId;
    this.admin_verification.verification_date = new Date();
    this.admin_verification.admin_notes = notes;
    this.admin_verification.discrepancy_notes = reason;
    
    return this.save();
};

bankTransferSchema.methods.requiresReview = function(adminId, notes) {
    this.admin_verification.status = 'requires_review';
    this.admin_verification.verified_by = adminId;
    this.admin_verification.admin_notes = notes;
    this.requires_manual_review = true;
    
    return this.save();
};

bankTransferSchema.methods.uploadProof = function(fileData) {
    this.transfer_proof = {
        file_url: fileData.file_url,
        file_name: fileData.file_name,
        file_size: fileData.file_size,
        file_type: fileData.file_type,
        uploaded_at: new Date()
    };
    
    // Agregar al historial
    this.verification_history.push({
        action: 'updated',
        performed_at: new Date(),
        notes: 'Comprobante de transferencia subido'
    });
    
    return this.save();
};

bankTransferSchema.methods.updateCustomerInfo = function(transferInfo) {
    this.customer_transfer_info = {
        ...this.customer_transfer_info,
        ...transferInfo
    };
    
    return this.save();
};

// ✅ MÉTODOS ESTÁTICOS
bankTransferSchema.statics.findByTransferId = function(transferId) {
    return this.findOne({ transfer_id: transferId })
        .populate('order_id')
        .populate('admin_verification.verified_by', 'name email')
        .populate('verification_history.performed_by', 'name');
};

bankTransferSchema.statics.getPendingTransfers = function() {
    return this.find({ 'admin_verification.status': 'pending' })
        .populate('order_id')
        .populate('admin_verification.verified_by', 'name email')
        .sort({ createdAt: -1 });
};

bankTransferSchema.statics.getTransfersByStatus = function(status) {
    return this.find({ 'admin_verification.status': status })
        .populate('order_id')
        .populate('admin_verification.verified_by', 'name email')
        .sort({ createdAt: -1 });
};

bankTransferSchema.statics.getOverdueTransfers = function(days = 3) {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - days);
    
    return this.find({
        'admin_verification.status': 'pending',
        createdAt: { $lt: overdueDate }
    })
    .populate('order_id')
    .sort({ createdAt: 1 });
};

bankTransferSchema.statics.getTransferStats = function(startDate, endDate) {
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
                _id: '$admin_verification.status',
                count: { $sum: 1 },
                total_amount: { $sum: '$customer_transfer_info.transfer_amount' },
                avg_amount: { $avg: '$customer_transfer_info.transfer_amount' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

bankTransferSchema.statics.getAdminWorkload = function(adminId) {
    return this.aggregate([
        {
            $match: {
                'admin_verification.verified_by': adminId,
                'admin_verification.verification_date': {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        },
        {
            $group: {
                _id: '$admin_verification.status',
                count: { $sum: 1 }
            }
        }
    ]);
};

// ✅ ÍNDICES PARA MEJORAR RENDIMIENTO
bankTransferSchema.index({ transfer_id: 1 });
bankTransferSchema.index({ order_id: 1 });
bankTransferSchema.index({ 'admin_verification.status': 1 });
bankTransferSchema.index({ 'admin_verification.verified_by': 1 });
bankTransferSchema.index({ createdAt: -1 });
bankTransferSchema.index({ 'customer_transfer_info.reference_number': 1 });
bankTransferSchema.index({ 'admin_verification.verification_date': -1 });

// ✅ CONFIGURAR VIRTUALS EN JSON
bankTransferSchema.set('toJSON', { virtuals: true });
bankTransferSchema.set('toObject', { virtuals: true });

const BankTransferModel = mongoose.model('bank_transfer', bankTransferSchema);

module.exports = BankTransferModel;