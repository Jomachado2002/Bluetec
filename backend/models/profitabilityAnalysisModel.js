// backend/models/profitabilityAnalysisModel.js
const mongoose = require('mongoose');

const profitabilityAnalysisSchema = new mongoose.Schema({
    // Número único del análisis
    analysisNumber: {
        type: String,
        required: true,
        unique: true
    },
    
    // Relaciones
    budget: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'budget',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'client',
        required: true
    },
    
    // Items del análisis
    items: [{
        // Información del producto
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product'
        },
        productSnapshot: {
            name: String,
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
        
        // Información del proveedor
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'supplier',
            required: true
        },
        supplierSnapshot: {
            name: String,
            contactPerson: String,
            phone: String,
            email: String
        },
        
        // Costos
        purchasePrice: {
            type: Number,
            required: true,
            min: 0
        },
        purchaseCurrency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'PYG', 'EUR']
        },
        exchangeRate: {
            type: Number,
            default: 7300
        },
        purchasePricePYG: {
            type: Number,
            required: true
        },
        shippingCost: {
            type: Number,
            default: 0
        },
        customsCost: {
            type: Number,
            default: 0
        },
        otherCosts: {
            type: Number,
            default: 0
        },
        totalCostPerUnit: {
            type: Number,
            required: true
        },
        
        // Precios de venta
        sellingPrice: {
            type: Number,
            required: true
        },
        
        // Análisis calculado
        grossProfit: {
            type: Number,
            required: true
        },
        profitMargin: {
            type: Number,
            required: true
        },
        totalGrossProfit: {
            type: Number,
            required: true
        },
        
        // Metadatos del item
        notes: String,
        deliveryTime: String // Tiempo estimado de entrega del proveedor
    }],
    
    // Resumen total del análisis
    totals: {
        totalPurchaseCost: {
            type: Number,
            required: true
        },
        totalShippingCost: {
            type: Number,
            required: true
        },
        totalOtherCosts: {
            type: Number,
            required: true
        },
        totalCosts: {
            type: Number,
            required: true
        },
        totalRevenue: {
            type: Number,
            required: true
        },
        totalGrossProfit: {
            type: Number,
            required: true
        },
        averageProfitMargin: {
            type: Number,
            required: true
        },
        totalQuantity: {
            type: Number,
            required: true
        }
    },
    
    // Estado y metadatos
    status: {
        type: String,
        enum: ['draft', 'confirmed', 'completed', 'cancelled'],
        default: 'draft'
    },
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    
    // Fechas importantes
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    orderPlacedDate: Date
}, {
    timestamps: true
});

// Pre-save hook para generar número de análisis
profitabilityAnalysisSchema.pre('save', async function(next) {
    try {
        if (this.isNew && !this.analysisNumber) {
            const lastAnalysis = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
            
            if (lastAnalysis && lastAnalysis.analysisNumber) {
                const lastNumberStr = lastAnalysis.analysisNumber.split('-')[1];
                if (!lastNumberStr) {
                    this.analysisNumber = 'ANAL-00001';
                } else {
                    const lastNumber = parseInt(lastNumberStr);
                    this.analysisNumber = `ANAL-${(lastNumber + 1).toString().padStart(5, '0')}`;
                }
            } else {
                this.analysisNumber = 'ANAL-00001';
            }
        }
        next();
    } catch (error) {
        console.error('Error generando analysisNumber:', error);
        this.analysisNumber = `ANAL-${Date.now().toString().slice(-5)}`;
        next();
    }
});

// Pre-save hook para calcular totales
profitabilityAnalysisSchema.pre('save', function(next) {
    // Calcular totales automáticamente
    let totalPurchaseCost = 0;
    let totalShippingCost = 0;
    let totalOtherCosts = 0;
    let totalRevenue = 0;
    let totalGrossProfit = 0;
    let totalQuantity = 0;
    
    this.items.forEach(item => {
        const quantity = item.quantity;
        totalQuantity += quantity;
        totalPurchaseCost += item.purchasePricePYG * quantity;
        totalShippingCost += item.shippingCost * quantity;
        totalOtherCosts += (item.customsCost + item.otherCosts) * quantity;
        totalRevenue += item.sellingPrice * quantity;
        
        // Calcular totales del item
        item.totalCostPerUnit = item.purchasePricePYG + item.shippingCost + item.customsCost + item.otherCosts;
        item.grossProfit = item.sellingPrice - item.totalCostPerUnit;
        item.profitMargin = item.sellingPrice > 0 ? (item.grossProfit / item.sellingPrice) * 100 : 0;
        item.totalGrossProfit = item.grossProfit * quantity;
        
        totalGrossProfit += item.totalGrossProfit;
    });
    
    const totalCosts = totalPurchaseCost + totalShippingCost + totalOtherCosts;
    const averageProfitMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    
    this.totals = {
        totalPurchaseCost,
        totalShippingCost,
        totalOtherCosts,
        totalCosts,
        totalRevenue,
        totalGrossProfit,
        averageProfitMargin,
        totalQuantity
    };
    
    next();
});

// Índices
profitabilityAnalysisSchema.index({ analysisNumber: 1 }, { unique: true });
profitabilityAnalysisSchema.index({ budget: 1 });
profitabilityAnalysisSchema.index({ client: 1 });
profitabilityAnalysisSchema.index({ status: 1 });
profitabilityAnalysisSchema.index({ createdAt: -1 });

const profitabilityAnalysisModel = mongoose.model("profitabilityAnalysis", profitabilityAnalysisSchema);
module.exports = profitabilityAnalysisModel;