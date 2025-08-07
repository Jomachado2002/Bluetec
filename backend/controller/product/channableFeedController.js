// backend/controller/product/channableFeedController.js
const ProductModel = require('../../models/productModel');

// ===== CONFIGURACIÓN =====
const XML_CONFIG = {
    STORE_NAME: 'Bluetec',
    STORE_URL: 'https://www.bluetec.com.py',
    STORE_DESCRIPTION: 'Tienda especializada en tecnología e informática',
    BASE_CURRENCY_PYG: 'PYG',
    BASE_CURRENCY_USD: 'USD',
    SHIPPING_COST: 30000,
    COUNTRY: 'PY',
    LANGUAGE: 'es',
    INCLUDE_OUT_OF_STOCK: false,
    MIN_PRICE: 1000,
    MAX_ID_LENGTH: 50, // Límite para g:id
    MAX_TITLE_LENGTH: 150, // Límite para g:title
    MAX_MPN_LENGTH: 70 // Límite para g:mpn
};

// ===== MAPEO COMPLETO DE CATEGORÍAS BASADO EN TU BASE DE DATOS =====
const CATEGORY_LABELS = {
    'informatica': 'INFORMÁTICA',
    'perifericos': 'PERIFÉRICOS',
    'cctv': 'CCTV',
    'redes': 'REDES',
    'telefonia': 'TELEFONÍA',
    'energia': 'ENERGÍA',
    'electronicos': 'ELECTRÓNICOS',
    'software': 'SOFTWARE',
    'gaming': 'GAMING'
};

const SUBCATEGORY_LABELS = {
    // Informática
    'notebooks': 'NOTEBOOKS',
    'computadoras_ensambladas': 'COMPUTADORAS ENSAMBLADAS',
    'placas_madre': 'PLACAS MADRE',
    'tarjeta_grafica': 'TARJETAS GRÁFICAS',
    'memorias_ram': 'MEMORIAS RAM',
    'discos_duros': 'DISCOS DUROS',
    'procesador': 'PROCESADORES',
    'fuentes_alimentacion': 'FUENTES DE ALIMENTACIÓN',
    'gabinetes': 'GABINETES',
    'impresoras': 'IMPRESORAS',
    'cartuchos_toners': 'CARTUCHOS Y TONERS',
    'escaneres': 'ESCÁNERES',
    'servidores': 'SERVIDORES',
    
    // Periféricos
    'monitores': 'MONITORES',
    'teclados': 'TECLADOS',
    'mouses': 'MOUSES',
    'auriculares': 'AURICULARES',
    'microfonos': 'MICRÓFONOS',
    'adaptadores': 'ADAPTADORES',
    'parlantes': 'PARLANTES',
    'webcam': 'WEBCAMS',
    
    // CCTV
    'camaras_seguridad': 'CÁMARAS DE SEGURIDAD',
    'dvr': 'DVR',
    'nvr': 'NVR',
    'nas': 'NAS',
    'cables_cctv': 'CABLES CCTV',
    
    // Redes
    'switch': 'SWITCHES',
    'router': 'ROUTERS',
    'ap': 'ACCESS POINTS',
    'cablesred': 'CABLES DE RED',
    'racks': 'RACKS',
    'patch_panel': 'PATCH PANELS',
    'modem': 'MODEMS',
    
    // Telefonía
    'telefonos_moviles': 'TELÉFONOS MÓVILES',
    'telefonos_fijos': 'TELÉFONOS FIJOS',
    'tablets': 'TABLETS',
    'smartwatch': 'SMARTWATCHES',
    'accesorios_moviles': 'ACCESORIOS MÓVILES',
    
    // Energía
    'ups': 'UPS',
    'estabilizadores': 'ESTABILIZADORES',
    'baterias': 'BATERÍAS',
    'cargadores': 'CARGADORES',
    
    // Electrónicos
    'camaras_fotografia': 'CÁMARAS DE FOTOGRAFÍA',
    'drones': 'DRONES',
    'televisores': 'TELEVISORES',
    'parlantes': 'PARLANTES',
    'relojes_inteligentes': 'RELOJES INTELIGENTES',
    'proyectores': 'PROYECTORES',
    'consolas': 'CONSOLAS',
    'scooters': 'SCOOTERS ELÉCTRICOS',
    'monopatines': 'MONOPATINES ELÉCTRICOS',
    'controles_consola': 'CONTROLES DE CONSOLA',
    'juegos_consola': 'JUEGOS DE CONSOLA',
    
    // Software
    'licencias': 'LICENCIAS',
    'antivirus': 'ANTIVIRUS',
    'oficina': 'SOFTWARE DE OFICINA',
    
    // Gaming
    'sillas': 'SILLAS GAMING',
    'teclados_gaming': 'TECLADOS GAMING',
    'mouse_gaming': 'MOUSE GAMING',
    'auriculares_gaming': 'AURICULARES GAMING'
};

const GOOGLE_CATEGORY_MAPPING = {
    'informatica': {
        'notebooks': 'Electronics > Computers > Laptops',
        'computadoras_ensambladas': 'Electronics > Computers > Desktop Computers',
        'placas_madre': 'Electronics > Computer Components > Motherboards',
        'tarjeta_grafica': 'Electronics > Computer Components > Video Cards',
        'memorias_ram': 'Electronics > Computer Components > Computer Memory',
        'discos_duros': 'Electronics > Computer Components > Storage Devices',
        'procesador': 'Electronics > Computer Components > Computer Processors',
        'fuentes_alimentacion': 'Electronics > Computer Components > Power Supplies',
        'gabinetes': 'Electronics > Computer Components > Computer Cases',
        'impresoras': 'Electronics > Print, Copy, Scan & Fax > Printers',
        'cartuchos_toners': 'Electronics > Print, Copy, Scan & Fax > Printer Ink & Toner',
        'escaneres': 'Electronics > Print, Copy, Scan & Fax > Scanners',
        'servidores': 'Electronics > Computers > Computer Servers',
        'default': 'Electronics > Computers'
    },
    'perifericos': {
        'monitores': 'Electronics > Computers > Monitors',
        'teclados': 'Electronics > Computer Accessories > Input Devices > Computer Keyboards',
        'mouses': 'Electronics > Computer Accessories > Input Devices > Computer Mice',
        'auriculares': 'Electronics > Audio > Headphones',
        'microfonos': 'Electronics > Audio > Audio Components > Microphones',
        'adaptadores': 'Electronics > Computer Accessories > Cables & Interconnects',
        'parlantes': 'Electronics > Audio > Audio Players & Recorders > Speakers',
        'webcam': 'Electronics > Cameras & Optics > Cameras > Webcams',
        'default': 'Electronics > Computer Accessories'
    },
    'cctv': {
        'camaras_seguridad': 'Electronics > Electronics Accessories > Security Accessories > Surveillance Camera Systems',
        'dvr': 'Electronics > Electronics Accessories > Security Accessories',
        'nvr': 'Electronics > Electronics Accessories > Security Accessories',
        'nas': 'Electronics > Computer Components > Storage Devices > Network Attached Storage',
        'cables_cctv': 'Electronics > Electronics Accessories > Security Accessories',
        'default': 'Electronics > Electronics Accessories > Security Accessories'
    },
    'redes': {
        'switch': 'Electronics > Networking > Network Switches',
        'router': 'Electronics > Networking > Routers',
        'ap': 'Electronics > Networking > Wireless Access Points',
        'cablesred': 'Electronics > Computer Accessories > Cables & Interconnects > Network Cables',
        'racks': 'Electronics > Networking > Network Rack & Enclosures',
        'patch_panel': 'Electronics > Networking',
        'modem': 'Electronics > Networking > Modems',
        'default': 'Electronics > Networking'
    },
    'telefonia': {
        'telefonos_moviles': 'Electronics > Communications > Telephony > Mobile Phones',
        'telefonos_fijos': 'Electronics > Communications > Telephony > Corded Phones',
        'tablets': 'Electronics > Computers > Tablet Computers',
        'smartwatch': 'Electronics > Electronics Accessories > Wearable Technology > Smartwatches',
        'accesorios_moviles': 'Electronics > Electronics Accessories > Communication Accessories',
        'default': 'Electronics > Communications > Telephony'
    },
    'energia': {
        'ups': 'Electronics > Computer Components > Uninterruptible Power Supplies',
        'estabilizadores': 'Electronics > Computer Components > Uninterruptible Power Supplies',
        'baterias': 'Electronics > Power > Batteries',
        'cargadores': 'Electronics > Electronics Accessories > Power',
        'default': 'Electronics > Computer Components'
    },
    'electronicos': {
        'camaras_fotografia': 'Electronics > Cameras & Optics > Cameras > Digital Cameras',
        'drones': 'Electronics > Remote Control & Play Vehicles > Drones',
        'televisores': 'Electronics > Electronics Accessories > Audio & Video Accessories > Televisions',
        'parlantes': 'Electronics > Audio > Audio Players & Recorders > Speakers',
        'relojes_inteligentes': 'Electronics > Electronics Accessories > Wearable Technology > Smartwatches',
        'proyectores': 'Electronics > Electronics Accessories > Audio & Video Accessories > Projectors',
        'consolas': 'Electronics > Video Game Console Accessories',
        'scooters': 'Sporting Goods > Outdoor Recreation > Scooters',
        'monopatines': 'Sporting Goods > Outdoor Recreation > Skateboards & Longboards',
        'controles_consola': 'Electronics > Video Game Console Accessories',
        'juegos_consola': 'Media > Video Games',
        'default': 'Electronics'
    },
    'software': {
        'licencias': 'Software > Computer Software',
        'antivirus': 'Software > Computer Software > System & Security Software',
        'oficina': 'Software > Computer Software > Business & Productivity Software',
        'default': 'Software'
    },
    'gaming': {
        'sillas': 'Furniture > Chairs > Office Chairs',
        'teclados_gaming': 'Electronics > Computer Accessories > Input Devices > Computer Keyboards',
        'mouse_gaming': 'Electronics > Computer Accessories > Input Devices > Computer Mice',
        'auriculares_gaming': 'Electronics > Audio > Headphones',
        'default': 'Electronics > Computer Accessories'
    }
};

// ===== FUNCIONES AUXILIARES =====
function escapeXML(text) {
    if (typeof text !== 'string') text = String(text || '');
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .trim();
}

// Función para formatear números con separadores de miles
function formatNumber(number) {
    return Number(number).toLocaleString('es-PY');
}

// Función para formatear precios con moneda
function formatPrice(priceInGuaranis, currency = 'PYG') {
    if (currency === 'USD') {
        const priceInUSD = Math.round(priceInGuaranis / 8200); // Tipo de cambio aproximado
        return `${formatNumber(priceInUSD)} USD`;
    }
    return `${formatNumber(priceInGuaranis)} Gs`;
}

// Función para generar ID corto y único
function generateShortId(product) {
    const brand = (product.brandName || '').substring(0, 4).toLowerCase().replace(/\s/g, '');
    const category = (product.subcategory || '').substring(0, 4).toLowerCase().replace(/\s/g, '');
    const id = product._id.toString().substring(0, 8);
    return `${brand}-${category}-${id}`.substring(0, XML_CONFIG.MAX_ID_LENGTH);
}

// Función para generar MPN corto
function generateShortMPN(product) {
    const brand = (product.brandName || '').substring(0, 6).toUpperCase().replace(/\s/g, '');
    const model = (product.productName || '').split(' ').slice(0, 2).join('').substring(0, 12).toUpperCase().replace(/\s/g, '');
    return `${brand}-${model}`.substring(0, XML_CONFIG.MAX_MPN_LENGTH);
}

// Función para acortar título manteniendo información importante
function generateShortTitle(product) {
    let title = product.productName || '';
    
    // Limpiar y mantener información importante
    const cleanTitle = title
        .replace(/\s+/g, ' ')
        .trim();
    
    if (cleanTitle.length <= XML_CONFIG.MAX_TITLE_LENGTH) {
        return cleanTitle.toUpperCase();
    }
    
    // Si es muy largo, crear versión abreviada con información clave
    const words = cleanTitle.split(' ');
    const important = [];
    
    // Siempre incluir marca si existe
    if (product.brandName) {
        important.push(product.brandName.toUpperCase());
    }
    
    // Agregar palabras clave técnicas
    words.forEach(word => {
        if (word.match(/i[35579]|ryzen|gtx|rtx|\d+gb|\d+tb|ssd|hdd|\d+"|core|intel|amd/i) && important.length < 8) {
            important.push(word.toUpperCase());
        }
    });
    
    // Si tenemos especificaciones, agregarlas
    if (product.processor && important.length < 6) important.push(product.processor.toUpperCase());
    if (product.memory && important.length < 7) important.push(product.memory.toUpperCase());
    if (product.storage && important.length < 8) important.push(product.storage.toUpperCase());
    
    const shortTitle = important.join(' ').substring(0, XML_CONFIG.MAX_TITLE_LENGTH);
    return shortTitle || cleanTitle.substring(0, XML_CONFIG.MAX_TITLE_LENGTH).toUpperCase();
}

function getCategoryLabel(category) {
    return CATEGORY_LABELS[category] || category.toUpperCase();
}

function getSubcategoryLabel(subcategory) {
    return SUBCATEGORY_LABELS[subcategory] || subcategory.replace(/_/g, ' ').toUpperCase();
}

function getGoogleCategory(category, subcategory) {
    const categoryMap = GOOGLE_CATEGORY_MAPPING[category];
    if (!categoryMap) return 'Electronics';
    return categoryMap[subcategory] || categoryMap.default || 'Electronics';
}

function generateProductURL(slug) {
    return `${XML_CONFIG.STORE_URL}/producto/${slug}`;
}

function getAvailability(stockStatus, stock) {
    if (stockStatus === 'in_stock' && stock > 0) return 'in stock';
    if (stockStatus === 'out_of_stock' || stock === 0) return 'out of stock';
    if (stockStatus === 'low_stock') return 'limited availability';
    return 'out of stock';
}

// Función para calcular descuento
function getDiscountInfo(product) {
    const sellingPrice = product.sellingPrice;
    const originalPrice = product.price;
    const hasDiscount = originalPrice && originalPrice > sellingPrice;
    
    if (hasDiscount) {
        const discountPercentage = Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
        return {
            hasDiscount: true,
            discountPercentage: discountPercentage,
            originalPrice: originalPrice,
            sellingPrice: sellingPrice
        };
    }
    
    return {
        hasDiscount: false,
        discountPercentage: 0,
        originalPrice: sellingPrice,
        sellingPrice: sellingPrice
    };
}

function buildCustomLabels(product) {
    const discountInfo = getDiscountInfo(product);
    
    return {
        custom_label_0: getCategoryLabel(product.category),
        custom_label_1: getSubcategoryLabel(product.subcategory),
        custom_label_2: product.isVipOffer ? 'VIP' : 'REGULAR',
        custom_label_3: `MARGEN ${product.profitMargin || 0}%`,
        custom_label_4: (product.brandName || '').toUpperCase(),
        // Etiqueta de descuento solo si hay descuento
        ...(discountInfo.hasDiscount && { custom_label_5: discountInfo.discountPercentage.toString() })
    };
}

function buildProductAttributes(product) {
    const attributes = [];
    
    // Informática - Notebooks
    if (product.category === 'informatica' && product.subcategory === 'notebooks') {
        if (product.processor) attributes.push(`PROCESADOR: ${product.processor.toUpperCase()}`);
        if (product.memory) attributes.push(`MEMORIA: ${product.memory.toUpperCase()}`);
        if (product.storage) attributes.push(`ALMACENAMIENTO: ${product.storage.toUpperCase()}`);
        if (product.graphicsCard) attributes.push(`GRÁFICOS: ${product.graphicsCard.toUpperCase()}`);
        if (product.notebookScreen) attributes.push(`PANTALLA: ${product.notebookScreen.toUpperCase()}`);
    }
    
    // Periféricos - Monitores
    if (product.category === 'perifericos' && product.subcategory === 'monitores') {
        if (product.monitorSize) attributes.push(`TAMAÑO: ${product.monitorSize.toUpperCase()}`);
        if (product.monitorResolution) attributes.push(`RESOLUCIÓN: ${product.monitorResolution.toUpperCase()}`);
        if (product.monitorRefreshRate) attributes.push(`REFRESH RATE: ${product.monitorRefreshRate.toUpperCase()}`);
    }
    
    // Periféricos - Teclados
    if (product.category === 'perifericos' && product.subcategory === 'teclados') {
        if (product.keyboardSwitches) attributes.push(`SWITCHES: ${product.keyboardSwitches.toUpperCase()}`);
        if (product.keyboardLayout) attributes.push(`LAYOUT: ${product.keyboardLayout.toUpperCase()}`);
        if (product.keyboardBacklight) attributes.push(`BACKLIGHT: ${product.keyboardBacklight.toUpperCase()}`);
    }
    
    // Periféricos - Mouses
    if (product.category === 'perifericos' && product.subcategory === 'mouses') {
        if (product.mouseDPI) attributes.push(`DPI: ${product.mouseDPI.toUpperCase()}`);
        if (product.mouseSensor) attributes.push(`SENSOR: ${product.mouseSensor.toUpperCase()}`);
        if (product.mouseButtons) attributes.push(`BOTONES: ${product.mouseButtons.toUpperCase()}`);
    }
    
    // Telefonía - Teléfonos Móviles
    if (product.category === 'telefonia' && product.subcategory === 'telefonos_moviles') {
        if (product.phoneRAM) attributes.push(`RAM: ${product.phoneRAM.toUpperCase()}`);
        if (product.phoneStorage) attributes.push(`ALMACENAMIENTO: ${product.phoneStorage.toUpperCase()}`);
        if (product.phoneScreenSize) attributes.push(`PANTALLA: ${product.phoneScreenSize.toUpperCase()}`);
        if (product.phoneProcessor) attributes.push(`PROCESADOR: ${product.phoneProcessor.toUpperCase()}`);
    }
    
    // Tablets
    if (product.category === 'telefonia' && product.subcategory === 'tablets') {
        if (product.tabletRAM) attributes.push(`RAM: ${product.tabletRAM.toUpperCase()}`);
        if (product.tabletStorage) attributes.push(`ALMACENAMIENTO: ${product.tabletStorage.toUpperCase()}`);
        if (product.tabletScreenSize) attributes.push(`PANTALLA: ${product.tabletScreenSize.toUpperCase()}`);
    }
    
    // Electrónicos - Televisores
    if (product.category === 'electronicos' && product.subcategory === 'televisores') {
        if (product.tvScreenSize) attributes.push(`TAMAÑO: ${product.tvScreenSize.toUpperCase()}`);
        if (product.tvResolution) attributes.push(`RESOLUCIÓN: ${product.tvResolution.toUpperCase()}`);
        if (product.tvSmartFeatures) attributes.push(`SMART TV: ${product.tvSmartFeatures.toUpperCase()}`);
    }
    
    return attributes.join(' | ');
}

// ===== CONTROLADOR PRINCIPAL =====
const channableFeedController = async (req, res) => {
    try {
        console.log('🔄 Generando feed XML mejorado para Channable...');
        
        // Query optimizada para obtener productos activos
        const query = {
            productImage: { $exists: true, $ne: [], $not: { $size: 0 } },
            productName: { $exists: true, $ne: '' },
            sellingPrice: { $gte: XML_CONFIG.MIN_PRICE },
            slug: { $exists: true, $ne: '' }
        };
        
        // Si no incluir productos sin stock
        if (!XML_CONFIG.INCLUDE_OUT_OF_STOCK) {
            query.$and = [
                { $or: [
                    { stock: { $gt: 0 } },
                    { stockStatus: 'in_stock' }
                ]},
                { stockStatus: { $ne: 'out_of_stock' } }
            ];
        }
        
        const products = await ProductModel
            .find(query)
            .sort({ updatedAt: -1 })
            .lean();
        
        console.log(`✅ ${products.length} productos obtenidos para el feed`);
        
        // Generar XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
        <title>${escapeXML(XML_CONFIG.STORE_NAME)} - Feed de Productos</title>
        <link>${XML_CONFIG.STORE_URL}</link>
        <description>${escapeXML(XML_CONFIG.STORE_DESCRIPTION)}</description>
        <language>${XML_CONFIG.LANGUAGE}</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>Bluetec XML Generator v2.0</generator>\n`;

        let includedCount = 0;

        products.forEach(product => {
            // Verificar datos mínimos
            if (!product.productName || !product.productImage || product.productImage.length === 0) {
                return;
            }
            
            includedCount++;
            
            // Obtener información de descuento
            const discountInfo = getDiscountInfo(product);
            
            // Datos básicos
            const id = generateShortId(product);
            const title = escapeXML(generateShortTitle(product));
            const description = escapeXML(product.description?.toUpperCase() || product.productName.toUpperCase());
            const brand = escapeXML((product.brandName || '').toUpperCase());
            const availability = getAvailability(product.stockStatus, product.stock);
            const productUrl = generateProductURL(product.slug);
            const googleCategory = getGoogleCategory(product.category, product.subcategory);
            const productType = `${getCategoryLabel(product.category)} > ${getSubcategoryLabel(product.subcategory)}`;
            const mpn = generateShortMPN(product);
            
            // Imágenes
            const mainImage = product.productImage[0] || '';
            const additionalImages = product.productImage.slice(1) || [];
            
            // Precios formateados
            const priceFormatted = formatPrice(discountInfo.originalPrice);
            const salePriceFormatted = discountInfo.hasDiscount ? formatPrice(discountInfo.sellingPrice) : null;
            
            // Envío
            const shippingCost = formatNumber(Math.round((product.deliveryCost || XML_CONFIG.SHIPPING_COST)));
            
            // Labels personalizados
            const customLabels = buildCustomLabels(product);
            
            // Atributos del producto
            const productAttributes = buildProductAttributes(product);
            
            xml += `        <item>
            <g:id>${escapeXML(id)}</g:id>
            <title>${title}</title>
            <description>${description}</description>
            <g:google_product_category>${googleCategory}</g:google_product_category>
            <g:product_type>${productType}</g:product_type>
            <link>${productUrl}</link>
            <g:image_link>${escapeXML(mainImage)}</g:image_link>`;

            // Imágenes adicionales (máximo 10)
            additionalImages.slice(0, 10).forEach(img => {
                xml += `
            <g:additional_image_link>${escapeXML(img)}</g:additional_image_link>`;
            });

            xml += `
            <g:condition>new</g:condition>
            <g:availability>${availability}</g:availability>
            <g:price>${escapeXML(priceFormatted)}</g:price>`;

            // Precio de oferta si hay descuento
            if (discountInfo.hasDiscount && salePriceFormatted) {
                xml += `
            <g:sale_price>${escapeXML(salePriceFormatted)}</g:sale_price>
            <g:sale_price_effective_date>${new Date().toISOString().split('T')[0]}/${new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]}</g:sale_price_effective_date>`;
            }

            xml += `
            <g:brand>${brand}</g:brand>
            <g:mpn>${escapeXML(mpn)}</g:mpn>
            <g:identifier_exists>true</g:identifier_exists>
            <g:age_group>adult</g:age_group>
            <g:gender>unisex</g:gender>`;

            // Información de envío
            xml += `
            <g:shipping>
                <g:country>${XML_CONFIG.COUNTRY}</g:country>
                <g:service>Standard</g:service>
                <g:price>${shippingCost} ${XML_CONFIG.BASE_CURRENCY_PYG}</g:price>
            </g:shipping>`;

            // Atributos específicos del producto
            if (productAttributes) {
                xml += `
            <g:product_detail>
                <g:section_name>ESPECIFICACIONES</g:section_name>
                <g:attribute_name>CARACTERÍSTICAS</g:attribute_name>
                <g:attribute_value>${escapeXML(productAttributes)}</g:attribute_value>
            </g:product_detail>`;
            }

            // Labels personalizados
            Object.entries(customLabels).forEach(([key, value]) => {
                if (value) {
                    xml += `
            <g:${key}>${escapeXML(value)}</g:${key}>`;
                }
            });

            // Campos adicionales útiles para marketing
            if (product.stock > 0) {
                xml += `
            <g:quantity>${product.stock}</g:quantity>`;
            }

            // Precio en USD como campo personalizado
            const priceUSD = Math.round(discountInfo.sellingPrice / (product.exchangeRate || 8200));
            xml += `
            <precio_usd>${priceUSD}</precio_usd>
            <precio_pys_formateado>${formatPrice(discountInfo.sellingPrice)}</precio_pys_formateado>
            <categoria_es>${getCategoryLabel(product.category)}</categoria_es>
            <subcategoria_es>${getSubcategoryLabel(product.subcategory)}</subcategoria_es>
            <marca_mayuscula>${brand}</marca_mayuscula>`;

            // Campo de descuento solo si hay descuento
            if (discountInfo.hasDiscount) {
                xml += `
            <descuento>${discountInfo.discountPercentage}</descuento>
            <precio_original_formateado>${formatPrice(discountInfo.originalPrice)}</precio_original_formateado>`;
            }

            xml += `
        </item>\n`;
        });

        xml += `    </channel>
</rss>`;

        console.log(`✅ XML generado con ${includedCount} productos`);
        console.log(`📊 Feed optimizado para Channable con todos los campos necesarios`);
        
        // Configurar headers para XML
        res.set({
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Last-Modified': new Date().toUTCString(),
            'Content-Length': Buffer.byteLength(xml, 'utf8')
        });
        
        res.send(xml);
        
    } catch (error) {
        console.error('❌ Error generando feed Channable:', error);
        res.status(500).json({
            message: 'Error generando feed XML para Channable',
            error: true,
            success: false,
            details: error.message
        });
    }
};

module.exports = channableFeedController;