// frontend/src/routes/index.js - AGREGAR SOLO ESTAS LÍNEAS
import { createBrowserRouter } from "react-router-dom"
import App from "../App"
import Home from "../pages/Home"
import Login from "../pages/Login"
import ForgotPassword from "../pages/ForgotPassword"
import SignUp from "../pages/SignUp"
import AdminPanel from "../pages/AdminPanel"
import AllUsers from "../pages/AllUsers"
import AllProducts from "../pages/AllProducts"
import CategoryProduct from "../pages/CategoryProduct"
import ProductDetails from "../pages/ProductDetails"
import Cart from '../pages/Cart'
import SearchProduct from "../pages/SearchProduct"
import MobileCategoriesPage from "../pages/MobileCategoriesPage"
import ResetPassword from "../pages/ResetPassword"
import Nosotros from "../pages/Nosotros"

// ✅ PÁGINAS DE BANCARD
import PaymentSuccess from "../pages/PaymentSuccess"
import PaymentCancelled from "../pages/PaymentCancelled"

// ✅ NUEVO PROXY PARA BANCARD
import BancardConfirmProxy from "../pages/BancardConfirmProxy"

// ✅ NUEVA PÁGINA DE TRANSACCIONES BANCARD
import BancardTransactions from "../pages/BancardTransactions"

// Importar el nuevo componente de dashboard
import AdminDashboard from "../pages/AdminDashboard"

// Importar páginas financieras
import FinancialReports from "../pages/FinancialReports"
import ClientsList from "../pages/ClientsList"
import ClientDetails from "../pages/ClientDetails"
import BudgetsList from "../pages/BudgetsList"
import BudgetDetails from "../pages/BudgetDetails"
import NewBudget from "../pages/NewBudget"
import NewClient from "../pages/NewClient"
import SuppliersManagement from "../pages/SuppliersManagement"
import ProfitabilityAnalysis from "../pages/ProfitabilityAnalysis"
import NewProfitabilityAnalysis from "../pages/NewProfitabilityAnalysis"
import SupplierPriceComparison from "../pages/SupplierPriceComparison"
import ProfitabilityAnalysisDetails from "../pages/ProfitabilityAnalysisDetails"

import SalesManagement from "../pages/SalesManagement"
import PurchaseManagement from "../pages/PurchaseManagement"
import SaleDetails from "../pages/SaleDetails"
import PurchaseDetails from "../pages/PurchaseDetails"
import FinancialDashboard from "../pages/FinancialDashboard"

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "",
                element: <Home />
            },
            {
                path: "iniciar-sesion",
                element: <Login />
            },
            {
                path: "recuperar-contrasena",
                element: <ForgotPassword />
            },
            {
                path: "restablecer-contrasena/:token",
                element: <ResetPassword />
            },
            {
                path: "registro",
                element: <SignUp />
            },
            {
                path: "nosotros",
                element: <Nosotros />
            },
            {
                path: "categorias-movil",
                element: <MobileCategoriesPage />
            },
            {
                path: "categoria-producto",
                element: <CategoryProduct />
            },
            {
                path: "producto/:id",
                element: <ProductDetails />
            },
            {
                path: "carrito",
                element: <Cart />
            },
            {
                path: "buscar",
                element: <SearchProduct />
            },
            
            // ✅ RUTAS PARA BANCARD
            {
                path: "pago-exitoso",
                element: <PaymentSuccess />
            },
            {
                path: "pago-cancelado",
                element: <PaymentCancelled />
            },
            
            // ✅ NUEVAS RUTAS PROXY PARA BANCARD - CRÍTICAS
            {
                path: "api/bancard/confirm",
                element: <BancardConfirmProxy />
            },
            {
                path: "api/bancard/confirm-payment",
                element: <BancardConfirmProxy />
            },
            
            // Panel de admin separado
            {
                path: "panel-admin",
                element: <AdminPanel />,
                children: [
                    {
                        path: "",
                        element: <AdminDashboard />
                    },
                    {
                        path: "todos-usuarios",
                        element: <AllUsers />
                    },
                    {
                        path: "todos-productos",
                        element: <AllProducts />
                    },
                    
                    // ✅ NUEVA RUTA PARA TRANSACCIONES BANCARD
                    {
                        path: "transacciones-bancard",
                        element: <BancardTransactions />
                    },
                    
                    // Rutas financieras
                    {
                        path: "dashboard",
                        element: <FinancialDashboard />
                    },
                    {
                        path: "ventas",
                        element: <SalesManagement />
                    },
                    {
                        path: "ventas/:saleId",
                        element: <SaleDetails />
                    },
                    {
                        path: "compras",
                        element: <PurchaseManagement />
                    },
                    {
                        path: "compras/:purchaseId",
                        element: <PurchaseDetails />
                    },
                    
                    // Rutas financieras adicionales
                    {
                        path: "reportes",
                        element: <FinancialReports />
                    },
                    
                    // Gestión de clientes
                    {
                        path: "clientes",
                        element: <ClientsList />
                    },
                    {
                        path: "clientes/nuevo",
                        element: <NewClient />
                    },
                    {
                        path: "clientes/:clientId",
                        element: <ClientDetails />
                    },
                    
                    // Gestión de presupuestos
                    {
                        path: "presupuestos",
                        element: <BudgetsList />
                    },
                    {
                        path: "presupuestos/nuevo",
                        element: <NewBudget />
                    },
                    {
                        path: "presupuestos/:budgetId",
                        element: <BudgetDetails />
                    },
                    {
                        path: "proveedores",
                        element: <SuppliersManagement />
                    },
                    {
                        path: "proveedores/:supplierId", 
                        element: <SuppliersManagement />
                    },
                    // Gestión de análisis de rentabilidad
                    {
                        path: "analisis-rentabilidad",
                        element: <ProfitabilityAnalysis />
                    },
                    {
                        path: "analisis-rentabilidad/nuevo",
                        element: <NewProfitabilityAnalysis />
                    },
                    {
                        path: "analisis-rentabilidad/comparar",
                        element: <SupplierPriceComparison />
                    },
                    {
                        path: "analisis-rentabilidad/:analysisId",
                        element: <ProfitabilityAnalysisDetails />
                    }
                ]
            }
        ]
    }
])

export default router