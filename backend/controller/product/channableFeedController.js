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

function getGoogleCategory(category, subcategory) {
    const categoryMap = GOOGLE_CATEGORY_MAPPING[category];
    if (!categoryMap) return 'Electronics';
    return categoryMap[subcategory] || categoryMap.default || 'Electronics';
}

function generateProductURL(slug) {
    return `${XML_CONFIG.STORE_URL}/productos/${slug}`;
}

function formatPrice(priceInCents) {
    return (priceInCents / 100).toFixed(0);
}

function getAvailability(stockStatus, stock) {
    if (stockStatus === 'in_stock' && stock > 0) return 'in stock';
    if (stockStatus === 'out_of_stock' || stock === 0) return 'out of stock';
    if (stockStatus === 'low_stock') return 'limited availability';
    return 'out of stock';
}

function buildCustomLabels(product) {
    return {
        custom_label_0: product.category || '',
        custom_label_1: product.subcategory || '',
        custom_label_2: product.isVipOffer ? 'VIP' : 'Regular',
        custom_label_3: `Margin_${product.profitMargin || 0}%`,
        custom_label_4: product.brandName || ''
    };
}

function buildProductAttributes(product) {
    const attributes = [];
    
    if (product.category === 'informatica') {
        if (product.processor) attributes.push(`Procesador: ${product.processor}`);
        if (product.memory) attributes.push(`Memoria: ${product.memory}`);
        if (product.storage) attributes.push(`Almacenamiento: ${product.storage}`);
        if (product.graphicsCard) attributes.push(`Gráficos: ${product.graphicsCard}`);
        if (product.notebookScreen) attributes.push(`Pantalla: ${product.notebookScreen}`);
    }
    
    if (product.category === 'perifericos') {
        if (product.monitorSize) attributes.push(`Tamaño: ${product.monitorSize}`);
        if (product.monitorResolution) attributes.push(`Resolución: ${product.monitorResolution}`);
        if (product.keyboardSwitches) attributes.push(`Switches: ${product.keyboardSwitches}`);
        if (product.mouseDPI) attributes.push(`DPI: ${product.mouseDPI}`);
    }
    
    return attributes.join(' | ');
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
            query.$or = [
                { stock: { $gt: 0 } },
                { stockStatus: 'in_stock' }
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
            
            // Datos básicos
            const id = product._id.toString();
            const title = escapeXML(product.productName);
            const description = escapeXML(product.description || product.productName);
            const brand = escapeXML(product.brandName || '');
            const price = formatPrice(product.sellingPrice);
            const availability = getAvailability(product.stockStatus, product.stock);
            const productUrl = generateProductURL(product.slug);
            const googleCategory = getGoogleCategory(product.category, product.subcategory);
            const productType = `${escapeXML(product.category)} > ${escapeXML(product.subcategory)}`;
            
            // Imágenes
            const mainImage = product.productImage[0] || '';
            const additionalImages = product.productImage.slice(1) || [];
            
            // Envío
            const shippingCost = formatPrice(product.deliveryCost || XML_CONFIG.SHIPPING_COST);
            
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
            <g:price>${price} ${XML_CONFIG.BASE_CURRENCY}</g:price>
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
                <g:section_name>Especificaciones</g:section_name>
                <g:attribute_name>Características</g:attribute_name>
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

            // Especificaciones técnicas específicas
            if (product.category === 'informatica') {
                if (product.processor) xml += `
            <g:processor>${escapeXML(product.processor)}</g:processor>`;
                if (product.memory) xml += `
            <g:memory>${escapeXML(product.memory)}</g:memory>`;
                if (product.storage) xml += `
            <g:storage>${escapeXML(product.storage)}</g:storage>`;
                if (product.graphicsCard) xml += `
            <g:graphics_card>${escapeXML(product.graphicsCard)}</g:graphics_card>`;
            }

            if (product.category === 'perifericos' && product.subcategory === 'monitores') {
                if (product.monitorSize) xml += `
            <g:screen_size>${escapeXML(product.monitorSize)}</g:screen_size>`;
                if (product.monitorResolution) xml += `
            <g:resolution>${escapeXML(product.monitorResolution)}</g:resolution>`;
                if (product.monitorRefreshRate) xml += `
            <g:refresh_rate>${escapeXML(product.monitorRefreshRate)}</g:refresh_rate>`;
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