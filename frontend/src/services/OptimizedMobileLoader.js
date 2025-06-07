// frontend/src/services/OptimizedMobileLoader.js
class OptimizedMobileLoader {
  constructor() {
    this.loadQueue = [];
    this.currentlyLoading = false;
    this.loadedCategories = new Set();
    this.cache = new Map();
    this.isLowEndDevice = this.detectLowEndDevice();
    this.maxConcurrentImages = this.isLowEndDevice ? 2 : 4;
    
    console.log('📱 Device type:', this.isLowEndDevice ? 'Low-end' : 'High-end');
  }

  detectLowEndDevice() {
    // Detectar dispositivos de gama baja
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = window.innerWidth < 768;
    
    return memory < 4 || cores < 4 || isMobile;
  }

  // CARGA SECUENCIAL - Una categoría a la vez
  async loadCategoriesSequentially(categories) {
    console.log('🔄 Iniciando carga secuencial móvil-optimizada');
    
    for (const category of categories) {
      try {
        await this.loadSingleCategory(category);
        // Delay entre cargas para no saturar el dispositivo
        await this.smartDelay();
      } catch (error) {
        console.warn(`Error loading ${category.category}:`, error);
      }
    }
    
    console.log('✅ Carga secuencial completada');
  }

  async loadSingleCategory({ category, subcategory, limit }) {
    const cacheKey = `${category}_${subcategory}_${limit}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    console.log(`📦 Cargando: ${category}/${subcategory}`);
    
    try {
      const response = await fetch('/api/products/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subcategory, limit })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Cache ligero - solo metadatos esenciales
        const lightData = {
          ...data,
          data: data.data.map(product => ({
            _id: product._id,
            productName: product.productName,
            sellingPrice: product.sellingPrice,
            price: product.price,
            productImage: [product.productImage[0]], // Solo primera imagen
            subcategory: product.subcategory,
            slug: product.slug
          }))
        };
        
        this.cache.set(cacheKey, lightData);
        this.loadedCategories.add(cacheKey);
        
        // Precargar solo 2 imágenes críticas
        this.preloadCriticalImages(lightData.data.slice(0, 2));
        
        return lightData;
      }
    } catch (error) {
      console.error('Error loading category:', error);
      throw error;
    }
  }

  // PRECARGA INTELIGENTE - Solo imágenes críticas
  preloadCriticalImages(products) {
    let loadedCount = 0;
    
    products.forEach((product, index) => {
      if (loadedCount >= this.maxConcurrentImages) return;
      
      if (product.productImage?.[0]) {
        const img = new Image();
        img.loading = index === 0 ? 'eager' : 'lazy';
        img.fetchPriority = index === 0 ? 'high' : 'low';
        
        img.onload = () => {
          loadedCount++;
        };
        
        img.src = product.productImage[0];
      }
    });
  }

  // DELAY INTELIGENTE basado en rendimiento del dispositivo
  smartDelay() {
    const delay = this.isLowEndDevice ? 150 : 50;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // LIMPIAR CACHE cuando sea necesario
  clearCache() {
    this.cache.clear();
    this.loadedCategories.clear();
  }

  // OBTENER ESTADÍSTICAS
  getStats() {
    return {
      cacheSize: this.cache.size,
      loadedCategories: this.loadedCategories.size,
      isLowEndDevice: this.isLowEndDevice,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  estimateMemoryUsage() {
    let size = 0;
    this.cache.forEach(value => {
      size += JSON.stringify(value).length;
    });
    return `${(size / 1024).toFixed(2)} KB`;
  }
}

export const mobileLoader = new OptimizedMobileLoader();