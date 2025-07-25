import React, { useContext, useEffect, useRef, useState } from 'react';
import displayPYGCurrency from '../helpers/displayCurrency';
import { FaAngleLeft, FaAngleRight, FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import addToCart from '../helpers/addToCart';
import Context from '../context';
import scrollTop from '../helpers/scrollTop';

// ✅ COMPONENTE OPTIMIZADO CON SPINNERS - SOLO RECIBE DATOS POR PROPS
const VerticalCardProduct = ({ 
  category, 
  subcategory, 
  heading, 
  products = [],        // ✅ DATOS POR PROPS - NO MÁS QUERIES
  loading = false       // ✅ LOADING POR PROPS
}) => {
    const [data, setData] = useState([]);
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(true);
    const [hoveredProductId, setHoveredProductId] = useState(null);
    const [hoverTimeout, setHoverTimeout] = useState(null);
    const [imageLoadingStates, setImageLoadingStates] = useState({}); // ✅ ESTADO PARA SPINNERS
    const loadingList = new Array(6).fill(null);

    const scrollElement = useRef();
    const { fetchUserAddToCart } = useContext(Context);

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        addToCart(e, product);
        fetchUserAddToCart();
    };

    // ✅ MANEJAR ESTADOS DE CARGA DE IMÁGENES
    const handleImageLoad = (productId, imageIndex) => {
        setImageLoadingStates(prev => ({
            ...prev,
            [`${productId}-${imageIndex}`]: false
        }));
    };

    const handleImageStart = (productId, imageIndex) => {
        setImageLoadingStates(prev => ({
            ...prev,
            [`${productId}-${imageIndex}`]: true
        }));
    };

    const isImageLoading = (productId, imageIndex) => {
        return imageLoadingStates[`${productId}-${imageIndex}`] || false;
    };

    // ✅ SINCRONIZAR CON PROPS - INSTANTÁNEO
    useEffect(() => {
        if (products && products.length > 0) {
            // Aplicar límites inteligentes localmente
            const limits = {
                'mouses': 12,
                'teclados': 12,
                'auriculares': 12,
                'microfonos': 12,
                'notebooks': 20,
                'monitores': 20,
                'memorias_ram': 20,
                'discos_duros': 20,
                'tarjeta_grafica': 20,
                'gabinetes': 20,
                'procesador': 20,
                'placas_madre': 20,
            };
            
            const limit = limits[subcategory] || 20;
            const limitedProducts = products.slice(0, limit);
            setData(limitedProducts);

            // ✅ INICIALIZAR ESTADOS DE CARGA PARA NUEVOS PRODUCTOS
            const newImageStates = {};
            limitedProducts.forEach(product => {
                if (product?.productImage?.[0]) {
                    newImageStates[`${product._id}-0`] = true;
                }
                if (product?.productImage?.[1]) {
                    newImageStates[`${product._id}-1`] = true;
                }
            });
            setImageLoadingStates(newImageStates);
        } else {
            setData([]);
            setImageLoadingStates({});
        }
    }, [products, subcategory]);

    // ✅ PRECARGAR IMÁGENES SOLO CUANDO HAY DATOS
    useEffect(() => {
        if (data.length > 0) {
            // Precargar en chunks para no saturar la red
            const preloadInChunks = (products, chunkSize = 3) => {
                for (let i = 0; i < products.length; i += chunkSize) {
                    setTimeout(() => {
                        const chunk = products.slice(i, i + chunkSize);
                        chunk.forEach(product => {
                            if (product?.productImage?.[0]) {
                                const img1 = new Image();
                                img1.src = product.productImage[0];
                            }
                            if (product?.productImage?.[1]) {
                                const img2 = new Image();
                                img2.src = product.productImage[1];
                            }
                        });
                    }, i * 100); // 100ms entre chunks
                }
            };
            
            preloadInChunks(data);
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

    // ✅ COMPONENTE SPINNER PERSONALIZADO
    const ImageSpinner = () => (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="relative">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#002060] rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-[#002060] rounded-full animate-pulse"></div>
            </div>
        </div>
    );

    // ✅ SI NO HAY PRODUCTOS Y NO ESTÁ CARGANDO, NO RENDERIZAR
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

                {/* Contenedor de productos */}
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
                                if (hoverTimeout) {
                                    clearTimeout(hoverTimeout);
                                }
                                
                                const timeout = setTimeout(() => {
                                    setHoveredProductId(product?._id);
                                }, 300);
                                
                                setHoverTimeout(timeout);
                            };
                            
                            const handleMouseLeave = () => {
                                if (hoverTimeout) {
                                    clearTimeout(hoverTimeout);
                                    setHoverTimeout(null);
                                }
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
                                    {/* ✅ IMAGEN DEL PRODUCTO CON SPINNERS */}
                                    <div className='h-32 sm:h-36 rounded-t-lg flex items-center justify-center overflow-hidden relative bg-gray-50'>
                                        {/* ✅ SPINNER PARA IMAGEN PRINCIPAL */}
                                        {isImageLoading(product?._id, 0) && <ImageSpinner />}
                                        
                                        {/* Imagen principal */}
                                        <img
                                            src={product.productImage[0]}
                                            alt={product.productName}
                                            className={`object-contain h-full w-full transition-all duration-500 ease-in-out ${
                                                showSecondImage ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                                            }`}
                                            loading="lazy"
                                            onLoadStart={() => handleImageStart(product?._id, 0)}
                                            onLoad={() => handleImageLoad(product?._id, 0)}
                                            onError={() => handleImageLoad(product?._id, 0)}
                                        />
                                        
                                        {/* ✅ IMAGEN DE HOVER CON SPINNER */}
                                        {secondImage && (
                                            <>
                                                {/* Spinner para segunda imagen */}
                                                {isImageLoading(product?._id, 1) && showSecondImage && <ImageSpinner />}
                                                
                                                <img
                                                    src={secondImage}
                                                    alt={product.productName}
                                                    className={`absolute inset-0 object-contain h-full w-full transition-all duration-500 ease-in-out ${
                                                        showSecondImage ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                                                    }`}
                                                    loading="lazy"
                                                    onLoadStart={() => handleImageStart(product?._id, 1)}
                                                    onLoad={() => handleImageLoad(product?._id, 1)}
                                                    onError={() => handleImageLoad(product?._id, 1)}
                                                />
                                            </>
                                        )}

                                        {/* Badge de descuento */}
                                        {discount && (
                                            <div className="absolute top-2 left-2 z-10">
                                                <span className='bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm'>
                                                    -{Math.round(((product?.price - product?.sellingPrice) / product?.price) * 100)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detalles del producto */}
                                    <div className='p-2.5 flex flex-col flex-grow'>
                                        <div className='flex-grow space-y-1.5'>
                                            <h3 className='font-medium text-xs text-gray-600 leading-tight line-clamp-4 min-h-[2.8rem]'>
                                                {product?.productName}
                                            </h3>
                                            
                                            <div className='text-xs text-gray-500 uppercase font-medium tracking-wide'>
                                                {product?.subcategory || product?.brandName}
                                            </div>
                                        </div>
                                        
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