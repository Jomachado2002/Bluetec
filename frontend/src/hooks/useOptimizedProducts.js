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

  // NUEVO: Detectar móvil y ajustar comportamiento
  const isMobile = window.innerWidth < 768;
  const adjustedInitialLimit = isMobile 
    ? Math.min(initialLimit || 5, 5) // Máximo 5 en móvil
    : initialLimit;

  // OPTIMIZADO: Cargar productos iniciales
  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await optimizedCache.getProducts(
        category, 
        subcategory, 
        priority, 
        adjustedInitialLimit
      );

      if (response?.success) {
        setData(response.data || []);
        
        // OPTIMIZADO: En móvil, marcar como completo más rápido
        if (isMobile || !enableProgressiveLoading) {
          setIsComplete(true);
        } else if (adjustedInitialLimit && response.data?.length >= adjustedInitialLimit) {
          setIsComplete(false);
          
          // Auto-cargar resto después de delay mayor en móvil
          if (autoLoadFull && enableProgressiveLoading) {
            setTimeout(() => loadComplete(), isMobile ? 2000 : 1000);
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
  }, [category, subcategory, priority, adjustedInitialLimit, autoLoadFull, enableProgressiveLoading, isMobile]);

  // OPTIMIZADO: Cargar productos completos (solo si no es móvil de baja gama)
  const loadComplete = useCallback(async () => {
    if (isComplete) return;

    // NUEVO: Saltar carga completa en dispositivos muy lentos
    const isLowEnd = (navigator.deviceMemory || 4) < 4;
    if (isMobile && isLowEnd) {
      console.log('📱 Saltando carga completa en dispositivo de baja gama');
      setIsComplete(true);
      return;
    }

    try {
      setLoadingMore(true);
      
      const response = await optimizedCache.getProducts(
        category, 
        subcategory, 
        'normal', 
        isMobile ? 15 : null // Límite para móvil
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
  }, [category, subcategory, isComplete, isMobile]);

  // OPTIMIZADO: Efecto principal con delays ajustados
  useEffect(() => {
    // Delay más largo en móvil para no saturar
    const delay = isMobile ? 300 : 100;
    const timer = setTimeout(() => {
      loadInitial();
    }, delay);

    return () => clearTimeout(timer);
  }, [loadInitial, isMobile]);

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

// OPTIMIZADO: Hook para carga batch con secuencia móvil
export const usePriorityBatchLoader = () => {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [priorityComplete, setPriorityComplete] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);

  const isMobile = window.innerWidth < 768;

  // NUEVO: Configuración secuencial para móvil
  const MOBILE_PRIORITY_SEQUENCE = [
    // Fase 1: Críticos
    [
      { category: 'informatica', subcategory: 'notebooks', limit: 5 },
      { category: 'informatica', subcategory: 'placas_madre', limit: 5 }
    ],
    // Fase 2: Importantes
    [
      { category: 'perifericos', subcategory: 'monitores', limit: 5 },
      { category: 'perifericos', subcategory: 'mouses', limit: 5 }
    ],
    // Fase 3: Resto
    [
      { category: 'informatica', subcategory: 'memorias_ram', limit: 5 },
      { category: 'informatica', subcategory: 'discos_duros', limit: 5 },
      { category: 'informatica', subcategory: 'tarjeta_grafica', limit: 5 },
      { category: 'informatica', subcategory: 'gabinetes', limit: 5 },
      { category: 'informatica', subcategory: 'procesador', limit: 5 },
      { category: 'perifericos', subcategory: 'teclados', limit: 5 }
    ]
  ];

  const DESKTOP_CATEGORIES = [
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
      console.log('🚀 Iniciando carga prioritaria', isMobile ? 'MÓVIL' : 'DESKTOP');

      if (isMobile) {
        // CARGA SECUENCIAL para móvil
        for (let phase = 0; phase < MOBILE_PRIORITY_SEQUENCE.length; phase++) {
          setCurrentPhase(phase + 1);
          console.log(`📱 Fase ${phase + 1}/${MOBILE_PRIORITY_SEQUENCE.length}`);
          
          const categories = MOBILE_PRIORITY_SEQUENCE[phase];
          
          // Cargar una por una en móvil
          for (const category of categories) {
            try {
              await optimizedCache.getProducts(
                category.category, 
                category.subcategory, 
                'high', 
                category.limit
              );
              
              // Delay entre cargas para no saturar móvil
              await new Promise(resolve => setTimeout(resolve, 150));
            } catch (error) {
              console.warn('Error loading category:', error);
            }
          }
          
          // Delay entre fases
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } else {
        // CARGA PARALELA para desktop
        await optimizedCache.batchLoadPriority(DESKTOP_CATEGORIES);
      }
      
      setPriorityComplete(true);
      console.log('✅ Carga prioritaria completada');

      // Delay antes de completar
      setTimeout(() => {
        setGlobalLoading(false);
        
        // Iniciar carga completa en background solo en desktop
        if (!isMobile) {
          setTimeout(() => loadAllProducts(), 1000);
        }
      }, isMobile ? 500 : 300);

    } catch (error) {
      console.error('Error en carga prioritaria:', error);
      setGlobalLoading(false);
    }
  }, [isMobile]);

  const loadAllProducts = useCallback(async () => {
    if (isMobile) return; // Saltar carga completa en móvil
    
    try {
      console.log('🔄 Iniciando carga completa en background');
      
      const fullCategories = DESKTOP_CATEGORIES.map(cat => ({
        ...cat,
        limit: null
      }));

      await optimizedCache.batchLoadPriority(fullCategories);
      console.log('✅ Carga completa terminada');

    } catch (error) {
      console.error('Error en carga completa:', error);
    }
  }, [isMobile]);

  useEffect(() => {
    loadPriorityProducts();
  }, [loadPriorityProducts]);

  return {
    globalLoading,
    priorityComplete,
    currentPhase,
    isMobile,
    cacheStats: optimizedCache.getStats()
  };
};