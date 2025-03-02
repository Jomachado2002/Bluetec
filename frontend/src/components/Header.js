import React, { useContext, useState, useEffect, useRef } from 'react';
import { GrSearch } from "react-icons/gr";
import { CiUser, CiShoppingCart, CiHome } from "react-icons/ci";
import { BiCategoryAlt } from "react-icons/bi";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SummaryApi from '../common';
import { toast } from 'react-toastify';
import { setUserDetails } from '../store/userSlice';
import ROLE from '../common/role';
import Context from '../context';
import productCategory from '../helpers/productCategory';
import { FaWhatsapp, FaInfoCircle, FaBars, FaPhone } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

// Función scrollTop - se mantiene igual
const scrollTop = () => {
  if ('scrollBehavior' in document.documentElement.style) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  } else {
    const scrollToTop = () => {
      const currentPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

      if (currentPosition > 0) {
        window.requestAnimationFrame(scrollToTop);
        window.scrollTo(0, currentPosition - currentPosition / 8);
      }
    };

    scrollToTop();
  }

  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    setTimeout(() => {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 100);
  }

  setTimeout(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, 200);
};

const Header = () => {
  const user = useSelector(state => state?.user?.user);
  const dispatch = useDispatch();
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);
  const [activeSubcategories, setActiveSubcategories] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const context = useContext(Context);
  const navigate = useNavigate();
  const searchInput = useLocation();
  const URLSearch = new URLSearchParams(searchInput?.search);
  const searchQuery = URLSearch.getAll("q");
  const [search, setSearch] = useState(searchQuery);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Referencias para el menú y overlay
  const menuRef = useRef(null);
  const overlayRef = useRef(null);

  // Detectar scroll para efectos
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Efecto para actualizar subcategorías cuando cambia la categoría activa
  useEffect(() => {
    if (activeCategoryIndex !== null && productCategory[activeCategoryIndex]) {
      setActiveSubcategories(productCategory[activeCategoryIndex].subcategories);
    } else {
      setActiveSubcategories([]);
    }
  }, [activeCategoryIndex]);

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (desktopMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [desktopMenuOpen]);

  const handleLogout = async () => {
    const fetchData = await fetch(SummaryApi.logout_user.url, {
      method: SummaryApi.logout_user.method,
      credentials: 'include'
    });

    const data = await fetchData.json();

    if (data.success) {
      toast.success(data.message);
      dispatch(setUserDetails(null));
    }
    if (data.error) {
      toast.error(data.message);
    }
  };

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearch(value);
    navigate(`/buscar?q=${value}`);
  };

  const toggleCategoryMenu = () => setCategoryMenuOpen(!categoryMenuOpen);
  const toggleDesktopMenu = () => {
    setDesktopMenuOpen(!desktopMenuOpen);
    setActiveCategoryIndex(null); // Reset category selection on toggle
  };
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);
  const toggleMobileSearch = () => setShowMobileSearch(!showMobileSearch);

  const handleCategoryClick = (index) => {
    setActiveCategoryIndex(index);
  };

  // Nueva función para gestionar la navegación con recarga
  const handleNavigateWithReload = (url) => {
    navigate(url);
    scrollTop();
    
    // Pequeño delay para asegurar que la navegación se complete
    setTimeout(() => {
      window.location.reload();
    }, 10);
  };

  return (
    <header className="fixed w-full top-0 z-[100] transition-all duration-300" style={{backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'white', boxShadow: scrolled ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
      {/* Versión de escritorio */}
      <div className="container mx-auto px-4 lg:px-6 h-20 hidden lg:flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center transition-transform duration-300 hover:scale-105" onClick={scrollTop}>
          <img src="/logo.png" alt="JM Computers" className="w-20" />
        </Link>

        {/* Barra de búsqueda mejorada */}
        <div className="flex items-center flex-1 justify-center mx-8">
          <div className="flex items-center w-full max-w-md border border-gray-300 rounded-full shadow-sm focus-within:shadow-lg focus-within:border-green-300 pl-4 transition-all duration-300 hover:shadow-md">
            <input
              type="text"
              placeholder="Busca tus productos..."
              className="w-full outline-none py-2.5 text-gray-600 bg-transparent"
              onChange={handleSearch}
              value={search}
            />
            <div className="text-xl p-2.5 text-gray-500 hover:text-green-600 transition-colors">
              <GrSearch className="cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Área derecha: Botón hamburguesa y carrito */}
        <div className="flex items-center space-x-4">
          {/* Botón de menú hamburguesa */}
          <button 
            onClick={toggleDesktopMenu}
            className="relative z-[150] flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors px-3 py-2 rounded-lg hover:bg-green-50 border border-gray-200"
            aria-label="Menú principal"
          >
            {desktopMenuOpen ? (
              <IoMdClose className="text-2xl" />
            ) : (
              <FaBars className="text-2xl" />
            )}
            <span className="font-medium">Menú</span>
          </button>

          {/* Carrito mejorado */}
          <Link 
            to="/carrito" 
            className="relative group bg-green-50 p-2.5 rounded-full hover:bg-green-100 transition-colors duration-300"
            onClick={scrollTop}
          >
            <CiShoppingCart className="text-2xl text-green-600 transition group-hover:scale-110 duration-300" />
            {context?.cartProductCount > 0 && (
              <div className="absolute -top-2 -right-1 w-6 h-6 text-xs text-white bg-green-600 rounded-full flex items-center justify-center shadow-md">
                {context?.cartProductCount}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Mega menú desktop - aparece al pulsar hamburguesa */}
      {desktopMenuOpen && (
        <>
          {/* Overlay de fondo oscuro para toda la pantalla */}
          <div 
            ref={overlayRef}
            className="fixed inset-0 bg-black/60 z-[120]" 
            onClick={() => setDesktopMenuOpen(false)}
            style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          />
          
          {/* Contenido del menú */}
          <div 
            ref={menuRef}
            className="desktop-menu-container fixed top-20 left-0 bottom-0 w-1/2 bg-gray-100 shadow-xl z-[130]"
            style={{position: 'fixed', top: '5rem', left: 0, bottom: 0, width: '50%'}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full">
              {/* Panel de navegación izquierdo */}
              <div className="w-64 bg-gray-100 pt-4 border-r border-gray-200 overflow-y-auto h-full">
                <nav className="space-y-1 px-3">
                  {/* Enlace a Nosotros */}
                  <Link 
                    to="/nosotros" 
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    onClick={() => {
                      setDesktopMenuOpen(false);
                      scrollTop();
                    }}
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 mr-3 flex-shrink-0">
                      <FaInfoCircle className="text-green-500 text-sm" />
                    </div>
                    <span className="font-medium">Nosotros</span>
                  </Link>
                  
                  {/* Categorías principales */}
                  <div className="mt-4">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      CATEGORÍAS
                    </h3>
                    {productCategory.map((category, index) => (
                      <div
                        key={category.id}
                        className={`px-4 py-3 cursor-pointer flex items-center justify-between border-l-4 ${activeCategoryIndex === index 
                          ? 'border-l-green-500 bg-green-50/50 text-green-800' 
                          : 'border-l-transparent text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => handleCategoryClick(index)}
                      >
                        <span className="font-medium">{category.label}</span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    ))}
                  </div>
                  
                  {/* Contacto */}
                  <div className="pt-3 mt-4 border-t border-gray-200">
                    <a 
                      href="https://wa.me/+595972971353?text=Hola,%20estoy%20interesado%20en%20obtener%20información%20sobre%20insumos%20de%20tecnología." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 mr-3 flex-shrink-0">
                        <FaWhatsapp className="text-green-500 text-sm" />
                      </div>
                      <span className="font-medium">Contactar</span>
                    </a>
                    <a 
                      href="tel:+595972971353" 
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 mr-3 flex-shrink-0">
                        <FaPhone className="text-green-500 text-sm" />
                      </div>
                      <span className="font-medium">+595 972 971353</span>
                    </a>
                  </div>
                </nav>
              </div>
              
              {/* Panel de subcategorías derecho - solo se muestra si hay una categoría seleccionada */}
              <div className="flex-1 py-4 px-6 overflow-y-auto bg-white h-full">
                {activeCategoryIndex !== null && activeSubcategories.length > 0 ? (
                  <>
                    <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b border-gray-200">
                      {productCategory[activeCategoryIndex]?.label}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {activeSubcategories.map((subcategory) => (
                        <a
                          key={subcategory.id}
                          href="#"
                          className="group p-3 hover:bg-green-50 transition-colors flex items-center"
                          onClick={(e) => {
                            e.preventDefault();
                            setDesktopMenuOpen(false);
                            handleNavigateWithReload(`/categoria-producto?category=${productCategory[activeCategoryIndex].value}&subcategory=${subcategory.value}`);
                          }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full text-green-600 group-hover:bg-green-200 transition-colors flex-shrink-0 mr-3">
                            <BiCategoryAlt className="text-sm" />
                          </div>
                          <span className="font-medium text-gray-800 group-hover:text-green-600 transition-colors text-sm">
                            {subcategory.label}
                          </span>
                        </a>
                      ))}
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                      <a
                        href="#"
                        className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          setDesktopMenuOpen(false);
                          handleNavigateWithReload(`/categoria-producto?category=${productCategory[activeCategoryIndex].value}`);
                        }}
                      >
                        Ver toda la colección
                      </a>
                    </div>
                  </>
                ) : (
                  // Contenido por defecto cuando no hay categoría seleccionada
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <img src="/logo.png" alt="JM Computers" className="w-24 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">JM Computer</h2>
                    <p className="text-gray-600 text-sm mb-4">
                      Selecciona una categoría para explorar nuestros productos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Versión móvil */}
      <div className="lg:hidden flex flex-col">
        {/* Barra superior con logo y iconos */}
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={scrollTop}>
            <img src="/logo.png" alt="JM Computers" className="h-10" />
          </Link>

          {/* Iconos: búsqueda y carrito */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobileSearch}
              className="text-gray-600 hover:text-green-600"
            >
              <GrSearch className="text-2xl" />
            </button>
            <Link to="/carrito" className="relative" onClick={scrollTop}>
              <CiShoppingCart className="text-2xl text-gray-600 hover:text-green-600 transition" />
              {context?.cartProductCount > 0 && (
                <div className="absolute -top-2 -right-3 w-5 h-5 text-xs text-white bg-green-600 rounded-full flex items-center justify-center">
                  {context?.cartProductCount}
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Barra de búsqueda móvil expandible */}
        {showMobileSearch && (
          <div className="px-4 pb-3 pt-1 bg-white shadow-md">
            <div className="flex items-center w-full border rounded-full shadow-md focus-within:shadow-lg pl-4 pr-2">
              <input
                type="text"
                placeholder="Busca tus productos..."
                className="w-full outline-none py-2 text-gray-600 text-sm"
                onChange={handleSearch}
                value={search}
                autoFocus
              />
              <button 
                onClick={toggleMobileSearch}
                className="text-sm text-gray-600 hover:text-green-600 py-1 px-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menú lateral de categorías para móvil */}
      <div
        className={`fixed top-0 left-0 h-screen bg-white w-80 shadow-lg transform ${
          categoryMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 z-[140] overflow-y-auto`}
      >
        <header className="sticky top-0 bg-green-600 text-white p-4 flex items-center justify-between z-10 shadow-md">
          <h1 className="text-xl font-semibold">Categorías</h1>
          <button 
            onClick={toggleCategoryMenu} 
            className="text-white hover:bg-green-700 rounded-full p-1"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-4 space-y-6">
          {productCategory.map((category) => (
            <div 
              key={category.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-green-50 p-4 border-b border-green-100">
                <h2 className="text-lg font-bold text-green-800 flex items-center justify-between">
                  {category.label}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-green-600" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 10l-2.293 2.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </h2>
              </div>
              
              <div>
                {category.subcategories.map((subcategory) => (
                  <a
                    key={subcategory.id}
                    href="#"
                    className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-green-50 transition-colors group"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleCategoryMenu();
                      handleNavigateWithReload(`/categoria-producto?category=${category.value}&subcategory=${subcategory.value}`);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-700 group-hover:text-green-600 transition-colors">
                        {subcategory.label}
                      </span>
                    </div>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de navegación móvil */}
      <div className="lg:hidden fixed bottom-0 w-full bg-white shadow-inner border-t p-2 flex justify-around">
        <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-green-600" onClick={scrollTop}>
          <CiHome className="text-2xl" />
          <span className="text-xs">Inicio</span>
        </Link>
        <button onClick={() => { toggleCategoryMenu(); scrollTop(); }} className="flex flex-col items-center text-gray-600 hover:text-green-600">
          <BiCategoryAlt className="text-2xl" />
          <span className="text-xs">Categorías</span>
        </button>
        <Link to="/carrito" className="flex flex-col items-center text-gray-600 hover:text-green-600" onClick={scrollTop}>
          <CiShoppingCart className="text-2xl" />
          <span className="text-xs">Carrito</span>
        </Link>
        <a 
          href="tel:+595972971353" 
          className="flex flex-col items-center text-gray-600 hover:text-green-600"
        >
          <FaPhone className="text-2xl" />
          <span className="text-xs">Llamar</span>
        </a>
        <a 
          href="https://wa.me/+595972971353?text=Hola,%20estoy%20interesado%20en%20obtener%20información%20sobre%20insumos%20de%20tecnología." 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center text-gray-600 hover:text-green-600"
          onClick={scrollTop}
        >
          <FaWhatsapp className="text-2xl" />
          <span className="text-xs">WhatsApp</span>
        </a>
      </div>
    </header>
  );
};

export default Header;