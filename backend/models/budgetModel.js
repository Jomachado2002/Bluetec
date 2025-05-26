// backend/models/budgetModel.js - SOLUCIÓN DEFINITIVA
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    budgetNumber: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            // Generar un número temporal que será reemplazado por el hook pre('save')
            return `TEMP-${Date.now()}`;
        }
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product'
        },
        productSnapshot: {
            name: String,
            price: Number,
            description: String,
            category: String,
            subcategory: String,
            brandName: String
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        enum: ['PYG', 'USD'],
        default: 'PYG'
    },
    exchangeRate: {
        type: Number,
        default: 7300
    },
    notes: String,
    validUntil: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'],
        default: 'draft'
    },
    paymentTerms: {
        type: String
    },
    deliveryMethod: {
        type: String
    },
    createdBy: {
        type: String,
        required: true,
        default: '000000000000000000000000'
    },
    pdfPath: {
        type: String
    }
}, {
    timestamps: true
});

// Hook pre('save') mejorado y más robusto
budgetSchema.pre('save', async function(next) {
    try {
        console.log('Hook pre(save) ejecutándose...');
        console.log('Documento isNew:', this.isNew);
        console.log('budgetNumber actual:', this.budgetNumber);
        
        // Solo generar budgetNumber si es un documento nuevo Y tiene un número temporal
        if (this.isNew && (this.budgetNumber.startsWith('TEMP-') || !this.budgetNumber || this.budgetNumber === '')) {
            console.log('Generando nuevo budgetNumber...');
            
            // Buscar el último presupuesto para obtener el siguiente número
            const lastBudget = await this.constructor.findOne(
                { budgetNumber: { $regex: /^PRES-\d+$/ } }, // Solo buscar números reales, no temporales
                { budgetNumber: 1 }, 
                { sort: { createdAt: -1 } }
            );
            
            let nextNumber = 1;
            
            if (lastBudget && lastBudget.budgetNumber) {
                console.log('Último presupuesto encontrado:', lastBudget.budgetNumber);
                // Extraer la parte numérica del último presupuesto
                const match = lastBudget.budgetNumber.match(/PRES-(\d+)/);
                if (match && match[1]) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }
            
            this.budgetNumber = `PRES-${nextNumber.toString().padStart(5, '0')}`;
            console.log(`Nuevo budgetNumber generado: ${this.budgetNumber}`);
        }

        next();
    } catch (error) {
        console.error('Error en hook pre(save):', error);
        // En caso de error, asignar un número basado en timestamp único
        const timestamp = Date.now().toString().slice(-5);
        this.budgetNumber = `PRES-${timestamp}`;
        console.log(`BudgetNumber de emergencia generado: ${this.budgetNumber}`);
        next();
    }
});

const budgetModel = mongoose.model("budget", budgetSchema);
module.exports = budgetModel;