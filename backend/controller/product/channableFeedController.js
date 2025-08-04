// backend/controller/product/channableFeedController.js
const ProductModel = require('../../models/productModel');

// ===== CONFIGURACIÓN =====
const XML_CONFIG = {
    STORE_NAME: 'Bluetec',
    STORE_URL: 'https://www.bluetec.com.py',
    STORE_DESCRIPTION: 'Tienda especializada en tecnología e informática',
    BASE_CURRENCY: 'PYG',
    SHIPPING_COST: 30000,
    COUNTRY: 'PY',
    LANGUAGE: 'es',
    INCLUDE_OUT_OF_STOCK: false,
    MIN_PRICE: 1000
};

// ===== MAPEO DE CATEGORÍAS GOOGLE =====
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
        'default': 'Electronics > Computers'
    },
    'perifericos': {
        'monitores': 'Electronics > Computers > Monitors',
        'teclados': 'Electronics > Computer Accessories > Input Devices > Computer Keyboards',
        'mouses': 'Electronics > Computer Accessories > Input Devices > Computer Mice',
        'auriculares': 'Electronics > Audio > Headphones',
        'microfonos': 'Electronics > Audio > Audio Components > Microphones',
        'adaptadores': 'Electronics > Computer Accessories > Cables & Interconnects',
        'default': 'Electronics > Computer Accessories'
    },
    'cctv': {
        'camaras_seguridad': 'Electronics > Electronics Accessories > Security Accessories > Surveillance Camera Systems',
        'dvr': 'Electronics > Electronics Accessories > Security Accessories',
        'nas': 'Electronics > Computer Components > Storage Devices > Network Attached Storage',
        'default': 'Electronics > Electronics Accessories > Security Accessories'
    },
    'redes': {
        'switch': 'Electronics > Networking > Network Switches',
        'servidores': 'Electronics > Computers > Computer Servers',
        'cablesred': 'Electronics > Computer Accessories > Cables & Interconnects > Network Cables',
        'racks': 'Electronics > Networking > Network Rack & Enclosures',
        'ap': 'Electronics > Networking > Wireless Access Points',
        'default': 'Electronics > Networking'
    },
    'telefonia': {
        'telefonos_moviles': 'Electronics > Communications > Telephony > Mobile Phones',
        'telefonos_fijos': 'Electronics > Communications > Telephony > Corded Phones',
        'tablets': 'Electronics > Computers > Tablet Computers',
        'default': 'Electronics > Communications > Telephony'
    },
    'energia': {
        'ups': 'Electronics > Computer Components > Uninterruptible Power Supplies',
        'default': 'Electronics > Computer Components'
    },
    'electronicos': {
        'camaras_fotografia': 'Electronics > Cameras & Optics > Cameras > Digital Cameras',
        'drones': 'Electronics > Remote Control & Play Vehicles > Drones',
        'televisores': 'Electronics > Electronics Accessories > Audio & Video Accessories > Televisions',
        'parlantes': 'Electronics > Audio > Audio Players & Recorders > Speakers',
        'relojes_inteligentes': 'Electronics > Electronics Accessories > Wearable Technology > Smartwatches',
        'default': 'Electronics'
    },
    'software': {
        'licencias': 'Software > Computer Software',
        'default': 'Software'
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

// ✅ Función para convertir texto a mayúsculas manteniendo formato
function toUpperCasePreserving(text) {
    if (typeof text !== 'string') text = String(text || '');
    return text.toUpperCase();
}

function getGoogleCategory(category, subcategory) {
    const categoryMap = GOOGLE_CATEGORY_MAPPING[category];
    if (!categoryMap) return 'Electronics';
    return categoryMap[subcategory] || categoryMap.default || 'Electronics';
}

// ✅ CAMBIO DE URL: productos -> producto
function generateProductURL(slug) {
    return `${XML_CONFIG.STORE_URL}/producto/${slug}`;
}

function formatPrice(priceInCents) {
    return (priceInCents).toFixed(0);
}

function getAvailability(stockStatus, stock) {
    if (stockStatus === 'in_stock' && stock > 0) return 'in stock';
    if (stockStatus === 'out_of_stock' || stock === 0) return 'out of stock';
    if (stockStatus === 'low_stock') return 'limited availability';
    return 'out of stock';
}

function buildCustomLabels(product) {
    return {
        custom_label_0: toUpperCasePreserving(product.category || ''),
        custom_label_1: toUpperCasePreserving(product.subcategory || ''),
        custom_label_2: product.isVipOffer ? 'VIP' : 'REGULAR',
        custom_label_3: `MARGIN_${product.profitMargin || 0}%`,
        custom_label_4: toUpperCasePreserving(product.brandName || '')
    };
}

function buildProductAttributes(product) {
    const attributes = [];
    
    if (product.category === 'informatica') {
        if (product.processor) attributes.push(`PROCESADOR: ${toUpperCasePreserving(product.processor)}`);
        if (product.memory) attributes.push(`MEMORIA: ${toUpperCasePreserving(product.memory)}`);
        if (product.storage) attributes.push(`ALMACENAMIENTO: ${toUpperCasePreserving(product.storage)}`);
        if (product.graphicsCard) attributes.push(`GRÁFICOS: ${toUpperCasePreserving(product.graphicsCard)}`);
        if (product.notebookScreen) attributes.push(`PANTALLA: ${toUpperCasePreserving(product.notebookScreen)}`);
    }
    
    if (product.category === 'perifericos') {
        if (product.monitorSize) attributes.push(`TAMAÑO: ${toUpperCasePreserving(product.monitorSize)}`);
        if (product.monitorResolution) attributes.push(`RESOLUCIÓN: ${toUpperCasePreserving(product.monitorResolution)}`);
        if (product.keyboardSwitches) attributes.push(`SWITCHES: ${toUpperCasePreserving(product.keyboardSwitches)}`);
        if (product.mouseDPI) attributes.push(`DPI: ${toUpperCasePreserving(product.mouseDPI)}`);
    }
    
    return attributes.join(' | ');
}

// ✅ Función para determinar si hay descuento y calcular precios
function getPriceInfo(product) {
    const sellingPrice = formatPrice(product.sellingPrice);
    const originalPrice = product.price ? formatPrice(product.price) : null;
    const hasDiscount = originalPrice && product.price > product.sellingPrice;
    
    return {
        sellingPrice,
        originalPrice,
        hasDiscount,
        discountPercentage: hasDiscount ? Math.round(((product.price - product.sellingPrice) / product.price) * 100) : 0
    };
}

// ===== CONTROLADOR PRINCIPAL =====
const channableFeedController = async (req, res) => {
    try {
        console.log('🔄 Generando feed XML para Channable...');
        
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
        
        // Proyección optimizada
        const projection = {
            _id: 1,
            productName: 1,
            brandName: 1,
            category: 1,
            subcategory: 1,
            productImage: 1,
            description: 1,
            price: 1,
            sellingPrice: 1,
            stock: 1,
            stockStatus: 1,
            isVipOffer: 1,
            slug: 1,
            deliveryCost: 1,
            profitMargin: 1,
            // Especificaciones técnicas
            processor: 1,
            memory: 1,
            storage: 1,
            graphicsCard: 1,
            notebookScreen: 1,
            monitorSize: 1,
            monitorResolution: 1,
            monitorRefreshRate: 1,
            keyboardSwitches: 1,
            mouseDPI: 1,
            createdAt: 1,
            updatedAt: 1
        };
        
        const products = await ProductModel
            .find(query, projection)
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
        <generator>Bluetec XML Generator v1.0</generator>\n`;

        let includedCount = 0;

        products.forEach(product => {
            // Verificar datos mínimos
            if (!product.productName || !product.productImage || product.productImage.length === 0) {
                return;
            }
            
            includedCount++;
            
            // ✅ Obtener información de precios
            const priceInfo = getPriceInfo(product);
            
            // Datos básicos con mayúsculas
            const id = product._id.toString();
            const title = escapeXML(toUpperCasePreserving(product.productName));
            const description = escapeXML(toUpperCasePreserving(product.description || product.productName));
            const brand = escapeXML(toUpperCasePreserving(product.brandName || ''));
            const availability = getAvailability(product.stockStatus, product.stock);
            const productUrl = generateProductURL(product.slug);
            const googleCategory = getGoogleCategory(product.category, product.subcategory);
            const productType = `${escapeXML(toUpperCasePreserving(product.category))} > ${escapeXML(toUpperCasePreserving(product.subcategory))}`;
            
            // Imágenes
            const mainImage = product.productImage[0] || '';
            const additionalImages = product.productImage.slice(1) || [];
            
            // Envío
            const shippingCost = ((product.deliveryCost || XML_CONFIG.SHIPPING_COST) / 100).toFixed(0);
            
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
            <g:price>${priceInfo.sellingPrice} ${XML_CONFIG.BASE_CURRENCY}</g:price>`;

            // ✅ AGREGAR PRECIO ORIGINAL SI HAY DESCUENTO
            if (priceInfo.hasDiscount) {
                xml += `
            <g:sale_price>${priceInfo.sellingPrice} ${XML_CONFIG.BASE_CURRENCY}</g:sale_price>
            <g:sale_price_effective_date>${new Date().toISOString().split('T')[0]}/${new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]}</g:sale_price_effective_date>`;
                
                // Cambiar el precio principal al precio original
                xml = xml.replace(
                    `<g:price>${priceInfo.sellingPrice} ${XML_CONFIG.BASE_CURRENCY}</g:price>`,
                    `<g:price>${priceInfo.originalPrice} ${XML_CONFIG.BASE_CURRENCY}</g:price>`
                );
            }

            xml += `
            <g:brand>${brand}</g:brand>
            <g:gtin>${escapeXML(id)}</g:gtin>
            <g:mpn>${escapeXML(id)}</g:mpn>
            <g:identifier_exists>true</g:identifier_exists>
            <g:age_group>adult</g:age_group>
            <g:gender>unisex</g:gender>`;

            // Información de envío
            xml += `
            <g:shipping>
                <g:country>${XML_CONFIG.COUNTRY}</g:country>
                <g:service>Standard</g:service>
                <g:price>${shippingCost} ${XML_CONFIG.BASE_CURRENCY}</g:price>
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

            // ✅ INFORMACIÓN DE DESCUENTO COMO LABEL PERSONALIZADO
            if (priceInfo.hasDiscount) {
                xml += `
            <g:custom_label_5>DESCUENTO_${priceInfo.discountPercentage}%</g:custom_label_5>`;
            }

            // Especificaciones técnicas específicas (en mayúsculas)
            if (product.category === 'informatica') {
                if (product.processor) xml += `
            <g:processor>${escapeXML(toUpperCasePreserving(product.processor))}</g:processor>`;
                if (product.memory) xml += `
            <g:memory>${escapeXML(toUpperCasePreserving(product.memory))}</g:memory>`;
                if (product.storage) xml += `
            <g:storage>${escapeXML(toUpperCasePreserving(product.storage))}</g:storage>`;
                if (product.graphicsCard) xml += `
            <g:graphics_card>${escapeXML(toUpperCasePreserving(product.graphicsCard))}</g:graphics_card>`;
            }

            if (product.category === 'perifericos' && product.subcategory === 'monitores') {
                if (product.monitorSize) xml += `
            <g:screen_size>${escapeXML(toUpperCasePreserving(product.monitorSize))}</g:screen_size>`;
                if (product.monitorResolution) xml += `
            <g:resolution>${escapeXML(toUpperCasePreserving(product.monitorResolution))}</g:resolution>`;
                if (product.monitorRefreshRate) xml += `
            <g:refresh_rate>${escapeXML(toUpperCasePreserving(product.monitorRefreshRate))}</g:refresh_rate>`;
            }

            // Stock quantity
            if (product.stock > 0) {
                xml += `
            <g:quantity>${product.stock}</g:quantity>`;
            }

            xml += `
        </item>\n`;
        });

        xml += `    </channel>
</rss>`;

        console.log(`✅ XML generado con ${includedCount} productos`);
        console.log(`📊 Productos con descuento detectados automáticamente`);
        
        // Configurar headers para XML
        res.set({
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
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