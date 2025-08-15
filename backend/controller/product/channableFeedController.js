// backend/controller/product/channableFeedController.js - VERSIÓN CORREGIDA PARA CHANNABLE
const ProductModel = require('../../models/productModel');

// ===== CONFIGURACIÓN BASE =====
const BASE_CONFIG = {
    STORE_NAME: 'Bluetec',
    STORE_URL: 'https://www.bluetec.com.py',
    STORE_DESCRIPTION: 'Tienda especializada en tecnología e informática',
    BASE_CURRENCY: 'PYG',
    SHIPPING_COST: 30000,
    COUNTRY: 'PY',
    LANGUAGE: 'es',
    MIN_PRICE: 1000,
    DEFAULT_BRAND: 'Bluetec'
};

// ===== CONFIGURACIONES ESPECÍFICAS POR PLATAFORMA =====
const PLATFORM_CONFIGS = {
    META: {
        ...BASE_CONFIG,
        INCLUDE_OUT_OF_STOCK: true,
        MAX_TITLE_LENGTH: 60,
        PLATFORM_NAME: 'Meta',
        USE_NAMESPACE: true,
        NAMESPACE_PREFIX: 'g:'
    },
    TIKTOK: {
        ...BASE_CONFIG,
        INCLUDE_OUT_OF_STOCK: false,
        MAX_TITLE_LENGTH: 100,
        PLATFORM_NAME: 'TikTok',
        USE_NAMESPACE: false,
        NAMESPACE_PREFIX: ''
    }
};

// ===== FUNCIÓN PARA DETECTAR PLATAFORMA =====
function detectPlatform(req) {
    const platform = req.query.platform || '';
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    
    if (platform.toLowerCase() === 'tiktok' || platform.toLowerCase() === 'tt') {
        return 'TIKTOK';
    }
    
    if (userAgent.includes('TikTok') || userAgent.includes('ByteDance') || referer.includes('tiktok')) {
        return 'TIKTOK';
    }
    
    return 'META'; // Por defecto
}

// ===== MAPEO COMPLETO DE CATEGORÍAS (RESTAURADO) =====
const CATEGORY_MAPPING = {
    'informatica': {
        label: 'Informática',
        googleCategory: 'Electronics > Computers',
        subcategories: {
            'notebooks': { label: 'Notebooks', google: 'Electronics > Computers > Laptops' },
            'computadoras_ensambladas': { label: 'PCs Ensambladas', google: 'Electronics > Computers > Desktop Computers' },
            'placas_madre': { label: 'Placas Madre', google: 'Electronics > Computer Components > Motherboards' },
            'tarjeta_grafica': { label: 'Tarjetas Gráficas', google: 'Electronics > Computer Components > Video Cards' },
            'memorias_ram': { label: 'Memorias RAM', google: 'Electronics > Computer Components > Computer Memory' },
            'discos_duros': { label: 'Discos Duros', google: 'Electronics > Computer Components > Storage Devices' },
            'procesador': { label: 'Procesadores', google: 'Electronics > Computer Components > Computer Processors' },
            'fuentes_alimentacion': { label: 'Fuentes de Poder', google: 'Electronics > Computer Components > Power Supplies' },
            'gabinetes': { label: 'Gabinetes', google: 'Electronics > Computer Components > Computer Cases' },
            'impresoras': { label: 'Impresoras', google: 'Electronics > Print, Copy, Scan & Fax > Printers' },
            'cartuchos_toners': { label: 'Cartuchos y Toners', google: 'Electronics > Print, Copy, Scan & Fax > Printer Ink & Toner' },
            'escaneres': { label: 'Escáneres', google: 'Electronics > Print, Copy, Scan & Fax > Scanners' },
            'servidores': { label: 'Servidores', google: 'Electronics > Computers > Computer Servers' }
        }
    },
    'perifericos': {
        label: 'Periféricos',
        googleCategory: 'Electronics > Computer Accessories',
        subcategories: {
            'monitores': { label: 'Monitores', google: 'Electronics > Computers > Monitors' },
            'teclados': { label: 'Teclados', google: 'Electronics > Computer Accessories > Input Devices > Computer Keyboards' },
            'mouses': { label: 'Mouses', google: 'Electronics > Computer Accessories > Input Devices > Computer Mice' },
            'auriculares': { label: 'Auriculares', google: 'Electronics > Audio > Headphones' },
            'microfonos': { label: 'Micrófonos', google: 'Electronics > Audio > Audio Components > Microphones' },
            'adaptadores': { label: 'Adaptadores', google: 'Electronics > Computer Accessories > Cables & Interconnects' },
            'parlantes': { label: 'Parlantes', google: 'Electronics > Audio > Audio Players & Recorders > Speakers' },
            'webcam': { label: 'Webcams', google: 'Electronics > Cameras & Optics > Cameras > Webcams' }
        }
    },
    'cctv': {
        label: 'CCTV',
        googleCategory: 'Electronics > Electronics Accessories > Security Accessories',
        subcategories: {
            'camaras_seguridad': { label: 'Cámaras de Seguridad', google: 'Electronics > Electronics Accessories > Security Accessories > Surveillance Camera Systems' },
            'dvr': { label: 'DVR', google: 'Electronics > Electronics Accessories > Security Accessories' },
            'nvr': { label: 'NVR', google: 'Electronics > Electronics Accessories > Security Accessories' },
            'nas': { label: 'NAS', google: 'Electronics > Computer Components > Storage Devices > Network Attached Storage' },
            'cables_cctv': { label: 'Cables CCTV', google: 'Electronics > Electronics Accessories > Security Accessories' }
        }
    },
    'redes': {
        label: 'Redes',
        googleCategory: 'Electronics > Networking',
        subcategories: {
            'switch': { label: 'Switches', google: 'Electronics > Networking > Network Switches' },
            'router': { label: 'Routers', google: 'Electronics > Networking > Routers' },
            'ap': { label: 'Access Points', google: 'Electronics > Networking > Wireless Access Points' },
            'cablesred': { label: 'Cables de Red', google: 'Electronics > Computer Accessories > Cables & Interconnects > Network Cables' },
            'racks': { label: 'Racks', google: 'Electronics > Networking > Network Rack & Enclosures' },
            'patch_panel': { label: 'Patch Panels', google: 'Electronics > Networking' },
            'modem': { label: 'Modems', google: 'Electronics > Networking > Modems' }
        }
    },
    'telefonia': {
        label: 'Telefonía',
        googleCategory: 'Electronics > Communications > Telephony',
        subcategories: {
            'telefonos_moviles': { label: 'Teléfonos Móviles', google: 'Electronics > Communications > Telephony > Mobile Phones' },
            'telefonos_fijos': { label: 'Teléfonos Fijos', google: 'Electronics > Communications > Telephony > Corded Phones' },
            'tablets': { label: 'Tablets', google: 'Electronics > Computers > Tablet Computers' },
            'smartwatch': { label: 'Smartwatches', google: 'Electronics > Electronics Accessories > Wearable Technology > Smartwatches' },
            'accesorios_moviles': { label: 'Accesorios Móviles', google: 'Electronics > Electronics Accessories > Communication Accessories' }
        }
    },
    'energia': {
        label: 'Energía',
        googleCategory: 'Electronics > Computer Components',
        subcategories: {
            'ups': { label: 'UPS', google: 'Electronics > Computer Components > Uninterruptible Power Supplies' },
            'estabilizadores': { label: 'Estabilizadores', google: 'Electronics > Computer Components > Uninterruptible Power Supplies' },
            'baterias': { label: 'Baterías', google: 'Electronics > Power > Batteries' },
            'cargadores': { label: 'Cargadores', google: 'Electronics > Electronics Accessories > Power' }
        }
    },
    'electronicos': {
        label: 'Electrónicos',
        googleCategory: 'Electronics',
        subcategories: {
            'camaras_fotografia': { label: 'Cámaras de Fotografía', google: 'Electronics > Cameras & Optics > Cameras > Digital Cameras' },
            'drones': { label: 'Drones', google: 'Electronics > Remote Control & Play Vehicles > Drones' },
            'televisores': { label: 'Televisores', google: 'Electronics > Electronics Accessories > Audio & Video Accessories > Televisions' },
            'parlantes': { label: 'Parlantes', google: 'Electronics > Audio > Audio Players & Recorders > Speakers' },
            'relojes_inteligentes': { label: 'Relojes Inteligentes', google: 'Electronics > Electronics Accessories > Wearable Technology > Smartwatches' },
            'proyectores': { label: 'Proyectores', google: 'Electronics > Electronics Accessories > Audio & Video Accessories > Projectors' },
            'consolas': { label: 'Consolas', google: 'Electronics > Video Game Console Accessories' },
            'scooters': { label: 'Scooters Eléctricos', google: 'Sporting Goods > Outdoor Recreation > Scooters' },
            'monopatines': { label: 'Monopatines Eléctricos', google: 'Sporting Goods > Outdoor Recreation > Skateboards & Longboards' },
            'controles_consola': { label: 'Controles de Consola', google: 'Electronics > Video Game Console Accessories' },
            'juegos_consola': { label: 'Juegos de Consola', google: 'Media > Video Games' }
        }
    },
    'software': {
        label: 'Software',
        googleCategory: 'Software',
        subcategories: {
            'licencias': { label: 'Licencias', google: 'Software > Computer Software' },
            'antivirus': { label: 'Antivirus', google: 'Software > Computer Software > System & Security Software' },
            'oficina': { label: 'Software de Oficina', google: 'Software > Computer Software > Business & Productivity Software' }
        }
    },
    'gaming': {
        label: 'Gaming',
        googleCategory: 'Electronics > Computer Accessories',
        subcategories: {
            'sillas': { label: 'Sillas Gaming', google: 'Furniture > Chairs > Office Chairs' },
            'teclados_gaming': { label: 'Teclados Gaming', google: 'Electronics > Computer Accessories > Input Devices > Computer Keyboards' },
            'mouse_gaming': { label: 'Mouse Gaming', google: 'Electronics > Computer Accessories > Input Devices > Computer Mice' },
            'auriculares_gaming': { label: 'Auriculares Gaming', google: 'Electronics > Audio > Headphones' }
        }
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

// ===== FUNCIÓN PARA EXTRAER ESPECIFICACIONES =====
function extractProductSpecs(product) {
    return {
        memory: product.memory || product.phoneRAM || product.tabletRAM || '',
        processor: product.processor || product.phoneProcessor || product.tabletProcessor || '',
        storage: product.storage || product.phoneStorage || product.tabletStorage || '',
        graphicsCard: product.graphicsCard || product.graphicCardModel || '',
        screenSize: product.notebookScreen || product.phoneScreenSize || product.tabletScreenSize || product.monitorSize || '',
        refreshRate: product.monitorRefreshRate || '',
        resolution: product.monitorResolution || product.tabletScreenResolution || product.cameraResolution || ''
    };
}

// CORREGIR FORMATO DE PRECIOS PARA CHANNABLE
function formatPriceForChannable(priceInGuaranis) {
    // Channable espera formato: "123456.78 PYG" (número + espacio + moneda)
    const cleanPrice = Number(priceInGuaranis) || 0;
    if (cleanPrice <= 0) return '';
    
    // Formato limpio: número.decimales MONEDA
    return `${cleanPrice.toFixed(0)} PYG`;
}

// Mantener funciones originales para compatibilidad con Meta
function formatPrice(priceInGuaranis) {
    return `₲${Number(priceInGuaranis).toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
}

function formatPriceForFacebook(priceInGuaranis) {
    return Math.round(Number(priceInGuaranis)).toString();
}

function formatPriceForDisplay(priceInGuaranis) {
    return `Gs. ${Number(priceInGuaranis).toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
}

function generateCleanId(product, platform) {
    const id = product._id.toString();
    const prefix = platform === 'TIKTOK' ? 'tt_' : 'fb_';
    return `${prefix}${id}`;
}

function generateOptimizedTitle(product, config) {
    let title = product.productName || '';
    
    title = title
        .replace(/[^\w\s\-()./]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (title.length > config.MAX_TITLE_LENGTH) {
        const words = title.split(' ');
        let shortTitle = '';
        let i = 0;
        
        while (i < words.length && (shortTitle + words[i]).length <= config.MAX_TITLE_LENGTH) {
            shortTitle += (shortTitle ? ' ' : '') + words[i];
            i++;
        }
        
        title = shortTitle || title.substring(0, config.MAX_TITLE_LENGTH);
    }
    
    return title;
}

function getCategoryInfo(category, subcategory) {
    const categoryData = CATEGORY_MAPPING[category];
    if (!categoryData) {
        return {
            categoryLabel: 'Electronics',
            subcategoryLabel: 'General',
            googleCategory: 'Electronics',
            productType: 'Electronics > General'
        };
    }
    
    const subcategoryData = categoryData.subcategories[subcategory];
    
    return {
        categoryLabel: categoryData.label,
        subcategoryLabel: subcategoryData ? subcategoryData.label : subcategory,
        googleCategory: subcategoryData ? subcategoryData.google : categoryData.googleCategory,
        productType: `${categoryData.label} > ${subcategoryData ? subcategoryData.label : subcategory}`
    };
}

function getAvailability(product, config) {
    if (config.INCLUDE_OUT_OF_STOCK) {
        return 'in stock';
    }
    
    if (product.stockStatus === 'in_stock' || (product.stock && product.stock > 0)) {
        return 'in stock';
    } else if (product.stockStatus === 'low_stock') {
        return 'limited availability';
    } else {
        return 'out of stock';
    }
}

function generateProductURL(slug) {
    return `${BASE_CONFIG.STORE_URL}/producto/${slug}`;
}

function getDiscountInfo(product) {
    const sellingPrice = Number(product.sellingPrice) || 0;
    const originalPrice = Number(product.price) || sellingPrice;
    
    if (originalPrice > sellingPrice && sellingPrice > 0) {
        const discountAmount = originalPrice - sellingPrice;
        const discountPercentage = Math.round((discountAmount / originalPrice) * 100);
        
        return {
            hasDiscount: true,
            originalPrice: originalPrice,
            sellingPrice: sellingPrice,
            discountAmount: discountAmount,
            discountPercentage: discountPercentage
        };
    }
    
    return {
        hasDiscount: false,
        originalPrice: sellingPrice,
        sellingPrice: sellingPrice,
        discountAmount: 0,
        discountPercentage: 0
    };
}

// ===== GENERADORES DE XML POR PLATAFORMA =====
function generateMetaXML(products, config) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
        <title>${escapeXML(config.STORE_NAME)} - Meta Catalog</title>
        <link>${config.STORE_URL}</link>
        <description>${escapeXML(config.STORE_DESCRIPTION)}</description>
        <language>${config.LANGUAGE}</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;

    products.forEach(product => {
        const discountInfo = getDiscountInfo(product);
        const id = generateCleanId(product, 'META');
        const title = escapeXML(generateOptimizedTitle(product, config));
        const description = escapeXML((product.description || product.productName || '').substring(0, 500));
        const brand = escapeXML(product.brandName || config.DEFAULT_BRAND);
        const categoryInfo = getCategoryInfo(product.category, product.subcategory);
        const availability = getAvailability(product, config);
        const productUrl = generateProductURL(product.slug);
        const mainImage = product.productImage[0] || '';
        
        // PRECIOS CORREGIDOS PARA CHANNABLE
        const price = formatPriceForChannable(discountInfo.originalPrice);
        const salePrice = discountInfo.hasDiscount ? formatPriceForChannable(discountInfo.sellingPrice) : '';

        xml += `        <item>
            <g:id>${escapeXML(id)}</g:id>
            <title>${title}</title>
            <description>${description}</description>
            <g:google_product_category>${escapeXML(categoryInfo.googleCategory)}</g:google_product_category>
            <g:product_type>${escapeXML(categoryInfo.productType)}</g:product_type>
            <link>${productUrl}</link>
            <g:image_link>${escapeXML(mainImage)}</g:image_link>
            <g:condition>new</g:condition>
            <g:availability>${availability}</g:availability>
            <g:price>${escapeXML(price)}</g:price>`;

        // Sale price solo si hay descuento Y no está vacío
        if (discountInfo.hasDiscount && salePrice) {
            xml += `
            <g:sale_price>${escapeXML(salePrice)}</g:sale_price>
            <g:sale_price_effective_date>${new Date().toISOString().split('T')[0]}/${new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]}</g:sale_price_effective_date>`;
        }

        xml += `
            <g:brand>${brand}</g:brand>
            <g:mpn>${escapeXML(id)}</g:mpn>
            <g:identifier_exists>false</g:identifier_exists>
            <g:age_group>adult</g:age_group>
            <g:gender>unisex</g:gender>
            <g:gtin></g:gtin>
            <g:item_group_id>${escapeXML(id)}</g:item_group_id>
            <g:color></g:color>
            <g:size></g:size>
            <g:material></g:material>
            <g:pattern></g:pattern>
            <g:shipping>
                <g:country>${config.COUNTRY}</g:country>
                <g:service>Standard</g:service>
                <g:price>${formatPriceForChannable(config.SHIPPING_COST)}</g:price>
            </g:shipping>
            <g:shipping_weight>1 kg</g:shipping_weight>
            <g:custom_label_0>${escapeXML(categoryInfo.categoryLabel)}</g:custom_label_0>
            <g:custom_label_1>${escapeXML(categoryInfo.subcategoryLabel)}</g:custom_label_1>
            <g:custom_label_2>${product.isVipOffer ? 'VIP' : 'REGULAR'}</g:custom_label_2>
            <g:custom_label_3>${discountInfo.hasDiscount ? `OFERTA ${discountInfo.discountPercentage}%` : 'PRECIO_REGULAR'}</g:custom_label_3>
            <g:custom_label_4>${escapeXML((product.brandName || config.DEFAULT_BRAND).toUpperCase())}</g:custom_label_4>`;

        // Campos adicionales para Mobile Apps (todos opcionales)
        xml += `
            <g:ios_url></g:ios_url>
            <g:ios_app_store_id></g:ios_app_store_id>
            <g:ios_app_name></g:ios_app_name>
            <g:android_url></g:android_url>
            <g:android_package></g:android_package>
            <g:android_app_name></g:android_app_name>`;

        xml += `
        </item>\n`;
    });

    xml += `    </channel>
</rss>`;

    return xml;
}

function generateTikTokXML(products, config) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>${escapeXML(config.STORE_NAME)} - TikTok Catalog</title>
    <link href="${config.STORE_URL}"/>
    <updated>${new Date().toISOString()}</updated>
    <id>${config.STORE_URL}</id>\n`;

    products.forEach(product => {
        const discountInfo = getDiscountInfo(product);
        const id = generateCleanId(product, 'TIKTOK');
        const title = escapeXML(generateOptimizedTitle(product, config));
        const description = escapeXML((product.description || product.productName || '').substring(0, 500));
        const brand = escapeXML(product.brandName || config.DEFAULT_BRAND);
        const categoryInfo = getCategoryInfo(product.category, product.subcategory);
        const availability = getAvailability(product, config);
        const productUrl = generateProductURL(product.slug);
        const mainImage = product.productImage[0] || '';
        
        // PRECIOS CORREGIDOS PARA TIKTOK
        const price = formatPriceForChannable(discountInfo.sellingPrice);

        xml += `    <entry>
        <sku_id>${escapeXML(id)}</sku_id>
        <title>${title}</title>
        <description>${description}</description>
        <google_product_category>${escapeXML(categoryInfo.googleCategory)}</google_product_category>
        <product_type>${escapeXML(categoryInfo.productType)}</product_type>
        <link>${productUrl}</link>
        <image_link>${escapeXML(mainImage)}</image_link>
        <condition>new</condition>
        <availability>${availability}</availability>
        <price>${escapeXML(price)}</price>
        <brand>${brand}</brand>
        <gtin></gtin>
    </entry>\n`;
    });

    xml += `</feed>`;
    return xml;
}

// ===== CONTROLADOR PRINCIPAL =====
const channableFeedController = async (req, res) => {
    try {
        const platform = detectPlatform(req);
        const config = PLATFORM_CONFIGS[platform];
        
        console.log(`🔄 Generando feed XML para ${config.PLATFORM_NAME}...`);
        
        // Query optimizada
        const query = {
            productImage: { $exists: true, $ne: [], $not: { $size: 0 } },
            productName: { $exists: true, $ne: '' },
            sellingPrice: { $gte: config.MIN_PRICE },
            slug: { $exists: true, $ne: '' }
        };

        // Filtrar productos sin stock para TikTok
        if (!config.INCLUDE_OUT_OF_STOCK) {
            query.$or = [
                { stockStatus: 'in_stock' },
                { stock: { $gt: 0 } }
            ];
        }
        
        const products = await ProductModel
            .find(query)
            .sort({ updatedAt: -1 })
            .lean();
        
        console.log(`✅ ${products.length} productos obtenidos para ${config.PLATFORM_NAME}`);
        
        // Filtrar productos con precios válidos
        const validProducts = products.filter(product => {
            const sellingPrice = Number(product.sellingPrice);
            return sellingPrice && sellingPrice >= config.MIN_PRICE;
        });
        
        console.log(`✅ ${validProducts.length} productos válidos después de filtrar precios`);
        
        // Generar XML según plataforma
        let xml;
        if (platform === 'TIKTOK') {
            xml = generateTikTokXML(validProducts, config);
        } else {
            xml = generateMetaXML(validProducts, config);
        }
        
        console.log(`✅ Feed XML para ${config.PLATFORM_NAME} generado exitosamente`);
        
        // Headers optimizados
        res.set({
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800',
            'Last-Modified': new Date().toUTCString(),
            'Content-Length': Buffer.byteLength(xml, 'utf8'),
            'X-Robots-Tag': 'noindex, nofollow',
            'X-Platform': config.PLATFORM_NAME
        });
        
        res.send(xml);
        
    } catch (error) {
        console.error('❌ Error crítico generando feed:', error);
        res.status(500).json({
            message: 'Error generando feed XML',
            error: true,
            success: false,
            details: error.message
        });
    }
};

module.exports = channableFeedController;