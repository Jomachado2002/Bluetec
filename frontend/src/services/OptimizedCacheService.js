import SummaryApi from '../common'; // ← AGREGAR ESTA LÍNEA

class OptimizedCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.loadingPromises = new Map();
    this.priorityQueue = [];
    this.sessionKey = 'bluetec_product_cache_v1';
    
    // Cargar cache desde sessionStorage al inicializar
    this.loadFromSession();
  }

  // Cargar cache desde sessionStorage
  loadFromSession() {
    try {
      const cached = sessionStorage.getItem(this.sessionKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Verificar que no sea muy viejo (30 minutos)
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          this.memoryCache = new Map(data.cache);
          console.log('🚀 Cache cargado desde sesión:', this.memoryCache.size, 'elementos');
        }
      }
    } catch (error) {
      console.warn('Error cargando cache:', error);
    }
  }

  // Guardar cache en sessionStorage
  saveToSession() {
    try {
      const data = {
        timestamp: Date.now(),
        cache: Array.from(this.memoryCache.entries())
      };
      sessionStorage.setItem(this.sessionKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Error guardando cache:', error);
    }
  }

  // Obtener productos con prioridad
  async getProducts(category, subcategory = null, priority = 'normal', limit = null) {
    const cacheKey = this.getCacheKey(category, subcategory, limit);
    
    // Verificar cache primero
    if (this.memoryCache.has(cacheKey)) {
      console.log('✅ Cache hit:', cacheKey);
      return this.memoryCache.get(cacheKey);
    }

    // Verificar si ya está cargando
    if (this.loadingPromises.has(cacheKey)) {
      console.log('⏳ Esperando carga en progreso:', cacheKey);
      return this.loadingPromises.get(cacheKey);
    }

    // Crear nueva promesa de carga
    const loadPromise = this.fetchAndCache(category, subcategory, limit, priority);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(cacheKey);
      return result;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  // Fetch y cache de productos
  async fetchAndCache(category, subcategory, limit, priority) {
    console.log(`🔄 Fetching ${priority} priority:`, category, subcategory, limit);
    
    try {
      const response = await fetch(SummaryApi.categoryWiseProduct.url, {
        method: SummaryApi.categoryWiseProduct.method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, ...(subcategory && { subcategory }) })
      });
      
      const dataResponse = await response.json();
      let products = dataResponse?.data || [];

      // Aplicar limit si se especifica
      if (limit && products.length > limit) {
        // Para carga prioritaria, tomar los primeros
        products = products.slice(0, limit);
      }

      // Precargar imágenes críticas basado en prioridad
      if (priority === 'high' && products.length > 0) {
        this.preloadCriticalImages(products.slice(0, 3));
      }

      const cacheKey = this.getCacheKey(category, subcategory, limit);
      this.memoryCache.set(cacheKey, dataResponse);
      this.saveToSession();

      return dataResponse;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Precargar imágenes críticas
  preloadCriticalImages(products) {
    products.forEach(product => {
      if (product.productImage?.[0]) {
        const img = new Image();
        img.fetchPriority = 'high';
        img.loading = 'eager';
        img.src = product.productImage[0];
      }
    });
  }

  // Generar clave de cache
  getCacheKey(category, subcategory, limit) {
    return `${category}_${subcategory || 'all'}_${limit || 'full'}`;
  }

  // Batch loading para múltiples categorías
  async batchLoadPriority(categories) {
    console.log('🚀 Iniciando carga batch prioritaria');
    
    const promises = categories.map(({ category, subcategory, limit }) => 
      this.getProducts(category, subcategory, 'high', limit)
    );

    const results = await Promise.allSettled(promises);
    console.log('✅ Batch carga completada:', results.length);
    
    return results;
  }

  // Limpiar cache
  clearCache() {
    this.memoryCache.clear();
    this.loadingPromises.clear();
    sessionStorage.removeItem(this.sessionKey);
  }

  // Obtener estadísticas del cache
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      loadingPromises: this.loadingPromises.size,
      hasSessionCache: !!sessionStorage.getItem(this.sessionKey)
    };
  }
}

export const optimizedCache = new OptimizedCacheService();
