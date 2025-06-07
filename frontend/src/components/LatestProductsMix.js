import React, { useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import displayPYGCurrency from '../helpers/displayCurrency';
import { FaAngleLeft, FaAngleRight, FaShoppingCart, FaExpand } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import addToCart from '../helpers/addToCart';
import Context from '../context';
import scrollTop from '../helpers/scrollTop';
import productCategory from '../helpers/productCategory';
import { optimizedCache } from '../services/OptimizedCacheService';

const LatestProductsMix = ({ limit = 5 }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(true);
    const [hoveredProductId, setHoveredProductId] = useState(null);
    const [imagesPreloaded, setImagesPreloaded] = useState(false);
    
    // OPTIMIZACIÓN: Reducir skeleton items para móvil
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const loadingList = useMemo(() => 
        new Array(isMobile ? Math.min(limit, 3) : limit).fill(null), 
        [isMobile, limit]
    );

    const scrollElement = useRef();
    const { fetchUserAddToCart } = useContext(Context);
    const preloadTimeoutRef = useRef(null);

    // OPTIMIZACIÓN: Detectar móvil con throttle
    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setIsMobile(window.innerWidth < 768);
            }, 100);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleAddToCart = useCallback((e, product) => {
        e.preventDefault();
        addToCart(e, product);
        fetchUserAddToCart();
    }, [fetchUserAddToCart]);

    // OPTIMIZACIÓN: Memoizar función de categorías
    const getCategoryInfo = useCallback((categoryValue, subcategoryValue) => {
        const category = productCategory.find(cat => cat.value === categoryValue);
        if (!category) return { categoryLabel: 'Categoría', subcategoryLabel: 'Subcategoría' };
        
        const subcategory = category.subcategories.find(sub => sub.value === subcategoryValue);
        return {
            categoryLabel: category.label,
            subcategoryLabel: subcategory ? subcategory.label : 'Subcategoría'
        };
    }, []);

    // NUEVA función de fetch ultra-optimizada
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            console.log('🚀 Ultra-fast loading productos destacados');
            
            let allProducts = [];
            
            // OPTIMIZACIÓN: Cargar categorías en paralelo con Promise.allSettled
            const categories = ['informatica', 'perifericos', 'telefonia'];
            const categoryPromises = categories.map(async (category) => {
                try {
                    const response = await optimizedCache.getProducts(category, null, 'normal', 15);
                    return response?.success ? response.data || [] : [];
                } catch (error) {
                    console.warn(`Error loading category ${category}:`, error);
                    return [];
                }
            });

            const categoryResults = await Promise.allSettled(categoryPromises);
            
            // OPTIMIZACIÓN: Procesamiento más eficiente
            categoryResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value.length > 0) {
                    allProducts.push(...result.value);
                }
            });

            if (allProducts.length === 0) {
                console.warn('No products loaded from cache');
                setData([]);
                return;
            }

            // OPTIMIZACIÓN: Algoritmo de intercalado más eficiente
            const processedData = processProducts(allProducts, limit);
            setData(processedData);
            
            console.log('✅ Ultra-fast productos destacados:', processedData.length);
            
            // OPTIMIZACIÓN: Precargar imágenes de forma inteligente
            if (!imagesPreloaded) {
                preloadCriticalImages(processedData.slice(0, isMobile ? 2 : 4));
                setImagesPreloaded(true);
            }
            
        } catch (error) {
            console.error("Error al cargar productos destacados:", error);
        } finally {
            setLoading(false);
        }
    }, [limit, isMobile, imagesPreloaded]);

    // NUEVA función de procesamiento optimizada
    const processProducts = useCallback((allProducts, limit) => {
        // Ordenar por fecha de forma más eficiente
        const sortedProducts = allProducts
            .filter(product => product.createdAt) // Filtrar productos sin fecha
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Agrupar por subcategoría de forma más eficiente
        const productsBySubcategory = new Map();
        
        sortedProducts.forEach(product => {
            const key = product.subcategory || 'otros';
            if (!productsBySubcategory.has(key)) {
                productsBySubcategory.set(key, []);
            }
            if (productsBySubcategory.get(key).length < limit) {
                productsBySubcategory.get(key).push(product);
            }
        });
        
        // Intercalado más eficiente
        const result = [];
        const subcategories = Array.from(productsBySubcategory.keys());
        const maxLength = Math.max(...Array.from(productsBySubcategory.values()).map(arr => arr.length));
        
        for (let i = 0; i < maxLength && result.length < limit * 4; i++) {
            for (const subcategory of subcategories) {
                const products = productsBySubcategory.get(subcategory);
                if (i < products.length && result.length < limit * 4) {
                    result.push(products[i]);
                }
            }
        }
        
        return result.slice(0, limit * 2); // Limitar el resultado final
    }, []);

    // NUEVA función de preloading inteligente
    const preloadCriticalImages = useCallback((products) => {
        if (preloadTimeoutRef.current) {
            clearTimeout(preloadTimeoutRef.current);
        }
        
        preloadTimeoutRef.current = setTimeout(() => {
            products.forEach((product, index) => {
                if (product?.productImage?.[0]) {
                    const img = new Image();
                    img.fetchPriority = index < 2 ? 'high' : 'low';
                    img.loading = index < 2 ? 'eager' : 'lazy';
                    img.src = product.productImage[0];
                }
            });
        }, 100);
    }, []);

    // OPTIMIZACIÓN: useEffect con dependencias optimizadas
    useEffect(() => {
        // Delay inteligente basado en cache stats
        const cacheStats = optimizedCache.getStats();
        const hasCache = cacheStats.memorySize > 5;
        const delay = hasCache ? 500 : 1500; // Menos delay si hay cache
        
        const timer = setTimeout(() => {
            fetchData();
        }, delay);

        return () => {
            clearTimeout(timer);
            if (preloadTimeoutRef.current) {
                clearTimeout(preloadTimeoutRef.current);
            }
        };
    }, [fetchData]);

    // OPTIMIZACIÓN: Funciones de scroll con throttle
    const scrollRight = useCallback(() => {
        if (scrollElement.current) {
            const scrollAmount = isMobile ? 250 : 300;
            scrollElement.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }, [isMobile]);

    const scrollLeft = useCallback(() => {
        if (scrollElement.current) {
            const scrollAmount = isMobile ? 250 : 300;
            scrollElement.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    }, [isMobile]);

    // OPTIMIZACIÓN: Check scroll position con throttle
    const checkScrollPosition = useCallback(() => {
        if (!scrollElement.current) return;
        
        const { scrollLeft, scrollWidth, clientWidth } = scrollElement.current;
        setShowLeftButton(scrollLeft > 10);
        setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);
    
    useEffect(() => {
        const scrollContainer = scrollElement.current;
        if (!scrollContainer) return;

        let throttleTimeout;
        const throttledCheck = () => {
            if (throttleTimeout) return;
            throttleTimeout = setTimeout(() => {
                checkScrollPosition();
                throttleTimeout = null;
            }, 50);
        };

        scrollContainer.addEventListener('scroll', throttledCheck, { passive: true });
        checkScrollPosition(); // Check inicial
        
        return () => {
            if (throttleTimeout) clearTimeout(throttleTimeout);
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', throttledCheck);
            }
        };
    }, [checkScrollPosition]);

    // OPTIMIZACIÓN: Memoizar función de descuento
    const calculateDiscount = useCallback((price, sellingPrice) => {
        if (price && price > 0) {
            const discount = Math.round(((price - sellingPrice) / price) * 100);
            return discount > 0 ? `${discount}% OFF` : null;
        }
        return null;
    }, []);

    // Early return optimizado
    if (!loading && data.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No se encontraron productos destacados.</p>
            </div>
        );
    }

    return (
        <div className='w-full relative'>
            <div className='relative group'>
                {/* Botones de scroll - solo en desktop */}
                {!isMobile && showLeftButton && (
                    <button
                        className='absolute left-0 top-1/2 transform -translate-y-1/2 z-10 
                                bg-white shadow-lg rounded-full p-3 hover:bg-blue-50 
                                transition-all duration-300 -translate-x-2
                                opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                        onClick={scrollLeft}
                        aria-label="Scroll izquierda"
                    >
                        <FaAngleLeft className='text-[#002060]' />
                    </button>
                )}
                
                {!isMobile && showRightButton && (
                    <button
                        className='absolute right-0 top-1/2 transform -translate-y-1/2 z-10 
                                bg-white shadow-lg rounded-full p-3 hover:bg-blue-50 
                                transition-all duration-300 translate-x-2
                                opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                        onClick={scrollRight}
                        aria-label="Scroll derecha"
                    >
                        <FaAngleRight className='text-[#002060]' />
                    </button>
                )}

                {/* Contenedor de productos optimizado */}
                <div
                    ref={scrollElement}
                    className='flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth py-4 snap-x'
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {loading
                        ? loadingList.map((_, index) => (
                            <div
                                key={index}
                                className='snap-center flex-none w-[200px] sm:w-[220px] md:w-[250px] lg:w-[280px] bg-white rounded-xl shadow-md animate-pulse'
                            >
                                <div className='bg-gray-200 h-40 sm:h-48 rounded-t-xl'></div>
                                <div className='p-4 sm:p-5 space-y-3'>
                                    <div className='h-4 bg-gray-300 rounded-full'></div>
                                    <div className='h-4 bg-gray-300 rounded-full w-2/3'></div>
                                    <div className='h-8 sm:h-10 bg-gray-300 rounded-full'></div>
                                </div>
                            </div>
                        ))
                        : data.map((product) => {
                            const discount = calculateDiscount(product?.price, product?.sellingPrice);
                            const subcategoryInfo = getCategoryInfo(product.category, product.subcategory);
                            
                            return (
                                <ProductCard
                                    key={product?._id}
                                    product={product}
                                    discount={discount}
                                    subcategoryInfo={subcategoryInfo}
                                    hoveredProductId={hoveredProductId}
                                    setHoveredProductId={setHoveredProductId}
                                    handleAddToCart={handleAddToCart}
                                    isMobile={isMobile}
                                />
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

// COMPONENTE OPTIMIZADO: ProductCard memoizado
const ProductCard = React.memo(({ 
    product, 
    discount, 
    subcategoryInfo, 
    hoveredProductId, 
    setHoveredProductId, 
    handleAddToCart,
    isMobile 
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const handleMouseEnter = useCallback(() => {
        if (!isMobile) {
            setHoveredProductId(product?._id);
        }
    }, [isMobile, product?._id, setHoveredProductId]);
    
    const handleMouseLeave = useCallback(() => {
        if (!isMobile) {
            setHoveredProductId(null);
        }
    }, [isMobile, setHoveredProductId]);

    const cardWidth = isMobile ? 'w-[200px]' : 'w-[220px] sm:w-[250px] md:w-[280px]';
    const imageHeight = isMobile ? 'h-40' : 'h-48';
    const padding = isMobile ? 'p-4' : 'p-5';

    return (
        <Link 
            to={`/producto/${product?.slug || product?._id}`} 
            className={`snap-center flex-none ${cardWidth} bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 group/card product-card relative`}
            onClick={scrollTop}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Etiqueta de descuento */}
            {discount && (
                <div className='absolute top-3 left-3 z-10 bg-[#1565C0] text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold'>
                    {discount}
                </div>
            )}
            
            {/* Subcategoría */}
            <div className='absolute top-3 right-3 z-10 bg-[#002060] text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold'>
                {subcategoryInfo.subcategoryLabel}
            </div>
            
            {/* Imagen del producto optimizada */}
            <div className={`block bg-[#f4f7fb] ${imageHeight} rounded-t-xl flex items-center justify-center overflow-hidden relative`}>
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-t-xl"></div>
                )}
                <img
                    src={product.productImage[0]}
                    alt={product.productName}
                    className={`object-contain h-full w-full transform group-hover/card:scale-110 transition-all duration-500 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                />
                {!isMobile && (
                    <div className='absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300'>
                        <div className='bg-white/70 p-2 rounded-full'>
                            <FaExpand className='text-[#002060]' />
                        </div>
                    </div>
                )}
            </div>

            {/* Detalles del producto */}
            <div className={`${padding} space-y-3`}>
                <h2 className={`font-semibold text-sm sm:text-base text-gray-700 ${
                    hoveredProductId === product?._id ? 'line-clamp-none' : 'line-clamp-2'
                } hover:line-clamp-none transition-all duration-300`}>
                    {product?.productName}
                </h2>
                
                <div className='flex items-center justify-between'>
                    <span className='text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full'>
                        {product?.brandName}
                    </span>
                    <div className='flex flex-col items-end'>
                        <p className='text-[#002060] font-bold text-sm sm:text-base'>
                            {displayPYGCurrency(product?.sellingPrice)}
                        </p>
                        {product?.price > 0 && (
                            <p className='text-gray-400 line-through text-xs'>
                                {displayPYGCurrency(product?.price)}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(e, product);
                    }}
                    className='w-full flex items-center justify-center gap-2 bg-[#002060] hover:bg-[#003399] 
                            text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors active:scale-95'
                >
                    <FaShoppingCart /> Agregar al Carrito
                </button>
            </div>
        </Link>
    );
});

ProductCard.displayName = 'ProductCard';

export default LatestProductsMix;