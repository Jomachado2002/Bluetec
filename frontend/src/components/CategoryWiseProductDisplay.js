// 2. CategoryWiseProductDisplay.js - OPTIMIZADO COMPLETO
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { FaAngleLeft, FaAngleRight, FaShoppingCart, FaExpand } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import addToCart from '../helpers/addToCart';
import Context from '../context';
import displayPYGCurrency from '../helpers/displayCurrency';
import { useOptimizedProducts } from '../hooks/useOptimizedProducts';

const CategoryWiseProductDisplay = ({ category, subcategory, heading, currentProductId }) => {
  // NUEVO: Usar hook optimizado en lugar de fetch manual
  const { 
    data: rawData, 
    loading, 
    loadingMore 
  } = useOptimizedProducts(category, subcategory, {
    priority: 'normal',
    initialLimit: null, // Cargar todos
    enableProgressiveLoading: false,
    autoLoadFull: false
  });

  // Estados para UI
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const loadingList = new Array(13).fill(null);

  const scrollElement = useRef();
  const navigate = useNavigate();
  const { fetchUserAddToCart } = useContext(Context);

  // Filtrar el producto actual de los resultados si tenemos su ID
  const data = currentProductId 
    ? rawData.filter(product => product._id !== currentProductId)
    : rawData;

  // Función para calcular el descuento
  const calculateDiscount = (price, sellingPrice) => {
    if (price && price > 0) {
      const discount = Math.round(((price - sellingPrice) / price) * 100);
      return discount > 0 ? `${discount}% OFF` : null;
    }
    return null;
  };

  // Función para manejar la acción de agregar al carrito
  const handleAddToCart = useCallback(
    (e, product) => {
      e.preventDefault();
      e.stopPropagation();
      addToCart(e, product);
      fetchUserAddToCart();
    },
    [fetchUserAddToCart]
  );

  // Función para navegar directamente a la página del producto
  const handleProductClick = useCallback((e, productSlug) => {
    e.preventDefault();
    // Forzar una recarga completa para evitar problemas de estado
    window.location.href = `/producto/${productSlug}`;
  }, []);

  // Función para desplazar a la derecha
  const scrollRight = () => {
    if (scrollElement.current) {
      scrollElement.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Función para desplazar a la izquierda
  const scrollLeft = () => {
    if (scrollElement.current) {
      scrollElement.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  // Función para verificar la posición del scroll
  const checkScrollPosition = useCallback(() => {
    if (scrollElement.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollElement.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth);
    }
  }, []);

  // useEffect para verificar la posición del scroll
  useEffect(() => {
    const scrollContainer = scrollElement.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      
      return () => {
        if (scrollContainer) {
          scrollContainer.removeEventListener('scroll', checkScrollPosition);
        }
      };
    }
  }, [checkScrollPosition, data]);

  // Manejo de teclas para accesibilidad
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      scrollRight();
    } else if (e.key === 'ArrowLeft') {
      scrollLeft();
    }
  };

  // Si no hay datos y no está cargando, no mostrar nada
  if (data.length === 0 && !loading) {
    return null;
  }

  return (
    <div className='container mx-auto px-4 my-6 relative'>
      <h2 className='text-2xl font-semibold py-4'>{heading}</h2>

      <div className='relative'>
        {showLeftButton && (
          <button
            className='bg-white shadow-lg rounded-full p-2 absolute left-0 top-1/2 transform -translate-y-1/2 z-10'
            onClick={scrollLeft}
            aria-label="Desplazar a la izquierda"
          >
            <FaAngleLeft className='text-gray-700' />
          </button>
        )}

        <div
          className='flex gap-4 overflow-x-scroll scrollbar-none scroll-smooth'
          ref={scrollElement}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label="Carrusel de productos recomendados"
        >
          {loading
            ? loadingList.map((_, index) => (
                <div
                  key={index}
                  className='w-full min-w-[280px] md:min-w-[300px] max-w-[300px] bg-white rounded-xl shadow-lg animate-pulse'
                >
                  <div className='bg-slate-200 h-48 rounded-t-xl'></div>
                  <div className='p-5 space-y-3'>
                    <div className='h-4 bg-slate-300 rounded-full'></div>
                    <div className='h-4 bg-slate-300 rounded-full w-2/3'></div>
                    <div className='flex gap-3'>
                      <div className='h-4 bg-slate-300 rounded-full w-1/2'></div>
                      <div className='h-4 bg-slate-300 rounded-full w-1/2'></div>
                    </div>
                    <div className='h-10 bg-slate-300 rounded-full'></div>
                  </div>
                </div>
              ))
            : data.map((product) => {
                const discount = calculateDiscount(product?.price, product?.sellingPrice);
                
                return (
                  <div
                    key={`product-${product?._id}`}
                    className='block w-full min-w-[280px] md:min-w-[300px] max-w-[300px] bg-white rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative group/card cursor-pointer'
                    onClick={(e) => handleProductClick(e, product?.slug || product?._id)}
                    onMouseEnter={() => setHoveredProductId(product?._id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                  >
                    {/* Discount Badge */}
                    {discount && (
                      <div className='absolute top-4 left-4 z-10 bg-[#1565C0] text-white px-3 py-1 rounded-full text-xs font-bold'>
                        {discount}
                      </div>
                    )}

                    {/* Product Image */}
                    <div className='bg-[#f4f7fb] h-48 rounded-t-xl flex items-center justify-center overflow-hidden relative'>
                      <img
                        src={product.productImage[0]}
                        alt={product.productName}
                        className='object-contain h-full w-full transform group-hover/card:scale-110 transition-transform duration-500'
                        loading="lazy"
                      />
                      <div className='absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300'>
                        <div className='bg-white/70 p-2 rounded-full'>
                          <FaExpand className='text-[#002060]' />
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className='p-5 space-y-3'>
                      <h2
                        className={`font-semibold text-base text-gray-700 ${
                          hoveredProductId === product?._id
                            ? 'line-clamp-none'
                            : 'line-clamp-2'
                        } hover:line-clamp-none transition-all duration-300`}
                      >
                        {product?.productName}
                      </h2>

                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full'>
                          {product?.subcategory}
                        </span>
                        <div className='flex flex-col items-end'>
                          <p className='text-[#002060] font-bold text-base'>
                            {displayPYGCurrency(product?.sellingPrice)}
                          </p>
                          {product?.price > 0 && (
                            <p className='text-gray-400 line-through text-xs'>
                              {displayPYGCurrency(product?.price)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className='w-full flex items-center justify-center gap-2 bg-[#002060] hover:bg-[#003399] 
                             text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors'
                      >
                        <FaShoppingCart /> Agregar al Carrito
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>

        {showRightButton && (
          <button
            className='bg-white shadow-lg rounded-full p-2 absolute right-0 top-1/2 transform -translate-y-1/2 z-10'
            onClick={scrollRight}
            aria-label="Desplazar a la derecha"
          >
            <FaAngleRight className='text-gray-700' />
          </button>
        )}

        {/* NUEVO: Indicador de carga progresiva */}
        {loadingMore && !loading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center text-blue-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
              Cargando más productos...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryWiseProductDisplay;