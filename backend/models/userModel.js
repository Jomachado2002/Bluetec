// backend/models/userModel.js - VERSIÓN COMPLETA MEJORADA CON BANCARD

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    profilePic: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['ADMIN', 'GENERAL'],
        default: 'GENERAL'
    },
    
    // ✅ CAMPOS PARA PERFIL
    address: {
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        zipCode: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            default: 'Paraguay',
            trim: true
        }
    },
    
    dateOfBirth: {
        type: Date
    },
    
    // ✅ CAMPOS PARA RECUPERACIÓN DE CONTRASEÑA
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
    
    // ✅ CAMPO CRÍTICO PARA BANCARD - MEJORADO
    bancardUserId: {
        type: Number, // ID único numérico para Bancard
        unique: true,
        sparse: true // Permite valores null/undefined únicos
    },
    
    // ✅ INFORMACIÓN ADICIONAL
    isActive: {
        type: Boolean,
        default: true
    },
    
    lastLogin: {
        type: Date
    },
    
    emailVerified: {
        type: Boolean,
        default: false
    },
    
    emailVerificationToken: {
        type: String
    }
    
}, {
    timestamps: true
});

// ✅ MIDDLEWARE MEJORADO PARA GENERAR bancardUserId
userSchema.pre('save', async function(next) {
    // Solo generar bancardUserId si es un nuevo usuario y no tiene uno
    if (this.isNew && !this.bancardUserId) {
        try {
            console.log('🔄 Generando bancardUserId para nuevo usuario:', this.email);
            
            let isUnique = false;
            let newBancardUserId;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!isUnique && attempts < maxAttempts) {
                // ✅ GENERAR NÚMERO ENTRE 100000 y 999999 (6 dígitos)
                // Esto es más seguro y evita conflictos
                newBancardUserId = Math.floor(100000 + Math.random() * 900000);
                
                // Verificar que no existe
                const existingUser = await this.constructor.findOne({ 
                    bancardUserId: newBancardUserId 
                });
                
                if (!existingUser) {
                    isUnique = true;
                } else {
                    attempts++;
                    console.log(`⚠️ bancardUserId ${newBancardUserId} ya existe, reintentando... (${attempts}/${maxAttempts})`);
                }
            }
            
            if (isUnique) {
                this.bancardUserId = newBancardUserId;
                console.log(`✅ bancardUserId generado: ${newBancardUserId} para usuario: ${this.email}`);
            } else {
                console.error('❌ No se pudo generar bancardUserId único después de', maxAttempts, 'intentos');
                // En caso de emergencia, usar timestamp
                this.bancardUserId = parseInt(Date.now().toString().slice(-6));
                console.log(`🆘 Usando bancardUserId de emergencia: ${this.bancardUserId}`);
            }
        } catch (error) {
            console.error('❌ Error generando bancardUserId:', error);
            // Fallback: usar timestamp truncado
            this.bancardUserId = parseInt(Date.now().toString().slice(-6));
        }
    }
    next();
});

// ✅ MÉTODO ESTÁTICO PARA ASIGNAR bancardUserId A USUARIOS EXISTENTES
userSchema.statics.assignBancardUserIds = async function() {
    try {
        console.log('🔄 Asignando bancardUserId a usuarios existentes...');
        
        const usersWithoutBancardId = await this.find({ 
            $or: [
                { bancardUserId: { $exists: false } },
                { bancardUserId: null },
                { bancardUserId: undefined }
            ]
        });
        
        console.log(`📋 Encontrados ${usersWithoutBancardId.length} usuarios sin bancardUserId`);
        
        for (const user of usersWithoutBancardId) {
            let isUnique = false;
            let newBancardUserId;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!isUnique && attempts < maxAttempts) {
                newBancardUserId = Math.floor(100000 + Math.random() * 900000);
                
                const existingUser = await this.findOne({ 
                    bancardUserId: newBancardUserId 
                });
                
                if (!existingUser) {
                    isUnique = true;
                } else {
                    attempts++;
                }
            }
            
            if (isUnique) {
                await this.findByIdAndUpdate(user._id, { 
                    bancardUserId: newBancardUserId 
                });
                console.log(`✅ Asignado bancardUserId ${newBancardUserId} a ${user.email}`);
            } else {
                const emergencyId = parseInt(Date.now().toString().slice(-6));
                await this.findByIdAndUpdate(user._id, { 
                    bancardUserId: emergencyId 
                });
                console.log(`🆘 Asignado bancardUserId de emergencia ${emergencyId} a ${user.email}`);
            }
        }
        
        console.log('✅ Proceso de asignación completado');
        return true;
    } catch (error) {
        console.error('❌ Error asignando bancardUserIds:', error);
        return false;
    }
};

// ✅ MÉTODOS VIRTUALES
userSchema.virtual('fullAddress').get(function() {
    if (!this.address) return '';
    
    const parts = [
        this.address.street,
        this.address.city,
        this.address.state,
        this.address.zipCode,
        this.address.country
    ].filter(Boolean);
    
    return parts.join(', ');
});

// ✅ MÉTODOS DE INSTANCIA
userSchema.methods.toPublicJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;
    delete userObject.emailVerificationToken;
    return userObject;
};

// ✅ MÉTODO PARA OBTENER DATOS SEGUROS (COMPATIBLE CON TU CÓDIGO EXISTENTE)
userSchema.methods.getSafeData = function() {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        bancardUserId: this.bancardUserId,
        phone: this.phone,
        address: this.address,
        dateOfBirth: this.dateOfBirth,
        profilePic: this.profilePic,
        isActive: this.isActive,
        emailVerified: this.emailVerified,
        lastLogin: this.lastLogin,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// ✅ MÉTODOS ESTÁTICOS
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true });
};

userSchema.statics.findByBancardUserId = function(bancardUserId) {
    return this.findOne({ bancardUserId: parseInt(bancardUserId) });
};

// ✅ MÉTODO PARA VERIFICAR SI UN USUARIO PUEDE USAR BANCARD
userSchema.methods.canUseBancard = function() {
    return !!(this.bancardUserId && this.email && this.name);
};

// ✅ MÉTODO PARA OBTENER DATOS PARA BANCARD
userSchema.methods.getBancardData = function() {
    if (!this.canUseBancard()) {
        return null;
    }
    
    return {
        user_id: this.bancardUserId,
        user_mail: this.email,
        user_cell_phone: this.phone || '12345678',
        user_name: this.name
    };
};

// ✅ ÍNDICES PARA MEJORAR RENDIMIENTO
userSchema.index({ email: 1 });
userSchema.index({ bancardUserId: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;