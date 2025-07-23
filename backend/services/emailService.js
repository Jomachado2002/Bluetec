// backend/services/emailService.js - SERVICIO DE EMAIL PARA DELIVERY TRACKING

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        // ✅ CONFIGURACIÓN PARA GMAIL/SMTP
        return nodemailer.createTransport({
            service: 'gmail', // o tu servicio preferido
            auth: {
                user: process.env.EMAIL_USER, // tu email
                pass: process.env.EMAIL_PASS  // app password de Gmail
            },
            // Para otros proveedores:
            // host: process.env.SMTP_HOST,
            // port: process.env.SMTP_PORT,
            // secure: true
        });
    }

    // ✅ PLANTILLAS DE EMAIL PARA CADA ESTADO
    getEmailTemplate(status, data) {
        const templates = {
            payment_confirmed: this.paymentConfirmedTemplate(data),
            preparing_order: this.preparingOrderTemplate(data),
            in_transit: this.inTransitTemplate(data),
            delivered: this.deliveredTemplate(data),
            problem: this.problemTemplate(data)
        };

        return templates[status] || this.defaultTemplate(data);
    }

    paymentConfirmedTemplate(data) {
        return {
            subject: `✅ Pago Confirmado - Pedido #${data.shop_process_id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2A3190; margin: 0;">🎉 ¡Pago Confirmado!</h1>
                            <p style="color: #666; margin: 10px 0 0 0;">Pedido #${data.shop_process_id}</p>
                        </div>

                        <!-- Progress Bar -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="color: #28a745; font-weight: bold;">✅ Pago Confirmado</span>
                                <span style="color: #ccc;">📦 Preparando</span>
                                <span style="color: #ccc;">🚚 En Camino</span>
                                <span style="color: #ccc;">📍 Entregado</span>
                            </div>
                            <div style="height: 4px; background-color: #e9ecef; border-radius: 2px; overflow: hidden;">
                                <div style="height: 100%; width: 25%; background-color: #28a745; transition: width 0.3s;"></div>
                            </div>
                        </div>

                        <!-- Detalles del Pedido -->
                        <div style="margin: 20px 0;">
                            <h3 style="color: #2A3190; margin-bottom: 15px;">📦 Detalles de tu Pedido</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Cliente:</td>
                                    <td style="padding: 8px 0; font-weight: bold;">${data.customer_info?.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Total Pagado:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #28a745;">
                                        ${new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(data.amount)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Productos:</td>
                                    <td style="padding: 8px 0; font-weight: bold;">${data.items?.length || 0} item(s)</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Método de Pago:</td>
                                    <td style="padding: 8px 0; font-weight: bold;">
                                        ${data.payment_method === 'saved_card' ? '💳 Tarjeta Guardada' : '🆕 Nueva Tarjeta'}
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <!-- Productos -->
                        ${data.items?.length > 0 ? `
                            <div style="margin: 20px 0;">
                                <h3 style="color: #2A3190; margin-bottom: 15px;">🛍️ Productos Comprados</h3>
                                ${data.items.map(item => `
                                    <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px; background-color: #fafafa;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div>
                                                <strong style="color: #333;">${item.name}</strong>
                                                <br>
                                                <span style="color: #666; font-size: 14px;">Cantidad: ${item.quantity}</span>
                                            </div>
                                            <div style="text-align: right;">
                                                <strong style="color: #2A3190;">
                                                    ${new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(item.total || (item.quantity * item.unitPrice))}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        <!-- Información de Entrega -->
                        ${data.delivery_location ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #e8f4fd; border-radius: 8px;">
                                <h3 style="color: #2A3190; margin-bottom: 10px;">📍 Información de Entrega</h3>
                                <p style="margin: 5px 0; color: #333;">
                                    <strong>Dirección:</strong> ${data.delivery_location.address || data.delivery_location.manual_address || 'No especificada'}
                                </p>
                                ${data.delivery_location.city ? `<p style="margin: 5px 0; color: #333;"><strong>Ciudad:</strong> ${data.delivery_location.city}</p>` : ''}
                                ${data.delivery_location.reference ? `<p style="margin: 5px 0; color: #333;"><strong>Referencia:</strong> ${data.delivery_location.reference}</p>` : ''}
                            </div>
                        ` : ''}

                        <!-- Próximos Pasos -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                            <h3 style="color: #856404; margin-bottom: 10px;">📋 Próximos Pasos</h3>
                            <ul style="color: #856404; margin: 0; padding-left: 20px;">
                                <li>Estamos verificando tu pago</li>
                                <li>Comenzaremos a preparar tu pedido en breve</li>
                                <li>Te notificaremos cuando esté listo para envío</li>
                                <li>Recibirás tracking del envío</li>
                            </ul>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; margin: 0;">
                                ¿Tienes preguntas? Contáctanos en 
                                <a href="mailto:soporte@bluetec.com" style="color: #2A3190;">soporte@bluetec.com</a>
                            </p>
                            <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                                BlueTec - Tu tienda tecnológica de confianza
                            </p>
                        </div>
                    </div>
                </div>
            `
        };
    }

    preparingOrderTemplate(data) {
        return {
            subject: `📦 Preparando tu Pedido #${data.shop_process_id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2A3190; margin: 0;">📦 ¡Preparando tu Pedido!</h1>
                            <p style="color: #666; margin: 10px 0 0 0;">Pedido #${data.shop_process_id}</p>
                        </div>

                        <!-- Progress Bar -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="color: #28a745;">✅ Confirmado</span>
                                <span style="color: #ffc107; font-weight: bold;">📦 Preparando</span>
                                <span style="color: #ccc;">🚚 En Camino</span>
                                <span style="color: #ccc;">📍 Entregado</span>
                            </div>
                            <div style="height: 4px; background-color: #e9ecef; border-radius: 2px; overflow: hidden;">
                                <div style="height: 100%; width: 50%; background-color: #ffc107; transition: width 0.3s;"></div>
                            </div>
                        </div>

                        <!-- Mensaje Principal -->
                        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #e8f4fd; border-radius: 8px;">
                            <h2 style="color: #2A3190; margin: 0 0 10px 0;">🎯 ¡Estamos preparando tu pedido!</h2>
                            <p style="color: #666; margin: 0; font-size: 16px;">
                                Nuestro equipo está empacando cuidadosamente tus productos.
                            </p>
                        </div>

                        <!-- Notas del Vendedor -->
                        ${data.delivery_notes ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                                <h3 style="color: #155724; margin-bottom: 10px;">💬 Notas del Vendedor</h3>
                                <p style="color: #155724; margin: 0;">${data.delivery_notes}</p>
                            </div>
                        ` : ''}

                        <!-- Estimación -->
                        ${data.estimated_delivery_date ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px;">
                                <h3 style="color: #856404; margin-bottom: 10px;">📅 Fecha Estimada de Entrega</h3>
                                <p style="color: #856404; margin: 0; font-size: 18px; font-weight: bold;">
                                    ${new Date(data.estimated_delivery_date).toLocaleDateString('es-ES', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            </div>
                        ` : ''}

                        <!-- Qué Sigue -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                            <h3 style="color: #2A3190; margin-bottom: 10px;">🔄 Qué Sigue</h3>
                            <ul style="color: #666; margin: 0; padding-left: 20px;">
                                <li>Verificamos la calidad de cada producto</li>
                                <li>Empacamos todo con cuidado especial</li>
                                <li>Coordinamos el envío con nuestra logística</li>
                                <li>Te notificaremos cuando salga en camino</li>
                            </ul>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; margin: 0;">
                                ¿Necesitas hacer algún cambio? Contáctanos pronto en 
                                <a href="mailto:soporte@bluetec.com" style="color: #2A3190;">soporte@bluetec.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            `
        };
    }

    inTransitTemplate(data) {
        return {
            subject: `🚚 Tu Pedido está En Camino #${data.shop_process_id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2A3190; margin: 0;">🚚 ¡Tu Pedido está En Camino!</h1>
                            <p style="color: #666; margin: 10px 0 0 0;">Pedido #${data.shop_process_id}</p>
                        </div>

                        <!-- Progress Bar -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="color: #28a745;">✅ Confirmado</span>
                                <span style="color: #28a745;">✅ Preparado</span>
                                <span style="color: #007bff; font-weight: bold;">🚚 En Camino</span>
                                <span style="color: #ccc;">📍 Entregado</span>
                            </div>
                            <div style="height: 4px; background-color: #e9ecef; border-radius: 2px; overflow: hidden;">
                                <div style="height: 100%; width: 75%; background-color: #007bff; transition: width 0.3s;"></div>
                            </div>
                        </div>

                        <!-- Mensaje Principal -->
                        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #cce7ff; border-radius: 8px;">
                            <h2 style="color: #004085; margin: 0 0 10px 0;">🎉 ¡Tu pedido salió de nuestro almacén!</h2>
                            <p style="color: #004085; margin: 0; font-size: 16px;">
                                Ya está en camino hacia tu dirección.
                            </p>
                        </div>

                        <!-- Información de Tracking -->
                        ${data.tracking_number ? `
                            <div style="margin: 20px 0; padding: 20px; background-color: #e8f5e8; border-radius: 8px; text-align: center;">
                                <h3 style="color: #155724; margin-bottom: 15px;">📱 Información de Seguimiento</h3>
                                <div style="background-color: white; padding: 15px; border-radius: 8px; display: inline-block;">
                                    <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Número de Tracking</p>
                                    <p style="margin: 0; font-size: 20px; font-weight: bold; color: #155724; letter-spacing: 1px;">
                                        ${data.tracking_number}
                                    </p>
                                </div>
                                ${data.courier_company ? `
                                    <p style="margin: 15px 0 0 0; color: #155724;">
                                        <strong>Empresa:</strong> ${data.courier_company}
                                    </p>
                                ` : ''}
                            </div>
                        ` : ''}

                        <!-- Fecha Estimada -->
                        ${data.estimated_delivery_date ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; text-align: center;">
                                <h3 style="color: #856404; margin-bottom: 10px;">📅 Llegada Estimada</h3>
                                <p style="color: #856404; margin: 0; font-size: 20px; font-weight: bold;">
                                    ${new Date(data.estimated_delivery_date).toLocaleDateString('es-ES', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            </div>
                        ` : ''}

                        <!-- Dirección de Entrega -->
                        ${data.delivery_location ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #e8f4fd; border-radius: 8px;">
                                <h3 style="color: #2A3190; margin-bottom: 10px;">📍 Dirección de Entrega</h3>
                                <p style="margin: 5px 0; color: #333;">
                                    ${data.delivery_location.address || data.delivery_location.manual_address || 'No especificada'}
                                </p>
                                ${data.delivery_location.city ? `<p style="margin: 5px 0; color: #666;">${data.delivery_location.city}</p>` : ''}
                                ${data.delivery_location.reference ? `<p style="margin: 5px 0; color: #666;"><em>Ref: ${data.delivery_location.reference}</em></p>` : ''}
                            </div>
                        ` : ''}

                        <!-- Notas -->
                        ${data.delivery_notes ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #d4edda; border-radius: 8px;">
                                <h3 style="color: #155724; margin-bottom: 10px;">💬 Información Adicional</h3>
                                <p style="color: #155724; margin: 0;">${data.delivery_notes}</p>
                            </div>
                        ` : ''}

                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; margin: 0;">
                                ¿No estarás en casa? Contáctanos en 
                                <a href="mailto:soporte@bluetec.com" style="color: #2A3190;">soporte@bluetec.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            `
        };
    }

    deliveredTemplate(data) {
        return {
            subject: `📍 ¡Pedido Entregado! #${data.shop_process_id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #28a745; margin: 0;">🎉 ¡Pedido Entregado!</h1>
                            <p style="color: #666; margin: 10px 0 0 0;">Pedido #${data.shop_process_id}</p>
                        </div>

                        <!-- Progress Bar -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="color: #28a745;">✅ Confirmado</span>
                                <span style="color: #28a745;">✅ Preparado</span>
                                <span style="color: #28a745;">✅ En Camino</span>
                                <span style="color: #28a745; font-weight: bold;">📍 Entregado</span>
                            </div>
                            <div style="height: 4px; background-color: #e9ecef; border-radius: 2px; overflow: hidden;">
                                <div style="height: 100%; width: 100%; background-color: #28a745; transition: width 0.3s;"></div>
                            </div>
                        </div>

                        <!-- Mensaje de Éxito -->
                        <div style="text-align: center; margin: 30px 0; padding: 25px; background-color: #d4edda; border-radius: 8px;">
                            <h2 style="color: #155724; margin: 0 0 15px 0;">🎯 ¡Entrega Completada!</h2>
                            <p style="color: #155724; margin: 0; font-size: 16px;">
                                Tu pedido fue entregado exitosamente.
                            </p>
                            ${data.actual_delivery_date ? `
                                <p style="color: #155724; margin: 10px 0 0 0; font-weight: bold;">
                                    Fecha de entrega: ${new Date(data.actual_delivery_date).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            ` : ''}
                        </div>

                        <!-- Resumen del Pedido -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                            <h3 style="color: #2A3190; margin-bottom: 15px;">📦 Resumen de tu Pedido</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Total Pagado:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #28a745;">
                                        ${new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(data.amount)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Productos:</td>
                                    <td style="padding: 8px 0; font-weight: bold;">${data.items?.length || 0} item(s)</td>
                                </tr>
                                ${data.tracking_number ? `
                                    <tr>
                                        <td style="padding: 8px 0; color: #666;">Tracking:</td>
                                        <td style="padding: 8px 0; font-weight: bold;">${data.tracking_number}</td>
                                    </tr>
                                ` : ''}
                            </table>
                        </div>

                        <!-- Calificación -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px; text-align: center;">
                            <h3 style="color: #856404; margin-bottom: 15px;">⭐ ¿Cómo fue tu experiencia?</h3>
                            <p style="color: #856404; margin-bottom: 15px;">
                                Tu opinión nos ayuda a mejorar nuestro servicio
                            </p>
                            <a href="${process.env.FRONTEND_URL}/calificar-pedido/${data.shop_process_id}" 
                               style="background-color: #ffc107; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                                Calificar Pedido
                            </a>
                        </div>

                        <!-- Soporte Post-Venta -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #e8f4fd; border-radius: 8px;">
                            <h3 style="color: #2A3190; margin-bottom: 10px;">🛠️ Soporte Post-Venta</h3>
                            <p style="color: #2A3190; margin: 0;">
                                Si tienes algún problema con tu pedido o necesitas soporte técnico, 
                                estamos aquí para ayudarte.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; margin: 0 0 10px 0;">
                                ¡Gracias por elegir BlueTec! 🙏
                            </p>
                            <p style="color: #666; margin: 0;">
                                Contáctanos: <a href="mailto:soporte@bluetec.com" style="color: #2A3190;">soporte@bluetec.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            `
        };
    }

    problemTemplate(data) {
        return {
            subject: `⚠️ Atención Requerida - Pedido #${data.shop_process_id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #dc3545; margin: 0;">⚠️ Atención Requerida</h1>
                            <p style="color: #666; margin: 10px 0 0 0;">Pedido #${data.shop_process_id}</p>
                        </div>

                        <!-- Mensaje Principal -->
                        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8d7da; border-radius: 8px;">
                            <h2 style="color: #721c24; margin: 0 0 10px 0;">🚨 Hay un inconveniente con tu pedido</h2>
                            <p style="color: #721c24; margin: 0; font-size: 16px;">
                                Nuestro equipo está trabajando para resolverlo.
                            </p>
                        </div>

                        <!-- Detalles del Problema -->
                        ${data.delivery_notes ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                                <h3 style="color: #856404; margin-bottom: 10px;">📋 Detalles del Inconveniente</h3>
                                <p style="color: #856404; margin: 0;">${data.delivery_notes}</p>
                            </div>
                        ` : ''}

                        <!-- Acción Requerida -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #cce7ff; border-radius: 8px; text-align: center;">
                            <h3 style="color: #004085; margin-bottom: 15px;">📞 Necesitamos tu Ayuda</h3>
                            <p style="color: #004085; margin-bottom: 15px;">
                                Por favor contáctanos para resolver este inconveniente lo antes posible.
                            </p>
                            <div style="margin-top: 15px;">
                                <a href="mailto:soporte@bluetec.com?subject=Problema con Pedido ${data.shop_process_id}" 
                                   style="background-color: #007bff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                                    📧 Enviar Email
                                </a>
                                <a href="tel:+595123456789" 
                                   style="background-color: #28a745; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                                    📞 Llamar Ahora
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; margin: 0;">
                                Lamentamos las molestias. Estamos comprometidos a resolver esto rápidamente.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };
    }

    defaultTemplate(data) {
        return {
            subject: `Actualización de Pedido #${data.shop_process_id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2A3190;">Actualización de tu Pedido</h1>
                    <p>Hola ${data.customer_info?.name || 'Cliente'},</p>
                    <p>Tu pedido #${data.shop_process_id} ha sido actualizado.</p>
                    <p>Estado actual: ${data.delivery_status}</p>
                    <p>¡Gracias por elegir BlueTec!</p>
                </div>
            `
        };
    }

    // ✅ MÉTODO PRINCIPAL PARA ENVIAR EMAILS
    async sendDeliveryUpdateEmail(transactionData, newStatus) {
        try {
            const customerEmail = transactionData.customer_info?.email;
            
            if (!customerEmail) {
                console.log(`❌ No hay email para transacción ${transactionData.shop_process_id}`);
                return { success: false, error: 'No email provided' };
            }

            const emailContent = this.getEmailTemplate(newStatus, transactionData);
            
            const mailOptions = {
                from: `"BlueTec" <${process.env.EMAIL_USER}>`,
                to: customerEmail,
                subject: emailContent.subject,
                html: emailContent.html
            };

            console.log(`📧 Enviando email de ${newStatus} a ${customerEmail}`);
            
            const result = await this.transporter.sendMail(mailOptions);
            
            console.log(`✅ Email enviado exitosamente: ${result.messageId}`);
            
            return { 
                success: true, 
                messageId: result.messageId,
                recipient: customerEmail 
            };

        } catch (error) {
            console.error(`❌ Error enviando email:`, error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // ✅ MÉTODO PARA ENVIAR EMAILS MASIVOS
    async sendBulkDeliveryEmails(transactions, status) {
        const results = [];
        
        for (const transaction of transactions) {
            const result = await this.sendDeliveryUpdateEmail(transaction, status);
            results.push({
                shop_process_id: transaction.shop_process_id,
                ...result
            });
            
            // Pequeña pausa para no saturar el servidor de email
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }

    // ✅ VERIFICAR CONFIGURACIÓN DE EMAIL
    async verifyEmailConfig() {
        try {
            await this.transporter.verify();
            console.log('✅ Configuración de email verificada correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error en configuración de email:', error);
            return false;
        }
    }
}

module.exports = new EmailService();