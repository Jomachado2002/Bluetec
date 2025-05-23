// frontend/src/routes/index.js - Agregar estas rutas al archivo existente
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import SignUp from '../pages/SignUp';
import AdminPanel from '../pages/AdminPanel';
import AllUsers from '../pages/AllUsers';
import AllProducts from '../pages/AllProducts';
import CategoryProduct from '../pages/CategoryProduct';
import ProductDetails from '../pages/ProductDetails';
import Cart from '../pages/Cart';
import SearchProduct from '../pages/SearchProduct';
import PresentacionCorporativa from '../pages/PresentacionCorporativa';




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
        path: "registro",
        element: <SignUp />
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
      {
        path: "PresentacionCorporativa",
        element: <PresentacionCorporativa/>
      },
      
      
      // Rutas de admin (existentes)
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
          }
        ]
      }
    ]
  }
]);

export default router;