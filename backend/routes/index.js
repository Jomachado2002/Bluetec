// backend/routes/index.js - VERSIÓN ACTUALIZADA CON BANCARD TRANSACTIONS
const express = require('express');
const router = express.Router();

// ===== CONTROLADORES EXISTENTES =====
const userSignUpController = require("../controller/user/userSignUp");
const userSignInController = require('../controller/user/userSignin');
const userDetailsController = require('../controller/user/userDetails');
const authToken = require('../middleware/authToken');
const userLogout = require('../controller/user/userLogout');
const allUsers = require('../controller/user/allUser');
const updateUser = require('../controller/user/updateUser');
const UploadProductController = require('../controller/product/uploadProduct');
const getProductController = require('../controller/product/getProduct');
const { updateProductController} = require('../controller/product/updateProduct');
const getCategoryProduct = require('../controller/product/getCategoryProduct');
const getCategoryWiseProduct = require('../controller/product/getCategoryWiseProduct');
const getProductDetails = require('../controller/product/getProductDetails');
const { updateAllPricesController } = require('../controller/product/updateAllPrices');
const searchProduct = require('../controller/product/searchProduct');
const filterProductController = require('../controller/product/filterProduct');
const requestPasswordReset = require('../controller/user/requestPasswordReset');
const resetPassword = require('../controller/user/resetPassword');
const getCategorySearch = require('../controller/product/getCategorySearch');
const { deleteProductController } = require('../controller/product/deleteproductcontrolle');
const getProductBySlug = require('../controller/product/getProductBySlug');

// ===== CONTROLADORES DE FINANZAS =====
const { updateProductFinanceController, getProductFinanceController } = require('../controller/product/updateProductFinance');
const { getMarginReportController, getCategoryProfitabilityController } = require('../controller/reports/financialReportsController');

// ===== CONTROLADORES DE BANCARD =====
const { 
    bancardConfirmController,
    createPaymentController,
    testBancardSimpleController,
    getTransactionStatusController,
    bancardHealthController,
    rollbackPaymentController
} = require('../controller/bancard/bancardController');

// ✅ NUEVOS CONTROLADORES DE TRANSACCIONES BANCARD
const {
    getAllBancardTransactionsController,
    getBancardTransactionByIdController,
    rollbackBancardTransactionController,
    checkBancardTransactionStatusController,
    createBancardTransactionController
} = require('../controller/bancard/bancardTransactionsController');

// ===== CONTROLADORES DE CLIENTES =====
const { 
    createClientController, 
    getAllClientsController, 
    getClientByIdController, 
    updateClientController, 
    deleteClientController 
} = require('../controller/client/clientController');

// ===== CONTROLADORES DE PRESUPUESTOS =====
const { 
    createBudgetController,
    getAllBudgetsController, 
    getBudgetByIdController, 
    updateBudgetStatusController, 
    getBudgetPDFController,
    deleteBudgetController,
    sendBudgetEmailController
} = require('../controller/budget/budgetController');

// ===== CONTROLADORES DE PROVEEDORES =====
const { 
    createSupplierController, 
    getAllSuppliersController, 
    getSupplierByIdController, 
    updateSupplierController, 
    deleteSupplierController 
} = require('../controller/supplier/supplierController');

// ===== CONTROLADORES DE ANÁLISIS DE RENTABILIDAD =====
const {
    createProfitabilityAnalysisController,
    getAllProfitabilityAnalysesController,
    getProfitabilityAnalysisByIdController,
    compareSupplierPricesController,
    updateAnalysisStatusController,
    deleteAnalysisController,
    getSupplierProfitabilitySummaryController
} = require('../controller/profitability/profitabilityController');

// ===== CONTROLADORES DE VENTAS Y COMPRAS =====
const {
    createSaleController,
    getAllSalesController,
    getSaleByIdController,
    updateSalePaymentController,
    uploadSaleInvoiceController,
    deleteSaleController
} = require('../controller/sales/salesController');

const {
    createPurchaseController,
    getAllPurchasesController,
    getPurchaseByIdController,
    updatePurchasePaymentController,
    uploadPurchaseDocumentsController,
    getPurchasesSummaryController,
    deletePurchaseController
} = require('../controller/purchases/purchasesController');

// ===== CONTROLADORES DE DASHBOARD =====
const {
    getDashboardSummaryController,
    getAccountStatementController,
    getYearlyMetricsController
} = require('../controller/dashboard/dashboardController');

// ===========================================
// RUTAS DE BANCARD (PAGOS) - ✅ MEJORADAS
// ===========================================
router.post("/bancard/confirm", bancardConfirmController);
router.get("/bancard/confirm", (req, res) => {
    res.status(200).json({
        message: "Endpoint de confirmación de Bancard activo",
        method: "Este endpoint acepta POST para confirmaciones de pago",
        timestamp: new Date().toISOString(),
        status: "ready",
        service: "bancard-confirmation"
    });
});
router.post("/bancard/create-payment", createPaymentController);
router.post("/bancard/test-simple", testBancardSimpleController);
router.get("/bancard/status/:transactionId", getTransactionStatusController);
router.get("/bancard/health", bancardHealthController);
router.post("/bancard/rollback", rollbackPaymentController);

// ✅ NUEVAS RUTAS PARA GESTIÓN DE TRANSACCIONES BANCARD
router.get("/bancard/transactions", authToken, getAllBancardTransactionsController);
router.get("/bancard/transactions/:transactionId", authToken, getBancardTransactionByIdController);
router.post("/bancard/transactions/:transactionId/rollback", authToken, rollbackBancardTransactionController);
router.get("/bancard/transactions/:transactionId/status", authToken, checkBancardTransactionStatusController);
router.post("/bancard/transactions", authToken, createBancardTransactionController);

// ===== ENDPOINT DE VERIFICACIÓN DE CONFIGURACIÓN BANCARD =====
router.get("/bancard/config-check", (req, res) => {
    const { validateBancardConfig } = require('../helpers/bancardUtils');
    const validation = validateBancardConfig();
    
    res.json({
        message: "Verificación de configuración de Bancard",
        success: validation.isValid,
        error: !validation.isValid,
        data: {
            isValid: validation.isValid,
            errors: validation.errors,
            environment: process.env.BANCARD_ENVIRONMENT || 'staging',
            hasPublicKey: !!process.env.BANCARD_PUBLIC_KEY,
            hasPrivateKey: !!process.env.BANCARD_PRIVATE_KEY,
            publicKeyLength: process.env.BANCARD_PUBLIC_KEY ? process.env.BANCARD_PUBLIC_KEY.length : 0,
            privateKeyLength: process.env.BANCARD_PRIVATE_KEY ? process.env.BANCARD_PRIVATE_KEY.length : 0,
            baseUrl: validation.config?.baseUrl,
            confirmationUrl: process.env.BANCARD_CONFIRMATION_URL
        }
    });
});

// ===== ENDPOINT DE PRUEBA PARA BANCARD =====
router.post("/bancard/test-payment", (req, res) => {
    try {
        console.log("🧪 Endpoint de prueba para Bancard");
        
        const testPayment = {
            amount: "10000.00",
            currency: "PYG",
            description: "Pago de prueba - BlueTec",
            return_url: `${process.env.FRONTEND_URL || 'https://www.bluetec.com.py'}/pago-exitoso`,
            cancel_url: `${process.env.FRONTEND_URL || 'https://www.bluetec.com.py'}/pago-cancelado`,
            iva_amount: "909.09"
        };
        
        req.body = testPayment;
        createPaymentController(req, res);
        
    } catch (error) {
        console.error("❌ Error en test de pago:", error);
        res.status(500).json({
            message: "Error en test de pago",
            success: false,
            error: true,
            details: error.message
        });
    }
});

// ===== ENDPOINT DE TEST DE CONECTIVIDAD =====
router.get("/bancard/connection-test", async (req, res) => {
    try {
        const axios = require('axios');
        const { getBancardBaseUrl } = require('../helpers/bancardUtils');
        
        const testUrl = `${getBancardBaseUrl()}/vpos/api/0.3/`;
        
        const response = await axios.get(testUrl, {
            timeout: 10000,
            validateStatus: () => true
        });
        
        res.json({
            message: "Test de conexión con Bancard",
            success: true,
            error: false,
            data: {
                url: testUrl,
                status: response.status,
                reachable: response.status < 500,
                environment: process.env.BANCARD_ENVIRONMENT || 'staging'
            }
        });
        
    } catch (error) {
        res.json({
            message: "Test de conexión con Bancard",
            success: false,
            error: true,
            data: {
                error: error.message,
                reachable: false,
                environment: process.env.BANCARD_ENVIRONMENT || 'staging'
            }
        });
    }
});

// ===========================================
// RUTAS DE USUARIO
// ===========================================
router.post("/registro", userSignUpController);
router.post("/iniciar-sesion", userSignInController);
router.get("/detalles-usuario", authToken, userDetailsController);
router.get("/cerrar-sesion", userLogout);
router.get("/todos-usuarios", authToken, allUsers);
router.post("/actualizar-usuario", authToken, updateUser);

// ===========================================
// RUTAS DE PRODUCTOS
// ===========================================
router.post("/cargar-producto", authToken, UploadProductController);
router.get("/obtener-productos", getProductController);
router.post("/actualizar-producto", authToken, updateProductController);
router.get("/obtener-categorias", getCategoryProduct);
router.post("/productos-por-categoria", getCategoryWiseProduct);
router.post("/detalles-producto", getProductDetails);
router.get("/buscar", searchProduct);
router.post("/filtrar-productos", filterProductController);
router.post("/solicitar-restablecer-contrasena", requestPasswordReset);
router.post("/restablecer-contrasena", resetPassword);
router.get("/buscar-por-categoria", getCategorySearch);
router.post("/eliminar-producto", authToken, deleteProductController);
router.get("/producto-por-slug/:slug", getProductBySlug);
router.post("/finanzas/actualizarprecios", authToken, updateAllPricesController);

// ===========================================
// RUTAS DE GESTIÓN FINANCIERA DE PRODUCTOS
// ===========================================
router.post("/finanzas/producto/finanzas", authToken, updateProductFinanceController);
router.get("/finanzas/producto/finanzas/:productId", authToken, getProductFinanceController);

// ===========================================
// RUTAS DE REPORTES FINANCIEROS
// ===========================================
router.get("/finanzas/reportes/margenes", authToken, getMarginReportController);
router.get("/finanzas/reportes/rentabilidad", authToken, getCategoryProfitabilityController);

// ===========================================
// RUTAS DE CLIENTES
// ===========================================
router.post("/finanzas/clientes", authToken, createClientController);
router.get("/finanzas/clientes", authToken, getAllClientsController);
router.get("/finanzas/clientes/:clientId", authToken, getClientByIdController);
router.put("/finanzas/clientes/:clientId", authToken, updateClientController);
router.delete("/finanzas/clientes/:clientId", authToken, deleteClientController);

// ===========================================
// RUTAS DE PRESUPUESTOS
// ===========================================
router.post("/finanzas/presupuestos", authToken, createBudgetController);
router.get("/finanzas/presupuestos", authToken, getAllBudgetsController);
router.get("/finanzas/presupuestos/:budgetId", authToken, getBudgetByIdController);
router.patch("/finanzas/presupuestos/:budgetId/estado", authToken, updateBudgetStatusController);
router.get("/finanzas/presupuestos/:budgetId/pdf", authToken, getBudgetPDFController);
router.delete("/finanzas/presupuestos/:budgetId", authToken, deleteBudgetController);
router.post("/finanzas/presupuestos/:budgetId/email", authToken, sendBudgetEmailController);

// ===========================================
// RUTAS DE PROVEEDORES
// ===========================================
router.post("/finanzas/proveedores", authToken, createSupplierController);
router.get("/finanzas/proveedores", authToken, getAllSuppliersController);
router.get("/finanzas/proveedores/:supplierId", authToken, getSupplierByIdController);
router.put("/finanzas/proveedores/:supplierId", authToken, updateSupplierController);
router.delete("/finanzas/proveedores/:supplierId", authToken, deleteSupplierController);

// ===========================================
// RUTAS DE ANÁLISIS DE RENTABILIDAD
// ===========================================
router.post("/finanzas/analisis-rentabilidad", authToken, createProfitabilityAnalysisController);
router.get("/finanzas/analisis-rentabilidad", authToken, getAllProfitabilityAnalysesController);
router.get("/finanzas/analisis-rentabilidad/:analysisId", authToken, getProfitabilityAnalysisByIdController);
router.post("/finanzas/comparar-proveedores", authToken, compareSupplierPricesController);
router.patch("/finanzas/analisis-rentabilidad/:analysisId/estado", authToken, updateAnalysisStatusController);
router.delete("/finanzas/analisis-rentabilidad/:analysisId", authToken, deleteAnalysisController);
router.get("/finanzas/proveedores/:supplierId/rentabilidad", authToken, getSupplierProfitabilitySummaryController);

// ===========================================
// RUTAS DE VENTAS
// ===========================================
router.post("/finanzas/ventas", authToken, createSaleController);
router.get("/finanzas/ventas", authToken, getAllSalesController);
router.get("/finanzas/ventas/:saleId", authToken, getSaleByIdController);
router.patch("/finanzas/ventas/:saleId/pago", authToken, updateSalePaymentController);
router.post("/finanzas/ventas/:saleId/factura", authToken, uploadSaleInvoiceController);
router.delete("/finanzas/ventas/:saleId", authToken, deleteSaleController);

// ===========================================
// RUTAS DE COMPRAS
// ===========================================
router.post("/finanzas/compras", authToken, createPurchaseController);
router.get("/finanzas/compras", authToken, getAllPurchasesController);
router.get("/finanzas/compras/:purchaseId", authToken, getPurchaseByIdController);
router.patch("/finanzas/compras/:purchaseId/pago", authToken, updatePurchasePaymentController);
router.post("/finanzas/compras/:purchaseId/documentos", authToken, uploadPurchaseDocumentsController);
router.get("/finanzas/compras/resumen", authToken, getPurchasesSummaryController);
router.delete("/finanzas/compras/:purchaseId", authToken, deletePurchaseController);

// ===========================================
// RUTAS DE DASHBOARD
// ===========================================
router.get("/finanzas/dashboard", authToken, getDashboardSummaryController);
router.get("/finanzas/estado-cuenta", authToken, getAccountStatementController);
router.get("/finanzas/metricas-anuales", authToken, getYearlyMetricsController);

// ===========================================
// RUTAS DE SALUD Y MONITOREO
// ===========================================
router.get("/health", (req, res) => {
    res.status(200).json({
        message: "API funcionando correctamente",
        timestamp: new Date().toISOString(),
        success: true,
        error: false,
        environment: process.env.NODE_ENV || 'development',
        version: "1.0.0"
    });
});

module.exports = router;