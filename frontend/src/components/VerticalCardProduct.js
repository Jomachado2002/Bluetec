import React, { useContext, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import fetchCategoryWiseProduct from '../helpers/fetchCategoryWiseProduct';
import displayPYGCurrency from '../helpers/displayCurrency';
import { FaAngleLeft, FaAngleRight, FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import addToCart from '../helpers/addToCart';
import Context from '../context';
import scrollTop from '../helpers/scrollTop';

const VerticalCardProduct = ({ category, subcategory, heading }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(true);
    const [hoveredProductId, setHoveredProductId] = useState(null);
    const [hoverTimeout, setHoverTimeout] = useState(null);
    const loadingList = new Array(6).fill(null);

    const scrollElement = useRef();

    const { fetchUserAddToCart } = useContext(Context);

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        addToCart(e, product);
        fetchUserAddToCart();
    };

    // ✅ QUERY CON CACHÉ Y LÍMITES INTELIGENTES
const { data: queryData, isLoading: queryLoading } = useQuery({
    queryKey: ['category-products', category, subcategory],
    queryFn: async () => {
        const categoryProduct = await fetchCategoryWiseProduct(category, subcategory);
        let products = categoryProduct?.data || [];
        
        // Filtrar productos sin stock
        products = products.filter(product => 
            product?.stock === undefined || product?.stock === null || product?.stock > 0
        );
        
        // 🚀 LÍMITES INTELIGENTES POR CATEGORÍA
        const limits = {
            // Categorías pequeñas
            'mouses': 12,
            'teclados': 12,
            'auriculares': 12,
            'microfonos': 12,
            // Categorías medianas  
            'notebooks': 20,
            'monitores': 20,
            'memorias_ram': 20,
            'discos_duros': 20,
            'tarjeta_grafica': 20,
            'gabinetes': 20,
            'procesador': 20,
            'placas_madre': 20,
            // Por defecto
            'default': 20
        };
        
        const limit = limits[subcategory] || limits['default'];
        
        // Aplicar límite
        if (products.length > limit) {
            products = products.slice(0, limit);
        }
        
        return products;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
    refetchOnWindowFocus: false,
});

// Sincronizar con estado local
useEffect(() => {
    if (queryData) {
        setData(queryData);
    }
    setLoading(queryLoading);
}, [queryData, queryLoading]);
    // Precargar todas las imágenes cuando se cargan los datos
    useEffect(() => {
        if (data.length > 0) {
            
            data.forEach(product => {
                // Precargar primera imagen
                if (product?.productImage?.[0]) {
                    const img1 = new Image();
                    img1.src = product.productImage[0];
                }
                // Precargar segunda imagen si existe
                if (product?.productImage?.[1]) {
                    const img2 = new Image();
                    img2.src = product.productImage[1];
                }
            });
        }
    }, [data]);

  

    const scrollRight = () => {
        scrollElement.current.scrollBy({ left: 300, behavior: 'smooth' });
    };

    const scrollLeft = () => {
        scrollElement.current.scrollBy({ left: -300, behavior: 'smooth' });
    };

    const checkScrollPosition = () => {
        if (scrollElement.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollElement.current;
            setShowLeftButton(scrollLeft > 0);
            setShowRightButton(scrollLeft < scrollWidth - clientWidth);
        }
    };
    
    useEffect(() => {
        const scrollContainer = scrollElement.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', checkScrollPosition);
            checkScrollPosition();
            return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
        }
    }, [data]);

    const calculateDiscount = (price, sellingPrice) => {
        if (price && price > 0) {
            const discount = Math.round(((price - sellingPrice) / price) * 100);
            return discount > 0 ? `${discount}% OFF` : null;
        }
        return null;
    };

    // Si no hay datos y terminó de cargar, no renderizar nada
    if (!loading && data.length === 0) {
        return null;
    }

    return (
        <div className='w-full relative'>
            {heading && (
                <div className='flex justify-between items-center mb-6'>
                    <div>
                        <h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>{heading}</h2>
                        <div className='h-1 w-20 bg-[#002060] mt-2 rounded-full'></div>
                    </div>
                    <Link 
                        to={`/categoria-producto?category=${category}${subcategory ? `&subcategory=${subcategory}` : ''}`}
                        className='text-[#002060] hover:text-[#003399] text-sm font-semibold transition-colors flex items-center'
                        onClick={scrollTop}
                    >
                        Ver todos <FaAngleRight className='ml-1 transition-transform hover:translate-x-1' />
                    </Link>
                </div>
            )}

            <div className='relative group'>
                {/* Botones de scroll */}
                {showLeftButton && (
                    <button
                        className='absolute left-0 top-1/2 transform -translate-y-1/2 z-10 
                                bg-white shadow-lg rounded-full p-3 hover:bg-blue-50 
                                transition-all duration-300 -translate-x-2
                                opacity-0 group-hover:opacity-100 group-hover:translate-x-0 hidden md:block'
                        onClick={scrollLeft}
                        aria-label="Scroll izquierda"
                    >
                        <FaAngleLeft className='text-[#002060]' />
                    </button>
                )}
                
                {showRightButton && (
                    <button
                        className='absolute right-0 top-1/2 transform -translate-y-1/2 z-10 
                                bg-white shadow-lg rounded-full p-3 hover:bg-blue-50 
                                transition-all duration-300 translate-x-2
                                opacity-0 group-hover:opacity-100 group-hover:translate-x-0 hidden md:block'
                        onClick={scrollRight}
                        aria-label="Scroll derecha"
                    >
                        <FaAngleRight className='text-[#002060]' />
                    </button>
                )}

                {/* Contenedor de productos - MANTIENE EL DISEÑO ORIGINAL */}
                <div
                    ref={scrollElement}
                    className='flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth py-4 snap-x'
                >
                    {loading
                        ? loadingList.map((_, index) => (
                            <div
                                key={index}
                                className='snap-center flex-none w-[150px] sm:w-[170px] md:w-[190px] lg:w-[210px] h-[280px] sm:h-[300px] bg-white rounded-lg shadow-sm border animate-pulse'
                            >
                                <div className='bg-gray-200 h-32 sm:h-36 rounded-t-lg'></div>
                                <div className='p-2.5 space-y-1.5'>
                                    <div className='h-4 bg-gray-200 rounded'></div>
                                    <div className='h-3 bg-gray-200 rounded w-2/3'></div>
                                    <div className='h-6 bg-gray-200 rounded'></div>
                                    <div className='h-8 bg-gray-200 rounded'></div>
                                </div>
                            </div>
                        ))
                        : data.map((product) => {
                            const discount = calculateDiscount(product?.price, product?.sellingPrice);
                            const isHovered = hoveredProductId === product?._id;
                            const secondImage = product.productImage?.[1];
                            const showSecondImage = isHovered && secondImage;
                            
                            // Funciones para manejar hover con delay
                            const handleMouseEnter = () => {
                                // Limpiar cualquier timeout previo
                                if (hoverTimeout) {
                                    clearTimeout(hoverTimeout);
                                }
                                
                                // Establecer nuevo timeout de 300ms
                                const timeout = setTimeout(() => {
                                    setHoveredProductId(product?._id);
                                }, 300);
                                
                                setHoverTimeout(timeout);
                            };
                            
                            const handleMouseLeave = () => {
                                // Limpiar timeout si existe
                                if (hoverTimeout) {
                                    clearTimeout(hoverTimeout);
                                    setHoverTimeout(null);
                                }
                                
                                // Inmediatamente quitar el hover
                                setHoveredProductId(null);
                            };
                            
                            return (
                                <Link to={`/producto/${product?.slug || product?._id}`}
                                    key={product?._id} 
                                    className='snap-center flex-none w-[150px] sm:w-[170px] md:w-[190px] lg:w-[210px] h-[280px] sm:h-[300px] bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 group/card relative flex flex-col'
                                    onClick={scrollTop}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {/* Imagen del producto */}
                                    <div className='h-32 sm:h-36 rounded-t-lg flex items-center justify-center overflow-hidden relative bg-gray-50'>
                                        {/* Imagen principal */}
                                        <img
                                            src={product.productImage[0]}
                                            alt={product.productName}
                                            className={`object-contain h-full w-full transition-all duration-500 ease-in-out ${
                                                showSecondImage ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                                            }`}
                                            loading="lazy"
                                        />
                                        
                                        {/* Imagen de hover (segunda imagen) */}
                                        {secondImage && (
                                            <img
                                                src={secondImage}
                                                alt={product.productName}
                                                className={`absolute inset-0 object-contain h-full w-full transition-all duration-500 ease-in-out ${
                                                    showSecondImage ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                                                }`}
                                                loading="lazy"
                                            />
                                        )}

                                        {/* Badge de descuento - solo en la esquina superior izquierda */}
                                        {discount && (
                                            <div className="absolute top-2 left-2">
                                                <span className='bg-red-500 text-white text-xs font-bold px-2 py-1 rounded'>
                                                    -{Math.round(((product?.price - product?.sellingPrice) / product?.price) * 100)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detalles del producto - ESTRUCTURA FIJA */}
                                    <div className='p-2.5 flex flex-col flex-grow'>
                                        {/* Contenido superior que puede variar */}
                                        <div className='flex-grow space-y-1.5'>
                                            <h3 className='font-medium text-xs text-gray-600 leading-tight line-clamp-4 min-h-[2.8rem]'>
                                                {product?.productName}
                                            </h3>
                                            
                                            <div className='text-xs text-gray-500 uppercase font-medium tracking-wide'>
                                                {product?.subcategory || product?.brandName}
                                            </div>
                                        </div>
                                        
                                        {/* Contenido inferior fijo - SIEMPRE EN LA MISMA POSICIÓN */}
                                        <div className='mt-auto space-y-2'>
                                            <div className='space-y-0.5 text-center'>
                                                <div className='text-lg font-bold text-black'>
                                                    {displayPYGCurrency(product?.sellingPrice)}
                                                </div>
                                                {product?.price > 0 && product?.price > product?.sellingPrice && (
                                                    <div className='text-xs text-gray-400 line-through'>
                                                        {displayPYGCurrency(product?.price)}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleAddToCart(e, product);
                                                }}
                                                className='w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 
                                                        text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors'
                                            >
                                                <FaShoppingCart size={11} /> Agregar
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

export default VerticalCardProduct;