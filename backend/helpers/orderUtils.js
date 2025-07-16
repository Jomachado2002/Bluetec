// backend/helpers/orderUtils.js - UTILIDADES PARA PEDIDOS
const nodemailer = require('nodemailer');

/**
 * ✅ CONFIGURAR TRANSPORTER DE EMAIL
 */
const createEmailTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * ✅ GENERAR NÚMERO DE PEDIDO ÚNICO
 */
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}-${random}`;
};

/**
 * ✅ CALCULAR MONTOS DEL PEDIDO
 */
const calculateOrderAmounts = (items) => {
    if (!items || !Array.isArray(items)) {
        return { subtotal: 0, tax_amount: 0, total_amount: 0 };
    }
    
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = parseFloat(item.total_price) || 0;
        return sum + itemTotal;
    }, 0);
    
    const tax_amount = subtotal * 0.1; // 10% IVA
    const total_amount = subtotal + tax_amount;
    
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(tax_amount * 100) / 100,
        total_amount: Math.round(total_amount * 100) / 100
    };
};

/**
 * ✅ FORMATEAR PRECIO EN GUARANÍES
 */
const formatPYGCurrency = (amount) => {
    if (!amount || isNaN(amount)) return 'Gs. 0';
    
    return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * ✅ VALIDAR DATOS DE UBICACIÓN
 */
const validateDeliveryLocation = (location) => {
    if (!location) {
        return { isValid: false, error: 'Ubicación de entrega requerida' };
    }
    
    const { lat, lng, address } = location;
    
    if (!lat || !lng) {
        return { isValid: false, error: 'Coordenadas de ubicación requeridas' };
    }
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
        return { isValid: false, error: 'Latitud inválida' };
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
        return { isValid: false, error: 'Longitud inválida' };
    }
    
    if (!address || address.trim().length < 10) {
        return { isValid: false, error: 'Dirección de entrega muy corta' };
    }
    
    return { isValid: true };
};

/**
 * ✅ VALIDAR ITEMS DEL PEDIDO
 */
const validateOrderItems = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return { isValid: false, error: 'Productos requeridos' };
    }
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (!item.name || item.name.trim().length < 2) {
            return { isValid: false, error: `Nombre del producto ${i + 1} inválido` };
        }
        
        if (!item.quantity || item.quantity < 1) {
            return { isValid: false, error: `Cantidad del producto ${i + 1} inválida` };
        }
        
        if (!item.unit_price || item.unit_price < 0) {
            return { isValid: false, error: `Precio unitario del producto ${i + 1} inválido` };
        }
        
        if (!item.total_price || item.total_price < 0) {
            return { isValid: false, error: `Precio total del producto ${i + 1} inválido` };
        }
        
        // Verificar que el total sea correcto
        const expectedTotal = item.quantity * item.unit_price;
        if (Math.abs(item.total_price - expectedTotal) > 0.01) {
            return { isValid: false, error: `Cálculo incorrecto para producto ${i + 1}` };
        }
    }
    
    return { isValid: true };
};

/**
 * ✅ GENERAR GOOGLE MAPS URL
 */
const generateGoogleMapsUrl = (lat, lng) => {
    if (!lat || !lng) return '';
    return `https://www.google.com/maps?q=${lat},${lng}`;
};

/**
 * ✅ OBTENER TIPO DE DISPOSITIVO
 */
const getDeviceType = (userAgent) => {
    if (!userAgent) return 'desktop';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    }
    
    if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
    }
    
    return 'desktop';
};

/**
 * ✅ GENERAR TEMPLATE DE EMAIL PARA PEDIDO
 */
const generateOrderEmailTemplate = (order, type = 'confirmation') => {
    const baseTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2A3190; color: white; padding: 20px; text-align: center;">
                <h1>BlueTec - Tecnología Profesional</h1>
            </div>
            <div style="padding: 20px;">
    `;
    
    const footerTemplate = `
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p>BlueTec S.R.L. - Tecnología Profesional</p>
                <p>WhatsApp: +595 984 133733 | Email: ventas@bluetec.com.py</p>
                <p>www.bluetec.com.py</p>
            </div>
        </div>
    `;
    
    let content = '';
    
    switch (type) {
        case 'confirmation':
            content = `
                <h2 style="color: #2A3190;">¡Gracias por tu pedido!</h2>
                <p>Hemos recibido tu pedido exitosamente.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Detalles del Pedido</h3>
                    <p><strong>Número de Pedido:</strong> ${order.order_id}</p>
                    <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString('es-PY')}</p>
                    <p><strong>Total:</strong> ${formatPYGCurrency(order.total_amount)}</p>
                    <p><strong>Método de Pago:</strong> ${order.payment_method === 'bank_transfer' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito'}</p>
                </div>
            `;
            break;
        
        case 'transfer_instructions':
            content = `
                <h2 style="color: #2A3190;">Instrucciones de Transferencia</h2>
                <p>Para completar tu pedido, realiza la transferencia con los siguientes datos:</p>
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Datos Bancarios - COMPULANDIA SRL</h3>
                    <p><strong>Banco:</strong> BANCO CONTINENTAL</p>
                    <p><strong>Tipo de Cuenta:</strong> CTA CTE Gs</p>
                    <p><strong>Número de Cuenta:</strong> 66-214830-07</p>
                    <p><strong>Titular:</strong> COMPULANDIA SRL</p>
                    <p><strong>Monto:</strong> ${formatPYGCurrency(order.total_amount)}</p>
                    <p><strong>Referencia:</strong> ${order.order_id}</p>
                </div>
                <p><strong>Importante:</strong> Una vez realizada la transferencia, sube el comprobante a través de tu perfil en la web.</p>
            `;
            break;
        
        case 'transfer_approved':
            content = `
                <h2 style="color: #28a745;">¡Pago Aprobado!</h2>
                <p>Tu transferencia ha sido verificada y aprobada exitosamente.</p>
                <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Estado del Pedido</h3>
                    <p><strong>Número de Pedido:</strong> ${order.order_id}</p>
                    <p><strong>Estado:</strong> Confirmado</p>
                    <p><strong>Fecha de Aprobación:</strong> ${new Date().toLocaleDateString('es-PY')}</p>
                </div>
                <p>En breve nos pondremos en contacto contigo para coordinar la entrega.</p>
            `;
            break;
        
        case 'transfer_rejected':
            content = `
                <h2 style="color: #dc3545;">Transferencia Rechazada</h2>
                <p>Lamentamos informarte que tu transferencia no pudo ser verificada.</p>
                <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Detalles del Rechazo</h3>
                    <p><strong>Número de Pedido:</strong> ${order.order_id}</p>
                    <p><strong>Motivo:</strong> Comprobante no válido o monto incorrecto</p>
                </div>
                <p>Por favor contacta con nosotros al WhatsApp +595 984 133733 para resolver este inconveniente.</p>
            `;
            break;
    }
    
    return baseTemplate + content + footerTemplate;
};

/**
 * ✅ ENVIAR EMAIL DE NOTIFICACIÓN
 */
const sendOrderNotification = async (order, type = 'confirmation') => {
    try {
        const transporter = createEmailTransporter();
        
        const emailContent = generateOrderEmailTemplate(order, type);
        
        let subject = '';
        switch (type) {
            case 'confirmation':
                subject = `Pedido Confirmado - ${order.order_id}`;
                break;
            case 'transfer_instructions':
                subject = `Instrucciones de Transferencia - ${order.order_id}`;
                break;
            case 'transfer_approved':
                subject = `Pago Aprobado - ${order.order_id}`;
                break;
            case 'transfer_rejected':
                subject = `Transferencia Rechazada - ${order.order_id}`;
                break;
        }
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: order.customer_info.email,
            subject: subject,
            html: emailContent
        });
        
        console.log(`✅ Email enviado: ${type} para pedido ${order.order_id}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return false;
    }
};

/**
 * ✅ GENERAR MENSAJE DE WHATSAPP
 */
const generateWhatsAppMessage = (order, type = 'confirmation') => {
    const baseMessage = `*BlueTec - Tecnología Profesional*\n\n`;
    
    let message = baseMessage;
    
    switch (type) {
        case 'confirmation':
            message += `✅ *PEDIDO CONFIRMADO*\n\n`;
            message += `📋 *Número de Pedido:* ${order.order_id}\n`;
            message += `📅 *Fecha:* ${new Date(order.createdAt).toLocaleDateString('es-PY')}\n`;
            message += `💰 *Total:* ${formatPYGCurrency(order.total_amount)}\n`;
            message += `💳 *Método:* ${order.payment_method === 'bank_transfer' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito'}\n\n`;
            break;
        
        case 'transfer_instructions':
            message += `💳 *INSTRUCCIONES DE TRANSFERENCIA*\n\n`;
            message += `📋 *Pedido:* ${order.order_id}\n`;
            message += `💰 *Monto:* ${formatPYGCurrency(order.total_amount)}\n\n`;
            message += `🏦 *DATOS BANCARIOS:*\n`;
            message += `• Banco: BANCO CONTINENTAL\n`;
            message += `• Cuenta: CTA CTE Gs\n`;
            message += `• Número: 66-214830-07\n`;
            message += `• Titular: COMPULANDIA SRL\n`;
            message += `• Referencia: ${order.order_id}\n\n`;
            message += `📤 *Recuerda subir el comprobante en la web*`;
            break;
        
        case 'transfer_approved':
            message += `🎉 *PAGO APROBADO*\n\n`;
            message += `✅ Tu transferencia ha sido verificada exitosamente\n`;
            message += `📋 *Pedido:* ${order.order_id}\n`;
            message += `📅 *Aprobado:* ${new Date().toLocaleDateString('es-PY')}\n\n`;
            message += `🚚 En breve coordinaremos la entrega`;
            break;
        
        case 'transfer_rejected':
            message += `❌ *TRANSFERENCIA RECHAZADA*\n\n`;
            message += `📋 *Pedido:* ${order.order_id}\n`;
            message += `❗ *Motivo:* Comprobante no válido\n\n`;
            message += `📞 Contacta con nosotros para resolver`;
            break;
    }
    
    return message;
};

/**
 * ✅ SANITIZAR DATOS DE ENTRADA
 */
const sanitizeOrderData = (data) => {
    if (!data || typeof data !== 'object') return {};
    
    const sanitized = {};
    
    // Sanitizar customer_info
    if (data.customer_info) {
        sanitized.customer_info = {
            name: data.customer_info.name ? data.customer_info.name.trim() : '',
            email: data.customer_info.email ? data.customer_info.email.trim().toLowerCase() : '',
            phone: data.customer_info.phone ? data.customer_info.phone.trim() : '',
            address: data.customer_info.address ? data.customer_info.address.trim() : ''
        };
    }
    
    // Sanitizar delivery_location
    if (data.delivery_location) {
        sanitized.delivery_location = {
            lat: parseFloat(data.delivery_location.lat) || 0,
            lng: parseFloat(data.delivery_location.lng) || 0,
            address: data.delivery_location.address ? data.delivery_location.address.trim() : ''
        };
    }
    
    // Sanitizar items
    if (data.items && Array.isArray(data.items)) {
        sanitized.items = data.items.map(item => ({
            name: item.name ? item.name.trim() : '',
            quantity: parseInt(item.quantity) || 1,
            unit_price: parseFloat(item.unit_price) || 0,
            total_price: parseFloat(item.total_price) || 0,
            category: item.category ? item.category.trim() : '',
            brand: item.brand ? item.brand.trim() : '',
            product_id: item.product_id || item.productId || '',
            image_url: item.image_url || item.imageUrl || ''
        }));
    }
    
    // Sanitizar otros campos
    sanitized.payment_method = data.payment_method || '';
    sanitized.order_notes = data.order_notes ? data.order_notes.trim() : '';
    sanitized.device_type = data.device_type || 'desktop';
    
    return sanitized;
};

/**
 * ✅ OBTENER RESUMEN DEL PEDIDO
 */
const getOrderSummary = (order) => {
    if (!order) return null;
    
    return {
        order_id: order.order_id,
        customer_name: order.customer_info.name,
        customer_email: order.customer_info.email,
        total_amount: order.total_amount,
        items_count: order.items.length,
        payment_method: order.payment_method,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.createdAt,
        formatted_total: formatPYGCurrency(order.total_amount),
        delivery_address: order.delivery_location.address
    };
};

/**
 * ✅ VERIFICAR SI UN PEDIDO PUEDE SER CANCELADO
 */
const canCancelOrder = (order) => {
    if (!order) return false;
    
    const nonCancellableStatuses = ['completed', 'cancelled'];
    return !nonCancellableStatuses.includes(order.status);
};

/**
 * ✅ VERIFICAR SI UN PEDIDO PUEDE SER MODIFICADO
 */
const canModifyOrder = (order) => {
    if (!order) return false;
    
    const nonModifiableStatuses = ['completed', 'cancelled', 'processing'];
    return !nonModifiableStatuses.includes(order.status);
};

/**
 * ✅ GENERAR DATOS PARA FACTURACIÓN
 */
const generateInvoiceData = (order) => {
    if (!order) return null;
    
    return {
        invoice_number: `INV-${order.order_id}`,
        invoice_date: new Date(),
        customer: {
            name: order.customer_info.name,
            email: order.customer_info.email,
            phone: order.customer_info.phone,
            address: order.customer_info.address
        },
        items: order.items.map(item => ({
            description: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total_price
        })),
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        currency: 'PYG'
    };
};

/**
 * ✅ CALCULAR TIEMPO TRANSCURRIDO
 */
const getTimeElapsed = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 60) {
        return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else {
        return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    }
};

/**
 * ✅ GENERAR CÓDIGO QR PARA SEGUIMIENTO
 */
const generateTrackingQR = (orderId) => {
    if (!orderId) return null;
    
    const trackingUrl = `${process.env.FRONTEND_URL}/seguimiento/${orderId}`;
    return {
        url: trackingUrl,
        qr_data: orderId,
        tracking_link: trackingUrl
    };
};

/**
 * ✅ LOGS DE AUDITORÍA
 */
const logOrderAction = (action, orderId, userId, details = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        order_id: orderId,
        user_id: userId,
        details,
        ip_address: details.ip_address || 'unknown',
        user_agent: details.user_agent || 'unknown'
    };
    
    console.log('📋 ORDER ACTION LOG:', JSON.stringify(logEntry, null, 2));
    
    // Aquí podrías enviar a un servicio de logging externo
    // como Winston, MongoDB logging, etc.
};

module.exports = {
    generateOrderNumber,
    calculateOrderAmounts,
    formatPYGCurrency,
    validateDeliveryLocation,
    validateOrderItems,
    generateGoogleMapsUrl,
    getDeviceType,
    generateOrderEmailTemplate,
    sendOrderNotification,
    generateWhatsAppMessage,
    sanitizeOrderData,
    getOrderSummary,
    canCancelOrder,
    canModifyOrder,
    generateInvoiceData,
    getTimeElapsed,
    generateTrackingQR,
    logOrderAction
};