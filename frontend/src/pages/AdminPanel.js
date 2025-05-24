import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CiUser } from 'react-icons/ci';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import ROLE from '../common/role';
import { FaBars, FaTimes, FaUsers, FaBoxOpen, FaChartPie, FaUserFriends, FaFileInvoiceDollar, FaSignOutAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SummaryApi from '../common';
import { useDispatch } from 'react-redux';
import { setUserDetails } from '../store/userSlice';

const AdminPanel = () => {
  const user = useSelector(state => state?.user?.user);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Verificar que el usuario tenga rol de administrador
  useEffect(() => {
    if (!user || user?.role !== ROLE.ADMIN) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      const fetchData = await fetch(SummaryApi.logout_user.url, {
        method: SummaryApi.logout_user.method,
        credentials: 'include'
      });

      const data = await fetchData.json();

      if (data.success) {
        toast.success(data.message);
        dispatch(setUserDetails(null));
        navigate("/");
      } else {
        toast.error(data.message || "Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error de conexión");
    }
  };

  // Comprobar qué ruta está activa
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  // Menú de navegación administrativa
  const navItems = [
    {
      path: "todos-usuarios",
      label: "Usuarios",
      icon: <FaUsers className="mr-2" />
    },
    {
      path: "todos-productos",
      label: "Productos",
      icon: <FaBoxOpen className="mr-2" />
    },
    {
      path: "reportes-financieros",
      label: "Reportes",
      icon: <FaChartPie className="mr-2" />
    },
    {
      path: "clientes",
      label: "Clientes",
      icon: <FaUserFriends className="mr-2" />
    },
    {
      path: "presupuestos",
      label: "Presupuestos",
      icon: <FaFileInvoiceDollar className="mr-2" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Encabezado de la sección admin */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mr-3 p-1 rounded hover:bg-blue-700 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h1 className="text-xl font-bold flex items-center">
              Panel Administrativo
            </h1>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 text-sm hidden md:block">
              <span>Hola, </span>
              <span className="font-semibold">{user?.name}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full text-sm transition-colors"
            >
              <FaSignOutAlt className="mr-1" />
              <span className="hidden md:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`bg-white border-r border-gray-200 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0 -ml-64 md:ml-0 md:w-16'
          } fixed md:static h-full z-30 shadow-lg md:shadow-none`}
        >
          <div className="p-4 flex flex-col h-full">
            {/* Perfil del administrador */}
            <div className={`flex flex-col items-center mb-6 ${!sidebarOpen && 'md:hidden'}`}>
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <CiUser className="text-4xl text-gray-500" />
                )}
              </div>
              <h2 className="font-medium text-sm">{user?.name}</h2>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>

            {/* Ícono pequeño cuando sidebar está colapsado (solo visible en md+) */}
            <div className={`hidden md:flex md:flex-col md:items-center mb-6 ${sidebarOpen && 'md:hidden'}`}>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <CiUser className="text-lg text-gray-500" />
                )}
              </div>
            </div>

            {/* Navegación */}
            <nav className="flex-1 mt-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 mb-1
                    ${isActive(item.path) 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${!sidebarOpen && 'md:justify-center md:px-2'}`
                  }
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className={`${!sidebarOpen && 'md:hidden'}`}>{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Botón para ir a la tienda */}
            <div className={`mt-auto mb-2 ${!sidebarOpen && 'md:hidden'}`}>
              <Link
                to="/"
                className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-center text-sm transition-colors"
              >
                Ir a la tienda
              </Link>
            </div>

            {/* Versión pequeña del botón cuando sidebar está colapsado */}
            <div className={`mt-auto mb-2 hidden ${!sidebarOpen ? 'md:block' : 'md:hidden'}`}>
              <Link
                to="/"
                className="flex justify-center items-center w-10 h-10 mx-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                title="Ir a la tienda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </Link>
            </div>
          </div>
        </aside>

        {/* Contenido principal con scroll independiente */}
        <main className="flex-1 bg-gray-50 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
          {/* Overlay para cerrar sidebar en móvil cuando está abierto */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}
          
          {/* Contenido de la ruta actual */}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;