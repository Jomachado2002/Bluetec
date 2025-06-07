import React, { useContext, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Context from '../context';
import addToCart from '../helpers/addToCart';
import displayPYGCurrency from '../helpers/displayCurrency';
import { FaShoppingCart } from 'react-icons/fa';

const VerticalCardMobile = ({ loading, data = [], limit = 10 }) => {
  const { fetchUserAddToCart } = useContext(Context);
  const [imageErrors, setImageErrors] = useState(new Set());
  
  // MEMOIZAR skeletons para evitar re-crear arrays
  const skeletons = useMemo(() => 
    Array.from({ length: Math.min(limit, 8) }, (_, i) => i), 
    [limit]
  );
  
  // OPTIMIZAR handler de carrito
  const handleAddToCart = useCallback((e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(e, product);
    fetchUserAddToCart();
  }, [fetchUserAddToCart]);
  
  // MEMOIZAR handler de errores
  const handleImageError = useCallback((productId) => {
    setImageErrors(prev => new Set([...prev, productId]));
  }, []);
  
  // FILTRAR datos una sola vez
  const filteredData = useMemo(() => 
    data
      .filter(product => (product?.stock === undefined || product?.stock > 0))
      .slice(0, limit),
    [data, limit]
  );

  if (loading) {
    return (
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2'>
        {skeletons.map((index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2'>
      {filteredData.map((product) => (
        <ProductCardLite 
          key={product._id}
          product={product}
          hasImageError={imageErrors.has(product._id)}
          onImageError={handleImageError}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
};

// COMPONENTE SKELETON MEMOIZADO
const SkeletonCard = React.memo(() => (
  <div className='bg-white rounded-lg shadow-sm border animate-pulse'>
    <div className='bg-gray-200 h-24 rounded-t-lg'></div>
    <div className='p-2 space-y-2'>
      <div className='h-3 bg-gray-200 rounded'></div>
      <div className='h-3 bg-gray-200 rounded w-2/3'></div>
      <div className='h-6 bg-gray-200 rounded'></div>
    </div>
  </div>
));

// COMPONENTE PRODUCTO ULTRA-OPTIMIZADO
const ProductCardLite = React.memo(({ 
  product, 
  hasImageError, 
  onImageError, 
  onAddToCart 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  const handleImageErrorInternal = useCallback(() => {
    onImageError(product._id);
  }, [onImageError, product._id]);
  
  const handleAddToCartInternal = useCallback((e) => {
    onAddToCart(e, product);
  }, [onAddToCart, product]);
  
  // CALCULAR descuento una sola vez
  const discount = useMemo(() => {
    if (product.price > product.sellingPrice && product.price > 0) {
      return Math.round(((product.price - product.sellingPrice) / product.price) * 100);
    }
    return null;
  }, [product.price, product.sellingPrice]);

  return (
    <Link
      to={`/producto/${product?.slug || product?._id}`}
      className='block bg-white rounded-lg shadow-sm border hover:shadow-md 
                 transition-shadow duration-200 overflow-hidden'
    >
      {/* Imagen optimizada */}
      <div className='h-24 bg-gray-50 flex items-center justify-center relative overflow-hidden'>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        {!hasImageError ? (
          <img
            src={product.productImage[0]}
            alt={product.productName}
            className={`w-full h-full object-contain transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageErrorInternal}
          />
        ) : (
          <div className="text-gray-400 text-xs text-center p-2">
            Sin imagen
          </div>
        )}

        {/* Badge de descuento */}
        {discount && (
          <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
            -{discount}%
          </div>
        )}
      </div>

      {/* Contenido del producto */}
      <div className='p-2'>
        {/* Título con altura fija */}
        <h3 className='text-xs font-medium text-gray-700 line-clamp-2 h-8 mb-1'>
          {product?.productName}
        </h3>
        
        {/* Subcategoría */}
        <div className='text-xs text-gray-500 mb-2 truncate'>
          {product?.subcategory || product?.brandName}
        </div>
        
        {/* Precios */}
        <div className='space-y-1 mb-2'>
          <div className='text-sm font-bold text-blue-600'>
            {displayPYGCurrency(product?.sellingPrice)}
          </div>
          {product?.price > product?.sellingPrice && (
            <div className='text-xs text-gray-400 line-through'>
              {displayPYGCurrency(product?.price)}
            </div>
          )}
        </div>

        {/* Botón agregar - MUY SIMPLE */}
        <button
          onClick={handleAddToCartInternal}
          className='w-full bg-blue-600 hover:bg-blue-700 text-white 
                     px-2 py-1 rounded text-xs font-medium transition-colors
                     flex items-center justify-center gap-1'
        >
          <FaShoppingCart size={10} />
          +
        </button>
      </div>
    </Link>
  );
});

ProductCardLite.displayName = 'ProductCardLite';
SkeletonCard.displayName = 'SkeletonCard';

export default VerticalCardMobile;