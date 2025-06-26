// backend/models/userModel.js - VERSIÓN ACTUALIZADA
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
    
    // ✅ NUEVOS CAMPOS PARA PERFIL
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
    
    // ✅ CAMPOS ADICIONALES PARA BANCARD
    bancardUserId: {
        type: Number, // ID único para Bancard
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
    timestamps: true // Para incluir automáticamente createdAt y updatedAt
});

// ✅ MIDDLEWARE PARA GENERAR bancardUserId AUTOMÁTICAMENTE
userSchema.pre('save', async function(next) {
    // Solo generar bancardUserId si es un nuevo usuario y no tiene uno
    if (this.isNew && !this.bancardUserId) {
        try {
            // Generar un ID único para Bancard (número entero)
            let isUnique = false;
            let newBancardUserId;
            
            while (!isUnique) {
                // Generar número entre 1000000 y 9999999 (7 dígitos)
                newBancardUserId = Math.floor(1000000 + Math.random() * 9000000);
                
                // Verificar que no existe
                const existingUser = await this.constructor.findOne({ 
                    bancardUserId: newBancardUserId 
                });
                
                if (!existingUser) {
                    isUnique = true;
                }
            }
            
            this.bancardUserId = newBancardUserId;
            console.log(`✅ BancardUserId generado: ${newBancardUserId} para usuario: ${this.email}`);
        } catch (error) {
            console.error('Error generando bancardUserId:', error);
        }
    }
    next();
});

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

// ✅ MÉTODOS ESTÁTICOS
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true });
};

// ✅ ÍNDICES PARA MEJORAR RENDIMIENTO
userSchema.index({ email: 1 });
userSchema.index({ bancardUserId: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ createdAt: 1 });

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;