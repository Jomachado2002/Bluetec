const backendDomain = process.env.REACT_APP_BACKEND_URL;

const SummaryApi = {
    // ===========================================
    // AUTENTICACIÓN
    // ===========================================
    SignUP: {
        url: `${backendDomain}/api/registro`,
        method: "post"
    },
    signIn: {
        url: `${backendDomain}/api/iniciar-sesion`,
        method: "post"
    },
    current_user : {
        url: `${backendDomain}/api/detalles-usuario`,
        method: "get"
    },
    logout_user: {
        url: `${backendDomain}/api/cerrar-sesion`,
        method : "get"
    },
    allUser:{
        url: `${backendDomain}/api/todos-usuarios`,
        method : "get"
     },
    updateUser: {
        url: `${backendDomain}/api/actualizar-usuario`,
        method : "post"
    },
    forgotPassword: {
        url: `${backendDomain}/api/solicitar-restablecer-contrasena`,
        method: 'post'
    },
    resetPassword: {
        url: `${backendDomain}/api/restablecer-contrasena`,
        method: 'post'
    },

    // ===========================================
    // PRODUCTOS
    // ===========================================
    uploadProduct: {
        url : `${backendDomain}/api/cargar-producto`,
        method : 'post'
    },
    allProduct: {
        url: `${backendDomain}/api/obtener-productos`,
        method : 'get'
    },
    updateProduct : {
        url : `${backendDomain}/api/actualizar-producto`,
        method : 'post'
    },
    deleteProduct: {
        url: `${backendDomain}/api/eliminar-producto`,
        method: 'post'
    },
    categoryProduct : {
        url: `${backendDomain}/api/obtener-categorias`,
        method: 'get'
    },
    categoryWiseProduct : {
        url : `${backendDomain}/api/productos-por-categoria`,
        method : 'post'
    },
    productDetails : {
        url : `${backendDomain}/api/detalles-producto`,
        method : 'post'
    },
    productDetailsBySlug: {
        url: `${backendDomain}/api/producto-por-slug`,
        method: "get"
    },
    searchProduct : {
        url : `${backendDomain}/api/buscar`,
        method : 'get'
    },
    filterProduct : {
        url : `${backendDomain}/api/filtrar-productos`,
        method : 'post'
    },
    getCategorySearch: {
        url: `${backendDomain}/api/buscar-por-categoria`,
        method: "GET"
    },
    updateAllPrices: {
        url: `${backendDomain}/api/finanzas/actualizarprecios`,
        method: 'post'
    },

    // ===========================================
    // FINANZAS DE PRODUCTOS
    // ===========================================
    productFinance: {
        url: `${backendDomain}/api/finanzas/producto/finanzas`,
        method: 'post'
    },
    getProductFinance: {
        url: `${backendDomain}/api/finanzas/producto/finanzas`,
        method: 'get'
    },
    marginReports: {
        url: `${backendDomain}/api/finanzas/reportes/margenes`,
        method: 'get'
    },
    profitabilityReports: {
        url: `${backendDomain}/api/finanzas/reportes/rentabilidad`,
        method: 'get'
    },

    // ===========================================
    // VENTAS
    // ===========================================
    createSale: {
        url: `${backendDomain}/api/finanzas/ventas`,
        method: 'post'
    },
    getAllSales: {
        url: `${backendDomain}/api/finanzas/ventas`,
        method: 'get'
    },
    getSaleById: {
        url: `${backendDomain}/api/finanzas/ventas`, // + /:saleId
        method: 'get'
    },
    updateSalePayment: {
        url: `${backendDomain}/api/finanzas/ventas`, // + /:saleId/pago
        method: 'patch'
    },
    uploadSaleInvoice: {
        url: `${backendDomain}/api/finanzas/ventas`, // + /:saleId/factura
        method: 'post'
    },
    getSalesSummary: {
        url: `${backendDomain}/api/finanzas/ventas/resumen`,
        method: 'get'
    },
    deleteSale: {
        url: `${backendDomain}/api/finanzas/ventas`, // + /:saleId
        method: 'delete'
    },

    // ===========================================
    // COMPRAS
    // ===========================================
    createPurchase: {
        url: `${backendDomain}/api/finanzas/compras`,
        method: 'post'
    },
    getAllPurchases: {
        url: `${backendDomain}/api/finanzas/compras`,
        method: 'get'
    },
    getPurchaseById: {
        url: `${backendDomain}/api/finanzas/compras`, // + /:purchaseId
        method: 'get'
    },
    updatePurchasePayment: {
        url: `${backendDomain}/api/finanzas/compras`, // + /:purchaseId/pago
        method: 'patch'
    },
    uploadPurchaseDocuments: {
        url: `${backendDomain}/api/finanzas/compras`, // + /:purchaseId/documentos
        method: 'post'
    },
    getPurchasesSummary: {
        url: `${backendDomain}/api/finanzas/compras/resumen`,
        method: 'get'
    },
    deletePurchase: {
        url: `${backendDomain}/api/finanzas/compras`, // + /:purchaseId
        method: 'delete'
    },

    // ===========================================
    // DASHBOARD Y ESTADOS DE CUENTA
    // ===========================================
    getDashboardSummary: {
        url: `${backendDomain}/api/finanzas/dashboard`,
        method: 'get'
    },
    getAccountStatement: {
        url: `${backendDomain}/api/finanzas/estado-cuenta`,
        method: 'get'
    },
    getYearlyMetrics: {
        url: `${backendDomain}/api/finanzas/metricas-anuales`,
        method: 'get'
    },
    
    // ===========================================
    // CLIENTES
    // ===========================================
    createClient: {
        url: `${backendDomain}/api/finanzas/clientes`,
        method: 'post'
    },
    getAllClients: {
        url: `${backendDomain}/api/finanzas/clientes`,
        method: 'get'
    },
    getClientById: {
        url: `${backendDomain}/api/finanzas/clientes`,
        method: 'get'
    },
    updateClient: {
        url: `${backendDomain}/api/finanzas/clientes`,
        method: 'put'
    },
    deleteClient: {
        url: `${backendDomain}/api/finanzas/clientes`,
        method: 'delete'
    },
    
    // ===========================================
    // PRESUPUESTOS
    // ===========================================
    createBudget: {
        url: `${backendDomain}/api/finanzas/presupuestos`,
        method: 'post'
    },
    getAllBudgets: {
        url: `${backendDomain}/api/finanzas/presupuestos`,
        method: 'get'
    },
    getBudgetById: {
        url: `${backendDomain}/api/finanzas/presupuestos`,
        method: 'get'
    },
    updateBudgetStatus: {
        url: `${backendDomain}/api/finanzas/presupuestos`,
        method: 'patch'
    },
    getBudgetPDF: {
        url: `${backendDomain}/api/finanzas/presupuestos`,
        method: 'get'
    },
    deleteBudget: {
        url: `${backendDomain}/api/finanzas/presupuestos`,
        method: 'delete'
    },
    sendBudgetEmail: {
        url: `${backendDomain}/api/finanzas/presupuestos`,
        method: 'post'
    },

    // ===========================================
    // PROVEEDORES
    // ===========================================
    createSupplier: {
        url: `${backendDomain}/api/finanzas/proveedores`,
        method: 'post'
    },
    getAllSuppliers: {
        url: `${backendDomain}/api/finanzas/proveedores`,
        method: 'get'
    },
    getSupplierById: {
        url: `${backendDomain}/api/finanzas/proveedores`,
        method: 'get'
    },
    updateSupplier: {
        url: `${backendDomain}/api/finanzas/proveedores`,
        method: 'put'
    },
    deleteSupplier: {
        url: `${backendDomain}/api/finanzas/proveedores`,
        method: 'delete'
    },

    // ===========================================
    // ANÁLISIS DE RENTABILIDAD
    // ===========================================
    createProfitabilityAnalysis: {
        url: `${backendDomain}/api/finanzas/analisis-rentabilidad`,
        method: 'post'
    },
    getAllProfitabilityAnalyses: {
        url: `${backendDomain}/api/finanzas/analisis-rentabilidad`,
        method: 'get'
    },
    getProfitabilityAnalysisById: {
        url: `${backendDomain}/api/finanzas/analisis-rentabilidad`,
        method: 'get'
    },
    compareSupplierPrices: {
        url: `${backendDomain}/api/finanzas/comparar-proveedores`,
        method: 'post'
    },
    updateAnalysisStatus: {
        url: `${backendDomain}/api/finanzas/analisis-rentabilidad`,
        method: 'patch'
    },
    deleteAnalysis: {
        url: `${backendDomain}/api/finanzas/analisis-rentabilidad`,
        method: 'delete'
    },
    getSupplierProfitability: {
        url: `${backendDomain}/api/finanzas/proveedores`,
        method: 'get'
    },
    
    // También establece un baseURL para uso general
    baseURL: backendDomain
};

export default SummaryApi;