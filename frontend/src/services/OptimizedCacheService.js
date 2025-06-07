import SummaryApi from '../common';

class OptimizedCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.loadingPromises = new Map();
    this.priorityQueue = [];
    
    // NUEVO: Configuración móvil-optimizada
    this.isMobile = window.innerWidth < 768;
    this.isLowMemory = this.detectLowMemoryDevice();
    this.maxCacheSize = this.isLowMemory ? 8 : 15; // Menos cache para móviles
    this.compressionEnabled = true;
    
    console.log('📱 Cache optimizado - Móvil:', this.isMobile, 'Baja memoria:', this.isLowMemory);
  }

  // NUEVO: Detectar dispositivos de baja memoria
  detectLowMemoryDevice() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = window.innerWidth < 768;
    
    return memory < 4 || cores < 4 || isMobile;
  }

  // OPTIMIZADO: Comprimir datos para móvil
  compressProductData(products) {
    if (!this.compressionEnabled) return products;
    
    return products.map(product => ({
      _id: product._id,
      productName: product.productName,
      sellingPrice: product.sellingPrice,
      price: product.price,
      productImage: [product.productImage[0]], // Solo primera imagen
      subcategory: product.subcategory,
      slug: product.slug,
      stock: product.stock,
      brandName: product.brandName,
      createdAt: product.createdAt
      // Eliminar campos innecesarios para móvil
    }));
  }

  // OPTIMIZADO: Obtener productos con límites móvil
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

    // NUEVO: Límites automáticos para móvil
    const mobileLimit = this.calculateMobileLimit(limit, priority);

    // Crear nueva promesa de carga
    const loadPromise = this.fetchAndCache(category, subcategory, mobileLimit, priority);
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

  // NUEVO: Calcular límites inteligentes para móvil
  calculateMobileLimit(requestedLimit, priority) {
    if (!this.isMobile) return requestedLimit;
    
    // Límites más agresivos para móvil
    if (priority === 'high') return Math.min(requestedLimit || 5, 5);
    if (priority === 'normal') return Math.min(requestedLimit || 8, 8);
    return Math.min(requestedLimit || 6, 6);
  }

  // OPTIMIZADO: Fetch con gestión de memoria
  async fetchAndCache(category, subcategory, limit, priority) {
    console.log(`🔄 Fetching ${priority} priority:`, category, subcategory, limit);
    
    try {
      // Limpiar cache si está lleno
      if (this.memoryCache.size >= this.maxCacheSize) {
        this.cleanOldestEntries(3);
      }

      const response = await fetch(SummaryApi.categoryWiseProduct.url, {
        method: SummaryApi.categoryWiseProduct.method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, ...(subcategory && { subcategory }) })
      });
      
      const dataResponse = await response.json();
      let products = dataResponse?.data || [];

      // OPTIMIZADO: Comprimir datos para móvil
      if (this.isMobile || this.isLowMemory) {
        products = this.compressProductData(products);
      }

      // Aplicar limit si se especifica
      if (limit && products.length > limit) {
        products = products.slice(0, limit);
      }

      // OPTIMIZADO: Precargar solo imágenes críticas
      if (priority === 'high' && products.length > 0) {
        this.preloadCriticalImages(products.slice(0, this.isMobile ? 2 : 3));
      }

      const processedResponse = {
        ...dataResponse,
        data: products
      };

      const cacheKey = this.getCacheKey(category, subcategory, limit);
      this.memoryCache.set(cacheKey, processedResponse);

      console.log(`💾 Cached: ${cacheKey} (${this.memoryCache.size}/${this.maxCacheSize})`);
      return processedResponse;

    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // OPTIMIZADO: Precargar menos imágenes
  preloadCriticalImages(products) {
    const maxImages = this.isMobile ? 2 : 3;
    products.slice(0, maxImages).forEach((product, index) => {
      if (product.productImage?.[0]) {
        const img = new Image();
        img.fetchPriority = index === 0 ? 'high' : 'low';
        img.loading = index === 0 ? 'eager' : 'lazy';
        img.src = product.productImage[0];
      }
    });
  }

  // NUEVO: Limpiar entradas más antiguas
  cleanOldestEntries(count = 1) {
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => {
        // Ordenar por último acceso (simulado con timestamp)
        return (a[1].lastAccess || 0) - (b[1].lastAccess || 0);
      })
      .slice(0, count);
    
    entries.forEach(([key]) => {
      this.memoryCache.delete(key);
      console.log(`🗑️ Cache limpiado: ${key}`);
    });
  }

  // OPTIMIZADO: Generar clave de cache
  getCacheKey(category, subcategory, limit) {
    const limitSuffix = this.isMobile ? `_m${limit || 'full'}` : `_${limit || 'full'}`;
    return `${category}_${subcategory || 'all'}${limitSuffix}`;
  }

  // OPTIMIZADO: Batch loading secuencial para móvil
  async batchLoadPriority(categories) {
    console.log('🚀 Iniciando carga batch optimizada para móvil');
    
    if (this.isMobile) {
      // SECUENCIAL para móvil - una por vez
      const results = [];
      for (const category of categories) {
        try {
          const result = await this.getProducts(
            category.category, 
            category.subcategory, 
            'high', 
            category.limit
          );
          results.push({ status: 'fulfilled', value: result });
          
          // Delay entre cargas para móvil
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.push({ status: 'rejected', reason: error });
        }
      }
      return results;
    } else {
      // PARALELO para desktop
      const promises = categories.map(({ category, subcategory, limit }) => 
        this.getProducts(category, subcategory, 'high', limit)
      );
      return await Promise.allSettled(promises);
    }
  }

  // Limpiar cache
  clearCache() {
    this.memoryCache.clear();
    this.loadingPromises.clear();
    console.log('🧹 Cache completamente limpiado');
  }

  // OPTIMIZADO: Estadísticas con info móvil
  getStats() {
    const memorySize = this.memoryCache.size;
    const estimatedMemory = Array.from(this.memoryCache.values())
      .reduce((acc, val) => acc + JSON.stringify(val).length, 0);

    return {
      memorySize,
      maxSize: this.maxCacheSize,
      loadingPromises: this.loadingPromises.size,
      isMobile: this.isMobile,
      isLowMemory: this.isLowMemory,
      estimatedKB: Math.round(estimatedMemory / 1024),
      compressionEnabled: this.compressionEnabled
    };
  }

  // NUEVO: Optimizar para la sesión actual
  optimizeForSession() {
    if (this.isMobile && this.memoryCache.size > 5) {
      console.log('📱 Optimizando cache para sesión móvil');
      this.cleanOldestEntries(Math.floor(this.memoryCache.size / 2));
    }
  }
}

export const optimizedCache = new OptimizedCacheService();