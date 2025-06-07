import React, { useContext, useEffect, useRef, useState } from 'react';
import displayPYGCurrency from '../helpers/displayCurrency';
import { FaAngleLeft, FaAngleRight, FaShoppingCart, FaExpand } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import addToCart from '../helpers/addToCart';
import Context from '../context';
import scrollTop from '../helpers/scrollTop';
import SummaryApi from '../common';
import productCategory from '../helpers/productCategory';

const LatestProductsMix = ({ limit = 5 }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(true);
    const [hoveredProductId, setHoveredProductId] = useState(null);
    const loadingList = new Array(limit).fill(null);

    const scrollElement = useRef();

    const { fetchUserAddToCart } = useContext(Context);

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        addToCart(e, product);
        fetchUserAddToCart();
    };

    // Función para obtener etiquetas legibles de categorías/subcategorías
    const getCategoryInfo = (categoryValue, subcategoryValue) => {
        const category = productCategory.find(cat => cat.value === categoryValue);
        if (!category) return { categoryLabel: 'Categoría', subcategoryLabel: 'Subcategoría' };
        
        const subcategory = category.subcategories.find(sub => sub.value === subcategoryValue);
        return {
            categoryLabel: category.label,
            subcategoryLabel: subcategory ? subcategory.label : 'Subcategoría'
        };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Obtener todos los productos
            const response = await fetch(SummaryApi.allProduct.url);
            const responseData = await response.json();
            
            if (responseData.success) {
                const allProducts = responseData.data || [];
                
                // Ordenar por fecha de creación (más recientes primero)
                allProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                // Agrupar productos por subcategoría
                const productsBySubcategory = {};
                
                allProducts.forEach(product => {
                    const key = product.subcategory;
                    if (!productsBySubcategory[key]) {
                        productsBySubcategory[key] = [];
                    }
                    productsBySubcategory[key].push(product);
                });
                
                // Tomar los primeros 5 productos de cada subcategoría
                const subcategories = Object.keys(productsBySubcategory);
                let productsToShow = [];
                
                subcategories.forEach(subcategory => {
                    const subcategoryProducts = productsBySubcategory[subcategory]
                        .slice(0, limit); // Tomar hasta 5 productos por subcategoría
                    productsToShow = [...productsToShow, ...subcategoryProducts];
                });
                
                // Intercalar productos
                // Primero los ordenamos por subcategoría y luego por fecha
                // Esto garantiza que los productos estén agrupados por subcategoría
                productsToShow.sort((a, b) => {
                    // Si son de diferentes subcategorías, ordenar alfabéticamente por subcategoría
                    if (a.subcategory !== b.subcategory) {
                        return a.subcategory.localeCompare(b.subcategory);
                    }
                    
                    // Si son de la misma subcategoría, ordenar por fecha (más reciente primero)
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                
                // Ahora intercalamos los productos
                const interleavedProducts = [];
                const maxProductsPerSubcategory = Math.min(
                    limit,
                    Math.max(...Object.values(productsBySubcategory).map(arr => arr.length))
                );
                
                // Para cada posición (0-4)
                for (let i = 0; i < maxProductsPerSubcategory; i++) {
                    // Para cada subcategoría
                    subcategories.forEach(subcategory => {
                        const productList = productsBySubcategory[subcategory];
                        if (i < productList.length) {
                            interleavedProducts.push(productList[i]);
                        }
                    });
                }
                
                setData(interleavedProducts);
            }
        } catch (error) {
            console.error("Error al cargar productos destacados:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [limit]);

    const scrollRight = () => {
        scrollElement.current.scrollBy({ left: 300, behavior: 'smooth' });
    };

    const scrollLeft = () => {
        scrollElement.current.scrollBy({ left: -300, behavior: 'smooth' });
    };

    const checkScrollPosition = () => {
        const { scrollLeft, scrollWidth, clientWidth } = scrollElement.current;
        setShowLeftButton(scrollLeft > 0);
        setShowRightButton(scrollLeft < scrollWidth - clientWidth);
    };
    
    useEffect(() => {
        const scrollContainer = scrollElement.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', checkScrollPosition);
            checkScrollPosition();
            return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
        }
    }, []);

    const calculateDiscount = (price, sellingPrice) => {
        if (price && price > 0) {
            const discount = Math.round(((price - sellingPrice) / price) * 100);
            return discount > 0 ? `${discount}% OFF` : null;
        }
        return null;
    };

    // Si no hay datos y terminó de cargar, no renderizar nada
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

                {/* Contenedor de productos */}
                <div
                    ref={scrollElement}
                    className='flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth py-4 snap-x'
                >
                    {loading
                        ? loadingList.map((_, index) => (
                            <div
                                key={index}
                                className='snap-center flex-none w-[220px] sm:w-[250px] md:w-[280px] bg-white rounded-xl shadow-md animate-pulse'
                            >
                                <div className='bg-gray-200 h-48 rounded-t-xl'></div>
                                <div className='p-5 space-y-3'>
                                    <div className='h-4 bg-gray-300 rounded-full'></div>
                                    <div className='h-4 bg-gray-300 rounded-full w-2/3'></div>
                                    <div className='h-10 bg-gray-300 rounded-full'></div>
                                </div>
                            </div>
                        ))
                        : data.map((product) => {
                            const discount = calculateDiscount(product?.price, product?.sellingPrice);
                            const subcategoryInfo = getCategoryInfo(product.category, product.subcategory);
                            
                            return (
                                <Link 
                                    to={`/producto/${product?._id}`} 
                                    key={product?._id} 
                                    className='snap-center flex-none w-[220px] sm:w-[250px] md:w-[280px] bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 group/card product-card relative'
                                    onClick={scrollTop}
                                    onMouseEnter={() => setHoveredProductId(product?._id)}
                                    onMouseLeave={() => setHoveredProductId(null)}
                                >
                                    {/* Etiqueta de descuento */}
                                    {discount && (
                                        <div className='absolute top-4 left-4 z-10 bg-[#1565C0] text-white px-3 py-1 rounded-full text-xs font-bold'>
                                            {discount}
                                        </div>
                                    )}
                                    
                                    {/* Subcategoría en lugar de categoría */}
                                    <div className='absolute top-4 right-4 z-10 bg-[#002060] text-white px-3 py-1 rounded-full text-xs font-bold'>
                                        {subcategoryInfo.subcategoryLabel}
                                    </div>
                                    
                                    {/* Imagen del producto */}
                                    <div className='block bg-[#f4f7fb] h-48 rounded-t-xl flex items-center justify-center overflow-hidden relative'>
                                        <img
                                            src={product.productImage[0]}
                                            alt={product.productName}
                                            className='object-contain h-full w-full transform group-hover/card:scale-110 transition-transform duration-500'
                                        />
                                        <div className='absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300'>
                                            <div className='bg-white/70 p-2 rounded-full'>
                                                <FaExpand className='text-[#002060]' />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detalles del producto */}
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
                                                {product?.brandName}
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

                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleAddToCart(e, product);
                                            }}
                                            className='w-full flex items-center justify-center gap-2 bg-[#002060] hover:bg-[#003399] 
                                                    text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:scale-95'
                                        >
                                            <FaShoppingCart /> Agregar al Carrito
                                        </button>
                                    </div>
                                </Link>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

export default LatestProductsMix;