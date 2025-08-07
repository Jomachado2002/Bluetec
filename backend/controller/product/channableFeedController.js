// backend/controller/product/channableFeedController.js - VERSIÓN OPTIMIZADA PARA META
const ProductModel = require('../../models/productModel');

// ===== CONFIGURACIÓN OPTIMIZADA PARA META =====
const XML_CONFIG = {
    STORE_NAME: 'Bluetec',
    STORE_URL: 'https://www.bluetec.com.py',
    STORE_DESCRIPTION: 'Tienda especializada en tecnología e informática',
    BASE_CURRENCY: 'PYG',
    SHIPPING_COST: 30000,
    COUNTRY: 'PY',
    LANGUAGE: 'es',
    INCLUDE_OUT_OF_STOCK: true, // Cambiado a true para incluir más productos
    MIN_PRICE: 1000,
    MAX_TITLE_LENGTH: 60, // Reducido para Meta
    DEFAULT_BRAND: 'Bluetec'
};

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

// ===== MAPEO COMPLETO DE CATEGORÍAS =====
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

function formatNumber(number) {
    return Number(number).toLocaleString('es-PY', { maximumFractionDigits: 0 });
}

function formatPrice(priceInGuaranis) {
    return `₲${formatNumber(priceInGuaranis)}`;
}

function formatPriceForFacebook(priceInGuaranis) {
    // Precio para Facebook: solo números sin formato
    return Math.round(Number(priceInGuaranis)).toString();
}

function formatPriceForDisplay(priceInGuaranis) {
    // Precio para templates de imagen: Gs. 4.000.000
    return `Gs. ${formatNumber(priceInGuaranis)}`;
}

function generateCleanId(product) {
    // ID único más simple y seguro
    const id = product._id.toString();
    const brand = (product.brandName || 'prod').substring(0, 3).toLowerCase().replace(/[^a-z0-9]/g, '');
    const category = (product.subcategory || 'item').substring(0, 3).toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Usar solo el ID del producto para garantizar unicidad
    return `${brand}${category}${id}`.substring(0, 50);
}

function generateOptimizedTitle(product) {
    let title = product.productName || '';
    
    // Limpiar título de caracteres problemáticos
    title = title
        .replace(/[^\w\s\-().]/g, ' ') // Solo letras, números, espacios, guiones y paréntesis
        .replace(/\s+/g, ' ')
        .trim();
    
    // Si es muy largo, acortar manteniendo información importante
    if (title.length > XML_CONFIG.MAX_TITLE_LENGTH) {
        const words = title.split(' ');
        let shortTitle = '';
        let i = 0;
        
        while (i < words.length && (shortTitle + words[i]).length <= XML_CONFIG.MAX_TITLE_LENGTH) {
            shortTitle += (shortTitle ? ' ' : '') + words[i];
            i++;
        }
        
        title = shortTitle || title.substring(0, XML_CONFIG.MAX_TITLE_LENGTH);
    }
    
    return title;
}

function getCategoryInfo(category, subcategory) {
    const categoryData = CATEGORY_MAPPING[category];
    if (!categoryData) {
        return {
            categoryLabel: category,
            subcategoryLabel: subcategory,
            googleCategory: 'Electronics',
            productType: `${category} > ${subcategory}`,
            channableCategory: 'Electronics'
        };
    }
    
    const subcategoryData = categoryData.subcategories[subcategory];
    
    return {
        categoryLabel: categoryData.label,
        subcategoryLabel: subcategoryData ? subcategoryData.label : subcategory,
        googleCategory: subcategoryData ? subcategoryData.google : categoryData.googleCategory,
        productType: `${categoryData.label} > ${subcategoryData ? subcategoryData.label : subcategory}`,
        channableCategory: subcategoryData ? subcategoryData.google : categoryData.googleCategory
    };
}

function getAvailability(product) {
    // Más flexible para incluir más productos
    if (XML_CONFIG.INCLUDE_OUT_OF_STOCK) {
        return 'in stock'; // Para Meta, mejor mostrar como disponible
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
    return `${XML_CONFIG.STORE_URL}/producto/${slug}`;
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

function buildCustomLabels(product, categoryInfo) {
    const discountInfo = getDiscountInfo(product);
    
    const labels = {
        custom_label_0: categoryInfo.categoryLabel,
        custom_label_1: categoryInfo.subcategoryLabel,
        custom_label_2: product.isVipOffer ? 'VIP' : 'REGULAR',
        custom_label_3: discountInfo.hasDiscount ? `OFERTA ${discountInfo.discountPercentage}%` : 'PRECIO_REGULAR',
        custom_label_4: (product.brandName || XML_CONFIG.DEFAULT_BRAND).toUpperCase()
    };
    
    // Agregar custom_label_5 si hay descuento
    if (discountInfo.hasDiscount) {
        labels.custom_label_5 = `${discountInfo.discountPercentage}% OFF`;
    }
    
    return labels;
}

// ===== CONTROLADOR PRINCIPAL =====
const channableFeedController = async (req, res) => {
    try {
        console.log('🔄 Generando feed XML optimizado para Meta/Channable...');
        
        // Query optimizada para incluir más productos
        const query = {
            productImage: { $exists: true, $ne: [], $not: { $size: 0 } },
            productName: { $exists: true, $ne: '' },
            sellingPrice: { $gte: XML_CONFIG.MIN_PRICE },
            slug: { $exists: true, $ne: '' }
        };
        
        const products = await ProductModel
            .find(query)
            .sort({ updatedAt: -1 })
            .lean();
        
        console.log(`✅ ${products.length} productos obtenidos para el feed`);
        
        // Generar XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
        <title>${escapeXML(XML_CONFIG.STORE_NAME)} - Catálogo de Productos</title>
        <link>${XML_CONFIG.STORE_URL}</link>
        <description>${escapeXML(XML_CONFIG.STORE_DESCRIPTION)}</description>
        <language>${XML_CONFIG.LANGUAGE}</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>Bluetec Meta Feed Generator v3.0</generator>\n`;

        let includedCount = 0;
        let skippedCount = 0;

        products.forEach(product => {
            try {
                // Validaciones básicas
                if (!product.productName || !product.productImage || product.productImage.length === 0) {
                    skippedCount++;
                    return;
                }
                
                const sellingPrice = Number(product.sellingPrice);
                if (!sellingPrice || sellingPrice < XML_CONFIG.MIN_PRICE) {
                    skippedCount++;
                    return;
                }
                
                includedCount++;
                
                // Generar datos del producto
                const productSpecs = extractProductSpecs(product);
                const id = generateCleanId(product);
                const title = escapeXML(generateOptimizedTitle(product));
                const description = escapeXML((product.description || product.productName || '').substring(0, 500));
                const brand = escapeXML(product.brandName || XML_CONFIG.DEFAULT_BRAND);
                const categoryInfo = getCategoryInfo(product.category, product.subcategory);
                const availability = getAvailability(product);
                const productUrl = generateProductURL(product.slug);
                const discountInfo = getDiscountInfo(product);
                const customLabels = buildCustomLabels(product, categoryInfo);
                
                // Imagen principal
                const mainImage = product.productImage[0] || '';
                const additionalImages = product.productImage.slice(1, 11) || []; // Máximo 10 adicionales
                
                // Formatear precios
                const price = formatPrice(discountInfo.originalPrice);
                const salePrice = discountInfo.hasDiscount ? formatPrice(discountInfo.sellingPrice) : null;
                
                // Precios específicos para Facebook y templates
                const fbPrice = formatPriceForFacebook(discountInfo.sellingPrice);
                const fbSalePrice = discountInfo.hasDiscount ? formatPriceForFacebook(discountInfo.sellingPrice) : null;
                const displayPrice = formatPriceForDisplay(discountInfo.sellingPrice);
                const displayOriginalPrice = formatPriceForDisplay(discountInfo.originalPrice);
                
                xml += `        <item>
            <g:id>${escapeXML(id)}</g:id>
            <title>${title}</title>
            <description>${description}</description>
            <g:google_product_category>${categoryInfo.googleCategory}</g:google_product_category>
            <g:product_type>${escapeXML(categoryInfo.productType)}</g:product_type>
            <link>${productUrl}</link>
            <g:image_link>${escapeXML(mainImage)}</g:image_link>`;

                // Imágenes adicionales (asegurar que siempre haya al menos un campo)
                if (additionalImages.length > 0) {
                    additionalImages.forEach(img => {
                        xml += `
            <g:additional_image_link>${escapeXML(img)}</g:additional_image_link>`;
                    });
                } else {
                    // Campo vacío para evitar warnings
                    xml += `
            <g:additional_image_link></g:additional_image_link>`;
                }

                xml += `
            <g:condition>new</g:condition>
            <g:availability>${availability}</g:availability>
            <g:price>${escapeXML(price)}</g:price>`;

                // Precio de oferta si hay descuento
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
            <g:gender>unisex</g:gender>`;

                // Información de envío
                xml += `
            <g:shipping>
                <g:country>${XML_CONFIG.COUNTRY}</g:country>
                <g:service>Standard</g:service>
                <g:price>${formatPrice(XML_CONFIG.SHIPPING_COST)}</g:price>
            </g:shipping>`;

                // Labels personalizados
                Object.entries(customLabels).forEach(([key, value]) => {
                    if (value) {
                        xml += `
            <g:${key}>${escapeXML(value)}</g:${key}>`;
                    }
                });

                // Campos adicionales para debugging en Channable
                xml += `
            <precio_original>${escapeXML(price)}</precio_original>
            <categoria_es>${escapeXML(categoryInfo.categoryLabel)}</categoria_es>
            <subcategoria_es>${escapeXML(categoryInfo.subcategoryLabel)}</subcategoria_es>
            <marca_mayuscula>${escapeXML(brand.toUpperCase())}</marca_mayuscula>
            <precio_original_formateado>${escapeXML(price)}</precio_original_formateado>
            <precio_pys_formateado>${escapeXML(price)}</precio_pys_formateado>`;
                
                // NUEVOS CAMPOS PARA FACEBOOK Y TEMPLATES
                xml += `
            <fb_price>${fbPrice}</fb_price>
            <fb_sale_price>${fbSalePrice || fbPrice}</fb_sale_price>
            <display_price>${escapeXML(displayPrice)}</display_price>
            <display_original_price>${escapeXML(displayOriginalPrice)}</display_original_price>`;
                
                // Calcular precio en USD
                const priceUSD = Math.round(discountInfo.sellingPrice / 7300);
                xml += `
            <precio_usd>${priceUSD}</precio_usd>`;
                
                // Agregar specs y campos específicos para templates
                xml += `
            <memory>${escapeXML(productSpecs.memory)}</memory>
            <graphics_card>${escapeXML(productSpecs.graphicsCard)}</graphics_card>
            <refresh_rate>${escapeXML(productSpecs.refreshRate)}</refresh_rate>
            <resolution>${escapeXML(productSpecs.resolution)}</resolution>
            <processor>${escapeXML(productSpecs.processor)}</processor>
            <storage>${escapeXML(productSpecs.storage)}</storage>
            <screen_size>${escapeXML(productSpecs.screenSize)}</screen_size>
            <model>${escapeXML(product.productName.split(' ').slice(0, 3).join(' '))}</model>
            <operating_system>${escapeXML(productSpecs.processor)}</operating_system>
            <storage_capacity>${escapeXML(productSpecs.storage)}</storage_capacity>`;
                
                // Campos de producto detallado
                xml += `
            <g:product_detail>
                <g:section_name>ESPECIFICACIONES</g:section_name>
                <g:attribute_name>CARACTERÍSTICAS</g:attribute_name>
                <g:attribute_value>${escapeXML(productSpecs.memory || productSpecs.processor || productSpecs.storage || 'Consultar especificaciones')}</g:attribute_value>
            </g:product_detail>`;
                
                // Campo de cantidad
                xml += `
            <g:quantity>${product.stock > 0 ? product.stock : 1}</g:quantity>`;
                
                // Campo de imagen sin fondo (obligatorio para algunos canales)
                xml += `
            <image_link_nobg></image_link_nobg>`;
                
                xml += `
            <gtin></gtin>`;
                
                if (discountInfo.hasDiscount) {
                    xml += `
            <precio_oferta>${escapeXML(salePrice)}</precio_oferta>
            <descuento_porcentaje>${discountInfo.discountPercentage}</descuento_porcentaje>
            <descuento>${discountInfo.discountPercentage}</descuento>`;
                } else {
                    xml += `
            <precio_oferta></precio_oferta>
            <descuento_porcentaje></descuento_porcentaje>
            <descuento></descuento>`;
                }
                
                xml += `
            <categoria_principal>${escapeXML(categoryInfo.categoryLabel)}</categoria_principal>
            <subcategoria>${escapeXML(categoryInfo.subcategoryLabel)}</subcategoria>
            <stock_disponible>${product.stock || 0}</stock_disponible>
            <fecha_actualizacion>${new Date().toISOString()}</fecha_actualizacion>`;

                xml += `
        </item>\n`;
                
            } catch (itemError) {
                console.error('❌ Error procesando producto:', product._id, itemError.message);
                skippedCount++;
            }
        });

        xml += `    </channel>
</rss>`;

        console.log(`✅ Feed XML generado exitosamente:`);
        console.log(`   - Productos incluidos: ${includedCount}`);
        console.log(`   - Productos omitidos: ${skippedCount}`);
        console.log(`   - Total procesados: ${products.length}`);
        
        // Headers optimizados para Meta
        res.set({
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800', // 30 minutos
            'Last-Modified': new Date().toUTCString(),
            'Content-Length': Buffer.byteLength(xml, 'utf8'),
            'X-Robots-Tag': 'noindex, nofollow'
        });
        
        res.send(xml);
        
    } catch (error) {
        console.error('❌ Error crítico generando feed:', error);
        res.status(500).json({
            message: 'Error generando feed XML para Meta/Channable',
            error: true,
            success: false,
            details: error.message
        });
    }
};

module.exports = channableFeedController;