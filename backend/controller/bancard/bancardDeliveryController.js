// backend/controller/bancard/bancardDeliveryController.js - CONTROLADOR PARA GESTIÓN DE DELIVERY

const BancardTransactionModel = require('../../models/bancardTransactionModel');
const uploadProductPermission = require('../../helpers/permission');
const emailService = require('../../services/emailService');

/**
 * ✅ ACTUALIZAR ESTADO DE DELIVERY (PARA ADMIN)
 */
const updateDeliveryStatusController = async (req, res) => {
    try {
        console.log("🚚 === ACTUALIZANDO ESTADO DE DELIVERY ===");
        
        // ✅ VERIFICAR PERMISOS DE ADMIN
        const hasPermission = await uploadProductPermission(req.userId);
        if (!hasPermission) {
            return res.status(403).json({
                message: "Permiso denegado - Solo administradores",
                success: false,
                error: true
            });
        }

        const { transactionId } = req.params;
        const { 
            delivery_status, 
            delivery_notes, 
            estimated_delivery_date,
            tracking_number,
            courier_company,
            notify_customer = true 
        } = req.body;

        console.log("📋 Datos recibidos:", {
            transactionId,
            delivery_status,
            delivery_notes,
            estimated_delivery_date,
            tracking_number,
            notify_customer
        });

        // ✅ VALIDAR ESTADO
        const validStatuses = ['payment_confirmed', 'preparing_order', 'in_transit', 'delivered', 'problem'];
        if (!validStatuses.includes(delivery_status)) {
            return res.status(400).json({
                message: "Estado de delivery inválido",
                success: false,
                error: true,
                validStatuses
            });
        }

        // ✅ BUSCAR TRANSACCIÓN
        const transaction = await BancardTransactionModel.findById(transactionId)
            .populate('created_by', 'name email phone')
            .populate('delivery_updated_by', 'name email');

        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR QUE ESTÉ APROBADA
        if (transaction.status !== 'approved') {
            return res.status(400).json({
                message: "Solo se puede actualizar delivery de transacciones aprobadas",
                success: false,
                error: true,
                currentStatus: transaction.status
            });
        }

        // ✅ PREPARAR DATOS DE ACTUALIZACIÓN
        const updateData = {
            delivery_status,
            delivery_updated_by: req.userId,
            delivery_updated_at: new Date()
        };

        if (delivery_notes) updateData.delivery_notes = delivery_notes;
        if (estimated_delivery_date) updateData.estimated_delivery_date = new Date(estimated_delivery_date);
        if (tracking_number) updateData.tracking_number = tracking_number;
        if (courier_company) updateData.courier_company = courier_company;
        
        // ✅ Si se marca como entregado, guardar fecha real
        if (delivery_status === 'delivered') {
            updateData.actual_delivery_date = new Date();
        }

        console.log("🔄 Actualizando transacción...");
        
        // ✅ ACTUALIZAR TRANSACCIÓN
        const updatedTransaction = await BancardTransactionModel.findByIdAndUpdate(
            transactionId, 
            updateData, 
            { new: true }
        ).populate('created_by', 'name email phone')
         .populate('delivery_updated_by', 'name email');

        console.log("✅ Transacción actualizada:", {
            id: updatedTransaction._id,
            shop_process_id: updatedTransaction.shop_process_id,
            old_status: transaction.delivery_status,
            new_status: updatedTransaction.delivery_status
        });

        // ✅ ENVIAR EMAIL DE NOTIFICACIÓN
        let emailResult = null;
        if (notify_customer) {
            try {
                console.log("📧 Enviando notificación por email...");
                emailResult = await emailService.sendDeliveryUpdateEmail(updatedTransaction, delivery_status);
                
                // ✅ GUARDAR REGISTRO DE NOTIFICACIÓN
                updatedTransaction.notifications_sent.push({
                    type: 'email',
                    status: delivery_status,
                    sent_at: new Date(),
                    success: emailResult.success,
                    error_message: emailResult.error || null
                });
                
                await updatedTransaction.save();
                
                console.log("📧 Resultado del email:", emailResult);
            } catch (emailError) {
                console.error("❌ Error enviando email:", emailError);
                emailResult = { success: false, error: emailError.message };
            }
        }

        // ✅ PREPARAR RESPUESTA
        const responseData = {
            transaction: {
                _id: updatedTransaction._id,
                shop_process_id: updatedTransaction.shop_process_id,
                delivery_status: updatedTransaction.delivery_status,
                delivery_notes: updatedTransaction.delivery_notes,
                estimated_delivery_date: updatedTransaction.estimated_delivery_date,
                actual_delivery_date: updatedTransaction.actual_delivery_date,
                tracking_number: updatedTransaction.tracking_number,
                courier_company: updatedTransaction.courier_company,
                delivery_timeline: updatedTransaction.delivery_timeline,
                delivery_progress: updatedTransaction.getDeliveryProgress()
            },
            previous_status: transaction.delivery_status,
            updated_by: {
                id: req.userId,
                name: updatedTransaction.delivery_updated_by?.name
            },
            email_notification: emailResult
        };

        res.json({
            message: `Estado de delivery actualizado a: ${delivery_status}`,
            success: true,
            error: false,
            data: responseData
        });

    } catch (error) {
        console.error("❌ Error actualizando delivery status:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ OBTENER PROGRESO DE DELIVERY PARA USUARIO
 */
const getDeliveryProgressController = async (req, res) => {
    try {
        console.log("📊 === OBTENIENDO PROGRESO DE DELIVERY ===");
        
        const { transactionId } = req.params;

        // ✅ BUSCAR TRANSACCIÓN
        const transaction = await BancardTransactionModel.findById(transactionId)
            .populate('created_by', 'name email')
            .populate('delivery_updated_by', 'name email')
            .lean();

        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR PERMISOS
        const hasAdminPermission = await uploadProductPermission(req.userId);
        const isOwner = req.userId && (
            transaction.created_by?._id?.toString() === req.userId ||
            transaction.user_bancard_id === req.bancardUserId
        );

        if (!hasAdminPermission && !isOwner) {
            return res.status(403).json({
                message: "No tienes permisos para ver esta transacción",
                success: false,
                error: true
            });
        }

        // ✅ CALCULAR PROGRESO
        const statuses = ['payment_confirmed', 'preparing_order', 'in_transit', 'delivered'];
        const currentIndex = statuses.indexOf(transaction.delivery_status);
        const progress = Math.round(((currentIndex + 1) / statuses.length) * 100);

        // ✅ PREPARAR TIMELINE CON ÍCONOS Y DESCRIPCIONES
        const statusDescriptions = {
            payment_confirmed: {
                icon: '✅',
                title: 'Pago Confirmado',
                description: 'Tu pago ha sido procesado exitosamente'
            },
            preparing_order: {
                icon: '📦',
                title: 'Preparando Pedido',
                description: 'Estamos empacando tus productos con cuidado'
            },
            in_transit: {
                icon: '🚚',
                title: 'En Camino',
                description: 'Tu pedido está en camino hacia tu dirección'
            },
            delivered: {
                icon: '📍',
                title: 'Entregado',
                description: 'Tu pedido ha sido entregado exitosamente'
            },
            problem: {
                icon: '⚠️',
                title: 'Requiere Atención',
                description: 'Hay un inconveniente que necesita resolución'
            }
        };

        // ✅ TIMELINE MEJORADO
        const enrichedTimeline = transaction.delivery_timeline?.map(entry => ({
            ...entry,
            ...statusDescriptions[entry.status],
            formatted_date: new Date(entry.timestamp).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        })) || [];

        // ✅ PRÓXIMO PASO ESPERADO
        let nextStep = null;
        if (currentIndex >= 0 && currentIndex < statuses.length - 1) {
            const nextStatus = statuses[currentIndex + 1];
            nextStep = {
                status: nextStatus,
                ...statusDescriptions[nextStatus]
            };
        }

        const responseData = {
            shop_process_id: transaction.shop_process_id,
            current_status: transaction.delivery_status,
            current_description: statusDescriptions[transaction.delivery_status],
            progress_percentage: progress,
            estimated_delivery_date: transaction.estimated_delivery_date,
            actual_delivery_date: transaction.actual_delivery_date,
            tracking_number: transaction.tracking_number,
            courier_company: transaction.courier_company,
            delivery_notes: transaction.delivery_notes,
            timeline: enrichedTimeline,
            next_step: nextStep,
            delivery_location: transaction.delivery_location,
            customer_info: transaction.customer_info,
            last_updated: transaction.delivery_updated_at,
            can_rate: transaction.delivery_status === 'delivered' && !transaction.customer_satisfaction?.rating
        };

        res.json({
            message: "Progreso de delivery obtenido",
            success: true,
            error: false,
            data: responseData
        });

    } catch (error) {
        console.error("❌ Error obteniendo progreso:", error);
        res.status(500).json({
            message: "Error al obtener progreso de delivery",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ OBTENER ESTADÍSTICAS DE DELIVERY PARA ADMIN
 */
const getDeliveryStatsController = async (req, res) => {
    try {
        console.log("📊 === OBTENIENDO ESTADÍSTICAS DE DELIVERY ===");
        
        const hasPermission = await uploadProductPermission(req.userId);
        if (!hasPermission) {
            return res.status(403).json({
                message: "Permiso denegado",
                success: false,
                error: true
            });
        }

        const { startDate, endDate } = req.query;
        
        // ✅ CONSTRUIR FILTRO DE FECHAS
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // ✅ AGREGAR FILTRO PARA TRANSACCIONES APROBADAS
        const baseFilter = { 
            status: 'approved',
            ...dateFilter 
        };

        // ✅ ESTADÍSTICAS POR ESTADO
        const statusStats = await BancardTransactionModel.aggregate([
            { $match: baseFilter },
            { $group: {
                _id: '$delivery_status',
                count: { $sum: 1 },
                total_amount: { $sum: '$amount' },
                avg_amount: { $avg: '$amount' }
            }},
            { $sort: { count: -1 } }
        ]);

        // ✅ ESTADÍSTICAS GENERALES
        const generalStats = await BancardTransactionModel.aggregate([
            { $match: baseFilter },
            { $group: {
                _id: null,
                total_transactions: { $sum: 1 },
                total_revenue: { $sum: '$amount' },
                avg_order_value: { $avg: '$amount' },
                delivered_count: { 
                    $sum: { $cond: [{ $eq: ['$delivery_status', 'delivered'] }, 1, 0] }
                },
                in_progress_count: { 
                    $sum: { $cond: [{ $in: ['$delivery_status', ['preparing_order', 'in_transit']] }, 1, 0] }
                },
                problem_count: { 
                    $sum: { $cond: [{ $eq: ['$delivery_status', 'problem'] }, 1, 0] }
                }
            }}
        ]);

        // ✅ TIEMPO PROMEDIO DE ENTREGA
        const deliveryTimeStats = await BancardTransactionModel.aggregate([
            { 
                $match: { 
                    ...baseFilter,
                    delivery_status: 'delivered',
                    actual_delivery_date: { $exists: true }
                }
            },
            {
                $project: {
                    delivery_days: {
                        $divide: [
                            { $subtract: ['$actual_delivery_date', '$createdAt'] },
                            86400000 // Convertir ms a días
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avg_delivery_days: { $avg: '$delivery_days' },
                    min_delivery_days: { $min: '$delivery_days' },
                    max_delivery_days: { $max: '$delivery_days' }
                }
            }
        ]);

        // ✅ ENTREGAS POR DÍA (ÚLTIMOS 30 DÍAS)
        const dailyDeliveries = await BancardTransactionModel.aggregate([
            {
                $match: {
                    delivery_status: 'delivered',
                    actual_delivery_date: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$actual_delivery_date' }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // ✅ PRODUCTOS MÁS VENDIDOS
        const topProducts = await BancardTransactionModel.aggregate([
            { $match: baseFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    total_sold: { $sum: '$items.quantity' },
                    total_revenue: { $sum: '$items.total' },
                    order_count: { $sum: 1 }
                }
            },
            { $sort: { total_sold: -1 } },
            { $limit: 10 }
        ]);

        const responseData = {
            summary: generalStats[0] || {
                total_transactions: 0,
                total_revenue: 0,
                avg_order_value: 0,
                delivered_count: 0,
                in_progress_count: 0,
                problem_count: 0
            },
            delivery_performance: {
                ...(deliveryTimeStats[0] || {
                    avg_delivery_days: 0,
                    min_delivery_days: 0,
                    max_delivery_days: 0
                }),
                success_rate: generalStats[0] ? 
                    Math.round((generalStats[0].delivered_count / generalStats[0].total_transactions) * 100) : 0
            },
            status_breakdown: statusStats,
            daily_deliveries: dailyDeliveries,
            top_products: topProducts,
            generated_at: new Date().toISOString()
        };

        res.json({
            message: "Estadísticas de delivery obtenidas",
            success: true,
            error: false,
            data: responseData
        });

    } catch (error) {
        console.error("❌ Error obteniendo estadísticas:", error);
        res.status(500).json({
            message: "Error al obtener estadísticas de delivery",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ AGREGAR INTENTO DE ENTREGA
 */
const addDeliveryAttemptController = async (req, res) => {
    try {
        console.log("🚛 === AGREGANDO INTENTO DE ENTREGA ===");
        
        const hasPermission = await uploadProductPermission(req.userId);
        if (!hasPermission) {
            return res.status(403).json({
                message: "Permiso denegado",
                success: false,
                error: true
            });
        }

        const { transactionId } = req.params;
        const { status, notes, next_attempt_date } = req.body;

        const validAttemptStatuses = ['successful', 'failed', 'customer_not_available', 'address_issue'];
        if (!validAttemptStatuses.includes(status)) {
            return res.status(400).json({
                message: "Estado de intento inválido",
                success: false,
                error: true,
                validStatuses: validAttemptStatuses
            });
        }

        const transaction = await BancardTransactionModel.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                success: false,
                error: true
            });
        }

        // ✅ AGREGAR INTENTO
        await transaction.addDeliveryAttempt(status, notes, next_attempt_date);

        // ✅ SI ES EXITOSO, MARCAR COMO ENTREGADO
        if (status === 'successful') {
            transaction.delivery_status = 'delivered';
            transaction.actual_delivery_date = new Date();
            await transaction.save();

            // ✅ ENVIAR EMAIL DE ENTREGADO
            try {
                await emailService.sendDeliveryUpdateEmail(transaction, 'delivered');
            } catch (emailError) {
                console.error("❌ Error enviando email de entregado:", emailError);
            }
        }

        res.json({
            message: "Intento de entrega registrado",
            success: true,
            error: false,
            data: {
                attempt_count: transaction.delivery_attempt_count,
                last_attempt: transaction.delivery_attempts[transaction.delivery_attempts.length - 1],
                transaction_status: transaction.delivery_status
            }
        });

    } catch (error) {
        console.error("❌ Error agregando intento:", error);
        res.status(500).json({
            message: "Error al registrar intento de entrega",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ CALIFICAR PEDIDO (PARA USUARIO)
 */
const rateDeliveryController = async (req, res) => {
    try {
        console.log("⭐ === CALIFICANDO PEDIDO ===");
        
        const { transactionId } = req.params;
        const { rating, feedback } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "La calificación debe ser entre 1 y 5 estrellas",
                success: false,
                error: true
            });
        }

        const transaction = await BancardTransactionModel.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR QUE ESTÉ ENTREGADO
        if (transaction.delivery_status !== 'delivered') {
            return res.status(400).json({
                message: "Solo se pueden calificar pedidos entregados",
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR QUE NO HAYA SIDO CALIFICADO
        if (transaction.customer_satisfaction?.rating) {
            return res.status(400).json({
                message: "Este pedido ya fue calificado",
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR PERMISOS
        const isOwner = req.userId && (
            transaction.created_by?.toString() === req.userId ||
            transaction.user_bancard_id === req.bancardUserId
        );

        if (!isOwner) {
            return res.status(403).json({
                message: "Solo puedes calificar tus propios pedidos",
                success: false,
                error: true
            });
        }

        // ✅ GUARDAR CALIFICACIÓN
        transaction.customer_satisfaction = {
            rating: parseInt(rating),
            feedback: feedback || '',
            submitted_at: new Date()
        };

        await transaction.save();

        console.log("✅ Calificación guardada:", {
            shop_process_id: transaction.shop_process_id,
            rating,
            feedback: feedback ? 'Con comentario' : 'Sin comentario'
        });

        res.json({
            message: "¡Gracias por tu calificación!",
            success: true,
            error: false,
            data: {
                rating: transaction.customer_satisfaction.rating,
                feedback: transaction.customer_satisfaction.feedback,
                submitted_at: transaction.customer_satisfaction.submitted_at
            }
        });

    } catch (error) {
        console.error("❌ Error en calificación:", error);
        res.status(500).json({
            message: "Error al guardar calificación",
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ ENVIAR NOTIFICACIÓN MANUAL
 */
const sendManualNotificationController = async (req, res) => {
    try {
        console.log("📧 === ENVIANDO NOTIFICACIÓN MANUAL ===");
        
        const hasPermission = await uploadProductPermission(req.userId);
        if (!hasPermission) {
            return res.status(403).json({
                message: "Permiso denegado",
                success: false,
                error: true
            });
        }

        const { transactionId } = req.params;
        const { message, subject } = req.body;

        const transaction = await BancardTransactionModel.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                message: "Transacción no encontrada",
                success: false,
                error: true
            });
        }

        const customerEmail = transaction.customer_info?.email;
        if (!customerEmail) {
            return res.status(400).json({
                message: "No hay email del cliente",
                success: false,
                error: true
            });
        }

        // ✅ ENVIAR EMAIL PERSONALIZADO
        const customEmailContent = {
            subject: subject || `Actualización de tu Pedido #${transaction.shop_process_id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #2A3190;">Actualización de tu Pedido</h1>
                        <p>Hola ${transaction.customer_info?.name || 'Cliente'},</p>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            ${message}
                        </div>
                        <p><strong>Pedido:</strong> #${transaction.shop_process_id}</p>
                        <p><strong>Estado actual:</strong> ${transaction.delivery_status}</p>
                        <hr style="margin: 20px 0;">
                        <p style="color: #666;">
                            Si tienes preguntas, contáctanos en 
                            <a href="mailto:soporte@bluetec.com">soporte@bluetec.com</a>
                        </p>
                        <p style="color: #999; font-size: 12px;">BlueTec - Tu tienda tecnológica de confianza</p>
                    </div>
                </div>
            `
        };

        const emailResult = await emailService.transporter.sendMail({
            from: `"BlueTec" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: customEmailContent.subject,
            html: customEmailContent.html
        });

        // ✅ REGISTRAR NOTIFICACIÓN
        transaction.notifications_sent.push({
            type: 'email',
            status: 'manual_notification',
            sent_at: new Date(),
            success: true
        });
        await transaction.save();

        res.json({
            message: "Notificación enviada exitosamente",
            success: true,
            error: false,
            data: {
                recipient: customerEmail,
                messageId: emailResult.messageId,
                subject: customEmailContent.subject
            }
        });

    } catch (error) {
        console.error("❌ Error enviando notificación:", error);
        res.status(500).json({
            message: "Error al enviar notificación",
            success: false,
            error: true,
            details: error.message
        });
    }
};

module.exports = {
    updateDeliveryStatusController,
    getDeliveryProgressController,
    getDeliveryStatsController,
    addDeliveryAttemptController,
    rateDeliveryController,
    sendManualNotificationController
};