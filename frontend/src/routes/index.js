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

// Importar páginas financieras
import FinancialReports from "../pages/FinancialReports"
import ClientsList from "../pages/ClientsList"
import ClientDetails from "../pages/ClientDetails"
import BudgetsList from "../pages/BudgetsList"
import BudgetDetails from "../pages/BudgetDetails"
import NewBudget from "../pages/NewBudget"
import NewClient from "../pages/NewClient"



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
                path: "categoria-producto", // ✅ Agregado parámetro
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

          
           
            // ✅ Panel de admin separado
            {
                path: "panel-admin",
                element: <AdminPanel />,
                children: [
                    {
                        path: "todos-usuarios",
                        element: <AllUsers />
                    },
                    {
                        path: "todos-productos",
                        element: <AllProducts />
                    },
                    
                    // Rutas financieras
                    {
                        path: "reportes-financieros",
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
                    }
                ]
            }
        ]
    }
])

export default router