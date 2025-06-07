import { useState, useEffect, useCallback } from 'react';
import { optimizedCache } from '../services/OptimizedCacheService';

export const useOptimizedProducts = (category, subcategory = null, options = {}) => {
  const {
    priority = 'normal',
    initialLimit = null,
    enableProgressiveLoading = true,
    autoLoadFull = true
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  // Cargar productos iniciales
  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await optimizedCache.getProducts(
        category, 
        subcategory, 
        priority, 
        initialLimit
      );

      if (response?.success) {
        setData(response.data || []);
        
        // Si tenemos limit, marcar como incompleto para cargar más después
        if (initialLimit && response.data?.length >= initialLimit) {
          setIsComplete(false);
          
          // Auto-cargar resto después de un delay
          if (autoLoadFull && enableProgressiveLoading) {
            setTimeout(() => loadComplete(), 1000);
          }
        } else {
          setIsComplete(true);
        }
      }
    } catch (err) {
      setError(err);
      console.error('Error loading initial products:', err);
    } finally {
      setLoading(false);
    }
  }, [category, subcategory, priority, initialLimit, autoLoadFull, enableProgressiveLoading]);

  // Cargar productos completos
  const loadComplete = useCallback(async () => {
    if (isComplete) return;

    try {
      setLoadingMore(true);
      
      const response = await optimizedCache.getProducts(
        category, 
        subcategory, 
        'normal', 
        null // Sin limit para cargar todo
      );

      if (response?.success) {
        setData(response.data || []);
        setIsComplete(true);
      }
    } catch (err) {
      console.error('Error loading complete products:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [category, subcategory, isComplete]);

  // Efecto principal
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    data,
    loading,
    loadingMore,
    error,
    isComplete,
    loadComplete,
    refresh: loadInitial
  };
};

// 3. HOOK PARA CARGA BATCH PRIORITARIA
export const usePriorityBatchLoader = () => {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [priorityComplete, setPriorityComplete] = useState(false);

  // Configuración de categorías prioritarias
  const PRIORITY_CATEGORIES = [
    { category: 'informatica', subcategory: 'notebooks', limit: 5 },
    { category: 'informatica', subcategory: 'placas_madre', limit: 5 },
    { category: 'perifericos', subcategory: 'monitores', limit: 5 },
    { category: 'informatica', subcategory: 'memorias_ram', limit: 5 },
    { category: 'informatica', subcategory: 'discos_duros', limit: 5 },
    { category: 'informatica', subcategory: 'tarjeta_grafica', limit: 5 },
    { category: 'informatica', subcategory: 'gabinetes', limit: 5 },
    { category: 'informatica', subcategory: 'procesador', limit: 5 },
    { category: 'perifericos', subcategory: 'mouses', limit: 5 },
    { category: 'perifericos', subcategory: 'teclados', limit: 5 }
  ];

  const loadPriorityProducts = useCallback(async () => {
    try {
      setGlobalLoading(true);
      console.log('🚀 Iniciando carga prioritaria de productos');

      // Cargar productos prioritarios en batch
      await optimizedCache.batchLoadPriority(PRIORITY_CATEGORIES);
      
      setPriorityComplete(true);
      console.log('✅ Carga prioritaria completada');

      // Delay pequeño para UX, luego continuar con carga completa
      setTimeout(() => {
        setGlobalLoading(false);
        // Iniciar carga completa en background
        loadAllProducts();
      }, 300);

    } catch (error) {
      console.error('Error en carga prioritaria:', error);
      setGlobalLoading(false);
    }
  }, []);

  const loadAllProducts = useCallback(async () => {
    try {
      console.log('🔄 Iniciando carga completa en background');
      
      // Cargar todas las categorías sin limit
      const fullCategories = PRIORITY_CATEGORIES.map(cat => ({
        ...cat,
        limit: null
      }));

      await optimizedCache.batchLoadPriority(fullCategories);
      console.log('✅ Carga completa terminada');

    } catch (error) {
      console.error('Error en carga completa:', error);
    }
  }, []);

  useEffect(() => {
    loadPriorityProducts();
  }, [loadPriorityProducts]);

  return {
    globalLoading,
    priorityComplete,
    cacheStats: optimizedCache.getStats()
  };
};

