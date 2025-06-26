// backend/routes/index.js - VERSIÓN COMPLETA CON MEJORAS PARA CERTIFICACIÓN
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
    bancardConfirmGetController, 
    createPaymentController,
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
// RUTAS DE BANCARD (PAGOS) - ✅ MEJORADAS PARA CERTIFICACIÓN
// ===========================================
router.post("/bancard/confirm", bancardConfirmController);
router.get("/bancard/confirm", bancardConfirmGetController);

router.post("/bancard/create-payment", createPaymentController);
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

// ===== ENDPOINT DE PRUEBA PARA BANCARD - SIMPLIFICADO =====
router.post("/bancard/test-payment", (req, res) => {
    try {
        console.log("🧪 Endpoint de prueba para Bancard");
        
        const testPayment = {
            amount: "10000.00",
            currency: "PYG",
            description: "Pago de prueba - BlueTec",
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

// ===== 🚀 NUEVOS ENDPOINTS PARA CERTIFICACIÓN BANCARD =====

// ===== ENDPOINT DE TEST PARA ROLLBACK (CERTIFICACIÓN) =====
router.post("/bancard/test-rollback", async (req, res) => {
    try {
        console.log("🔄 === TEST DE ROLLBACK PARA CERTIFICACIÓN ===");
        
        const { shop_process_id } = req.body;
        
        if (!shop_process_id) {
            return res.status(400).json({
                message: "shop_process_id es requerido para test de rollback",
                success: false,
                error: true,
                example: { shop_process_id: "123456789" }
            });
        }

        // ✅ USAR TUS HELPERS EXISTENTES
        const { validateBancardConfig, getBancardBaseUrl } = require('../helpers/bancardUtils');
        
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración de Bancard",
                errors: configValidation.errors,
                success: false,
                error: true
            });
        }

        // ✅ GENERAR TOKEN USANDO TU LÓGICA EXISTENTE
        const crypto = require('crypto');
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}${shop_process_id}rollback0.00`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                shop_process_id: parseInt(shop_process_id)
            }
        };

        console.log("📤 Payload de rollback test:", JSON.stringify(payload, null, 2));

        const axios = require('axios');
        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/single_buy/rollback`;
        
        const response = await axios.post(bancardUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de Bancard:", response.status, JSON.stringify(response.data, null, 2));

        // ✅ VERIFICAR SI EXISTE LA TRANSACCIÓN EN TU BD
        const BancardTransactionModel = require('../models/bancardTransactionModel');
        const transaction = await BancardTransactionModel.findOne({ 
            shop_process_id: parseInt(shop_process_id) 
        });

        // ✅ ACTUALIZAR SI ES EXITOSO Y EXISTE
        if (response.status === 200 && response.data.status === 'success' && transaction) {
            await BancardTransactionModel.findByIdAndUpdate(transaction._id, {
                is_rolled_back: true,
                rollback_date: new Date(),
                rollback_reason: 'Test de rollback para certificación Bancard',
                status: 'rolled_back'
            });
            console.log("✅ Transacción marcada como rollback en BD");
        }

        res.json({
            message: "Test de rollback completado",
            success: response.status === 200 && response.data.status === 'success',
            error: false,
            data: {
                bancard_response: response.data,
                local_transaction_found: !!transaction,
                local_transaction_updated: response.status === 200 && response.data.status === 'success' && !!transaction,
                shop_process_id: shop_process_id,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("❌ Error en test de rollback:", error);
        
        let errorMessage = "Error al procesar test de rollback";
        let errorDetails = error.message;
        
        if (error.response?.data) {
            errorDetails = error.response.data;
            console.log("📥 Error response de Bancard:", error.response.data);
        }
        
        res.status(500).json({
            message: errorMessage,
            success: false,
            error: true,
            details: errorDetails
        });
    }
});
router.post("/bancard/manual-rollback-test", async (req, res) => {
    try {
        console.log("🧪 === PRUEBA MANUAL DE ROLLBACK PARA CERTIFICACIÓN ===");
        
        const { shop_process_id, reason = "Prueba manual de rollback para certificación Bancard" } = req.body;
        
        if (!shop_process_id) {
            return res.status(400).json({
                message: "shop_process_id es requerido",
                success: false,
                error: true,
                example: { shop_process_id: "123456789", reason: "Motivo del rollback" }
            });
        }

        // Usar el controlador existente de rollback
        const { rollbackPaymentController } = require('../controller/bancard/bancardController');
        
        // Simular request con datos de rollback
        req.body = { shop_process_id, reason };
        
        await rollbackPaymentController(req, res);
        
    } catch (error) {
        console.error("❌ Error en prueba de rollback:", error);
        res.status(500).json({
            message: "Error en prueba de rollback",
            success: false,
            error: true,
            details: error.message
        });
    }
});
// ===== ENDPOINT PARA VERIFICAR CERTIFICACIÓN =====
router.get("/bancard/verify-certification", (req, res) => {
    const { validateBancardConfig, getBancardBaseUrl } = require('../helpers/bancardUtils');
    const validation = validateBancardConfig();
    
    res.json({
        message: "Verificación de certificación Bancard",
        success: validation.isValid,
        error: !validation.isValid,
        data: {
            configuration_valid: validation.isValid,
            configuration_errors: validation.errors || [],
            environment: process.env.BANCARD_ENVIRONMENT || 'staging',
            base_url: getBancardBaseUrl(),
            confirmation_url: process.env.BANCARD_CONFIRMATION_URL,
            endpoints_available: {
                confirmation: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/confirm`,
                health: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/health`,
                config_check: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/config-check`,
                test_rollback: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/test-rollback`,
                verify_certification: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/verify-certification`
            },
            certification_status: {
                confirmation_endpoint: "✅ Configurado",
                rollback_endpoint: "✅ Configurado", 
                payment_creation: "✅ Configurado",
                transaction_query: "✅ Configurado",
                test_endpoints: "✅ Configurado"
            },
            checklist: {
                "Recibir creación de pago": "✅ Implementado",
                "Confirmamos correctamente al comercio": "🔄 Listo para verificación",
                "Recibir rollback": "🔄 Listo para verificación",
                "Recibimos pedido de confirmación del comercio": "✅ Implementado"
            }
        }
    });
});

// ===== ENDPOINT PARA SIMULAR CONFIRMACIÓN DE BANCARD (DESARROLLO) =====
router.post("/bancard/simulate-confirmation", (req, res) => {
    try {
        const { shop_process_id, response_code = "00", amount = "10000.00" } = req.body;
        
        if (!shop_process_id) {
            return res.status(400).json({
                message: "shop_process_id es requerido",
                success: false,
                error: true
            });
        }

        // Simular llamada a tu endpoint de confirmación
        const simulatedConfirmation = {
            operation: {
                token: "simulated_token_123456789012345678901234",
                shop_process_id: shop_process_id,
                response: response_code === "00" ? "S" : "N",
                response_details: response_code === "00" ? "Transacción aprobada" : "Transacción rechazada",
                amount: amount,
                currency: "PYG",
                authorization_number: response_code === "00" ? "123456" : "",
                ticket_number: response_code === "00" ? "123456789123456" : "",
                response_code: response_code,
                response_description: response_code === "00" ? "Transacción aprobada" : "Transacción rechazada",
                security_information: {
                    customer_ip: "127.0.0.1",
                    card_source: "L",
                    card_country: "Paraguay",
                    version: "0.3",
                    risk_index: "1"
                }
            }
        };

        // Crear request simulado
        const fakeReq = {
            body: simulatedConfirmation,
            query: {},
            headers: { 'user-agent': 'Bancard-Simulator' },
            ip: '127.0.0.1',
            originalUrl: '/api/bancard/confirm',
            method: 'POST'
        };

        const fakeRes = {
            status: () => ({ json: () => {} }),
            json: () => {}
        };

        // Llamar a tu controlador
        bancardConfirmController(fakeReq, fakeRes);

        res.json({
            message: "Confirmación simulada enviada",
            success: true,
            error: false,
            data: {
                simulated_data: simulatedConfirmation,
                shop_process_id: shop_process_id,
                response_code: response_code,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("❌ Error en simulación:", error);
        res.status(500).json({
            message: "Error en simulación de confirmación",
            success: false,
            error: true,
            details: error.message
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

// ===== IMPORTAR NUEVOS CONTROLADORES =====
const { 
    getUserProfileController,
    updateUserProfileController,
    uploadProfileImageController,
    changePasswordController
} = require('../controller/user/userProfile');

const {
    createCardController,
    getUserCardsController,
    chargeWithTokenController
} = require('../controller/bancard/bancardCardsController');

// ===== NUEVAS RUTAS DE PERFIL DE USUARIO =====
// Obtener perfil del usuario
router.get("/perfil", authToken, getUserProfileController);

// Actualizar perfil del usuario
router.put("/perfil", authToken, updateUserProfileController);

// Subir imagen de perfil
router.post("/perfil/imagen", authToken, uploadProfileImageController);

// Cambiar contraseña
router.post("/perfil/cambiar-contrasena", authToken, changePasswordController);

// ===== NUEVAS RUTAS PARA GESTIÓN DE TARJETAS BANCARD =====
// Catastrar nueva tarjeta
router.post("/bancard/tarjetas", authToken, createCardController);

// Obtener tarjetas de un usuario
router.get("/bancard/tarjetas/:user_id", authToken, getUserCardsController);

// Pagar con alias token
router.post("/bancard/pago-con-token", authToken, chargeWithTokenController);

// ===== RUTAS ADICIONALES PARA COMPLETAR LA CERTIFICACIÓN =====
// Eliminar tarjeta (usando el controlador existente con adaptación)
router.delete("/bancard/tarjetas/:user_id", authToken, async (req, res) => {
    try {
        const { user_id } = req.params;
        const { alias_token } = req.body;
        
        if (!alias_token) {
            return res.status(400).json({
                message: "alias_token es requerido",
                success: false,
                error: true
            });
        }

        // Validar configuración
        const { validateBancardConfig, getBancardBaseUrl } = require('../helpers/bancardUtils');
        const configValidation = validateBancardConfig();
        if (!configValidation.isValid) {
            return res.status(500).json({
                message: "Error de configuración del sistema",
                success: false,
                error: true
            });
        }

        // Generar token para eliminar tarjeta
        const crypto = require('crypto');
        const tokenString = `${process.env.BANCARD_PRIVATE_KEY}delete_card${user_id}${alias_token}`;
        const token = crypto.createHash('md5').update(tokenString, 'utf8').digest('hex');

        const payload = {
            public_key: process.env.BANCARD_PUBLIC_KEY,
            operation: {
                token: token,
                alias_token: alias_token
            }
            // SIN test_client para certificación
        };

        console.log("📤 Payload para eliminar tarjeta:", JSON.stringify(payload, null, 2));

        const axios = require('axios');
        const bancardUrl = `${getBancardBaseUrl()}/vpos/api/0.3/users/${user_id}/cards`;
        
        const response = await axios.delete(bancardUrl, {
            data: payload,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BlueTec-eCommerce/1.0'
            },
            timeout: 30000
        });

        console.log("📥 Respuesta de eliminación:", response.status, JSON.stringify(response.data, null, 2));

        res.json({
            message: "Tarjeta eliminada exitosamente",
            success: true,
            error: false,
            data: response.data
        });

    } catch (error) {
        console.error("❌ Error eliminando tarjeta:", error);
        res.status(500).json({
            message: "Error al eliminar tarjeta",
            success: false,
            error: true,
            details: error.response?.data || error.message
        });
    }
});

// ===== ENDPOINTS DE PRUEBA PARA CERTIFICACIÓN BANCARD =====

// Test de catastro de tarjeta
router.post("/bancard/test-catastro", async (req, res) => {
    try {
        console.log("🧪 === TEST DE CATASTRO BANCARD ===");
        
        const testData = {
            card_id: Math.floor(Math.random() * 100000) + 11000, // ID único
            user_id: 1, // Usuario de prueba
            user_cell_phone: "12345678",
            user_mail: "example@mail.com",
            return_url: `${process.env.FRONTEND_URL}/mis-tarjetas`
        };

        // Usar el controlador existente
        req.body = testData;
        await createCardController(req, res);
        
    } catch (error) {
        console.error("❌ Error en test de catastro:", error);
        res.status(500).json({
            message: "Error en test de catastro",
            success: false,
            error: true,
            details: error.message
        });
    }
});

// Test de listar tarjetas
router.get("/bancard/test-listar/:user_id", async (req, res) => {
    try {
        console.log("🧪 === TEST DE LISTAR TARJETAS ===");
        
        // Usar el controlador existente
        await getUserCardsController(req, res);
        
    } catch (error) {
        console.error("❌ Error en test de listar:", error);
        res.status(500).json({
            message: "Error en test de listar tarjetas",
            success: false,
            error: true,
            details: error.message
        });
    }
});

// Test de pago con token
router.post("/bancard/test-pago-token", async (req, res) => {
    try {
        console.log("🧪 === TEST DE PAGO CON TOKEN ===");
        
        const { alias_token } = req.body;
        
        if (!alias_token) {
            return res.status(400).json({
                message: "alias_token es requerido para el test",
                success: false,
                error: true,
                example: { alias_token: "token-de-prueba" }
            });
        }

        const testPaymentData = {
            shop_process_id: Math.floor(Math.random() * 1000000) + 600000,
            amount: "151241.00",
            currency: "PYG",
            alias_token: alias_token,
            number_of_payments: 1,
            description: "Test de pago con token BlueTec",
            return_url: `${process.env.FRONTEND_URL}/pago-exitoso`
        };

        // Usar el controlador existente
        req.body = testPaymentData;
        await chargeWithTokenController(req, res);
        
    } catch (error) {
        console.error("❌ Error en test de pago con token:", error);
        res.status(500).json({
            message: "Error en test de pago con token",
            success: false,
            error: true,
            details: error.message
        });
    }
});

// ===== ENDPOINT DE VERIFICACIÓN DE CERTIFICACIÓN COMPLETA =====
router.get("/bancard/verificar-certificacion-completa", (req, res) => {
    const { validateBancardConfig, getBancardBaseUrl } = require('../helpers/bancardUtils');
    const validation = validateBancardConfig();
    
    res.json({
        message: "Verificación completa de certificación Bancard",
        success: validation.isValid,
        error: !validation.isValid,
        data: {
            configuration_valid: validation.isValid,
            configuration_errors: validation.errors || [],
            environment: process.env.BANCARD_ENVIRONMENT || 'staging',
            base_url: getBancardBaseUrl(),
            
            // ✅ ENDPOINTS IMPLEMENTADOS
            endpoints_implemented: {
                // Pagos ocasionales
                create_payment: "✅ Implementado",
                confirmation: "✅ Implementado", 
                rollback: "✅ Implementado",
                get_confirmation: "✅ Implementado",
                
                // Gestión de tarjetas (NUEVO)
                card_register: "✅ Implementado",
                list_cards: "✅ Implementado", 
                delete_card: "✅ Implementado",
                payment_with_token: "✅ Implementado"
            },
            
            // ✅ CHECKLIST DE CERTIFICACIÓN
            certification_checklist: {
                "Recibir creación de pago": "✅ Implementado",
                "Confirmamos correctamente al comercio": "✅ Implementado",
                "Recibir rollback": "✅ Implementado", 
                "Recibimos pedido de confirmación del comercio": "✅ Implementado",
                "Solicitud de catastro": "✅ NUEVO - Implementado",
                "Catastro de tarjeta": "✅ NUEVO - Implementado",
                "Recibir tarjetas del usuario": "✅ NUEVO - Implementado",
                "Eliminar tarjeta del usuario": "✅ NUEVO - Implementado",
                "Pago con alias token": "✅ NUEVO - Implementado"
            },
            
            // ✅ URLS DE TEST
            test_endpoints: {
                test_catastro: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/test-catastro`,
                test_listar: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/test-listar/1`,
                test_pago_token: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/test-pago-token`,
                test_rollback: `${process.env.FRONTEND_URL || 'https://tu-dominio.com'}/api/bancard/test-rollback`
            },

            // ✅ DATOS DE PRUEBA SUGERIDOS
            test_data: {
                catastro: {
                    card_id: 11129,
                    user_id: 1,
                    user_cell_phone: "12345678", 
                    user_mail: "example@mail.com"
                },
                cedula_valida: {
                    visa_mastercard: "6587520",
                    bancard: "9661000"
                },
                telefono_zimple: "0981123456",
                codigo_otp_zimple: "1234"
            }
        }
    });
});

// ===== ENDPOINT PARA ESTADÍSTICAS DE USO =====
router.get("/bancard/estadisticas", authToken, async (req, res) => {
    try {
        const BancardTransactionModel = require('../models/bancardTransactionModel');
        
        // Obtener estadísticas básicas
        const stats = await Promise.all([
            BancardTransactionModel.countDocuments({ status: 'approved' }),
            BancardTransactionModel.countDocuments({ status: 'pending' }),
            BancardTransactionModel.countDocuments({ status: 'rejected' }),
            BancardTransactionModel.countDocuments({ is_rolled_back: true }),
            BancardTransactionModel.aggregate([
                { $match: { status: 'approved' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const totalApproved = stats[4][0]?.total || 0;

        res.json({
            message: "Estadísticas de Bancard",
            success: true,
            error: false,
            data: {
                transactions: {
                    approved: stats[0],
                    pending: stats[1], 
                    rejected: stats[2],
                    rolled_back: stats[3]
                },
                revenue: {
                    total_approved: totalApproved,
                    currency: 'PYG'
                },
                integration_status: {
                    payments: "✅ Activo",
                    cards: "✅ Activo", 
                    rollbacks: "✅ Activo"
                }
            }
        });

    } catch (error) {
        console.error("❌ Error obteniendo estadísticas:", error);
        res.status(500).json({
            message: "Error al obtener estadísticas",
            success: false,
            error: true,
            details: error.message
        });
    }
});

module.exports = router;