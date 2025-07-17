const OrderModel = require('../../models/orderModel');
const BankTransferModel = require('../../models/bankTransferModel');
const userModel = require('../../models/userModel');
const BancardTransactionModel = require('../../models/bancardTransactionModel');

/**
 * ✅ CREAR PEDIDO UNIFICADO
 */
const createOrderController = async (req, res) => {
    try {
        console.log('📦 === CREANDO NUEVO PEDIDO ===');
        
        const {
            customer_info,
            delivery_location,
            items,
            payment_method,
            order_notes,
            session_id,
            device_type
        } = req.body;

        // ✅ VALIDACIONES BÁSICAS
        if (!customer_info || !customer_info.name || !customer_info.email || !customer_info.phone) {
            return res.status(400).json({
                message: 'Información del cliente incompleta',
                success: false,
                error: true
            });
        }

        if (!delivery_location || !delivery_location.lat || !delivery_location.lng) {
            return res.status(400).json({
                message: 'Ubicación de entrega es requerida',
                success: false,
                error: true
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Productos son requeridos',
                success: false,
                error: true
            });
        }

        if (!payment_method || !['bancard', 'bank_transfer', 'quote'].includes(payment_method)) {
            return res.status(400).json({
                message: 'Método de pago inválido',
                success: false,
                error: true
            });
        }

        // ✅ CALCULAR MONTOS
        const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
        const taxAmount = subtotal * 0.1; // 10% IVA
        const totalAmount = subtotal + taxAmount;

        // ✅ PREPARAR DATOS DEL PEDIDO
        const orderData = {
            user_id: req.isAuthenticated ? req.userId : null,
            customer_info: {
                name: customer_info.name.trim(),
                email: customer_info.email.trim().toLowerCase(),
                phone: customer_info.phone.trim(),
                address: customer_info.address ? customer_info.address.trim() : ''
            },
            delivery_location: {
                lat: parseFloat(delivery_location.lat),
                lng: parseFloat(delivery_location.lng),
                address: delivery_location.address || '',
                googleMapsUrl: delivery_location.googleMapsUrl || `https://www.google.com/maps?q=${delivery_location.lat},${delivery_location.lng}`
            },
            items: items.map(item => ({
                product_id: item.product_id || item.productId,
                name: item.name,
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(item.unit_price || item.unitPrice),
                total_price: parseFloat(item.total_price || item.total),
                category: item.category || '',
                brand: item.brand || '',
                image_url: item.image_url || item.imageUrl || ''
            })),
            payment_method,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            order_notes: order_notes || '',
            session_id: session_id || req.sessionId,
            user_agent: req.get('User-Agent') || '',
            ip_address: req.ip || req.connection.remoteAddress || '',
            device_type: device_type || 'desktop'
        };

        // ✅ CREAR PEDIDO
        const newOrder = new OrderModel(orderData);
        const savedOrder = await newOrder.save();

        console.log('✅ Pedido creado exitosamente:', savedOrder.order_id);

        // ✅ RESPUESTA DIFERENTE SEGÚN MÉTODO DE PAGO
        let responseData = {
            order: savedOrder,
            next_step: null,
            payment_instructions: null
        };

        if (payment_method === 'bank_transfer') {
            responseData.next_step = 'bank_transfer_instructions';
            responseData.payment_instructions = {
                bank_name: 'BANCO CONTINENTAL',
                account_type: 'CTA CTE Gs',
                account_number: '66-214830-07',
                account_holder: 'COMPULANDIA SRL',
                amount: totalAmount,
                reference: savedOrder.order_id
            };
        } else if (payment_method === 'bancard') {
            responseData.next_step = 'bancard_payment';
        } else if (payment_method === 'quote') {
            responseData.next_step = 'quote_generated';
        }

        res.status(201).json({
            message: 'Pedido creado exitosamente',
            success: true,
            error: false,
            data: responseData
        });

    } catch (error) {
        console.error('❌ Error creando pedido:', error);
        res.status(500).json({
            message: 'Error al crear pedido',
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ OBTENER PEDIDO POR ID
 */
const getOrderByIdController = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        console.log('🔍 === OBTENIENDO PEDIDO ===');
        console.log('📋 Order ID:', orderId);

        const order = await OrderModel.findByOrderId(orderId);
        
        if (!order) {
            return res.status(404).json({
                message: 'Pedido no encontrado',
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR PERMISOS
        if (req.userRole !== 'ADMIN' && order.user_id && order.user_id.toString() !== req.userId) {
            return res.status(403).json({
                message: 'No tienes permisos para ver este pedido',
                success: false,
                error: true
            });
        }

        console.log('✅ Pedido encontrado:', order.order_id);

        res.json({
            message: 'Pedido obtenido exitosamente',
            success: true,
            error: false,
            data: order
        });

    } catch (error) {
        console.error('❌ Error obteniendo pedido:', error);
        res.status(500).json({
            message: 'Error al obtener pedido',
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ OBTENER PEDIDOS DEL USUARIO
 */
const getUserOrdersController = async (req, res) => {
    try {
        console.log('📋 === OBTENIENDO PEDIDOS DEL USUARIO ===');
        console.log('👤 Usuario:', req.userId);

        if (!req.isAuthenticated) {
            return res.status(401).json({
                message: 'Debes iniciar sesión para ver tus pedidos',
                success: false,
                error: true
            });
        }

        const {
            page = 1,
            limit = 10,
            status,
            payment_method,
            payment_status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // ✅ FILTROS
        const filters = {};
        if (status) filters.status = status;
        if (payment_method) filters.payment_method = payment_method;
        if (payment_status) filters.payment_status = payment_status;

        // ✅ OBTENER PEDIDOS
        const orders = await OrderModel.findUserOrders(req.userId, filters);

        // ✅ PAGINACIÓN
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedOrders = orders.slice(startIndex, endIndex);

        // ✅ ORDENAMIENTO
        const sortedOrders = paginatedOrders.sort((a, b) => {
            const multiplier = sortOrder === 'asc' ? 1 : -1;
            return multiplier * (a[sortBy] - b[sortBy]);
        });

        console.log(`✅ Encontrados ${orders.length} pedidos para el usuario`);

        res.json({
            message: 'Pedidos obtenidos exitosamente',
            success: true,
            error: false,
            data: {
                orders: sortedOrders,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(orders.length / limit),
                    total_items: orders.length,
                    items_per_page: parseInt(limit),
                    has_next: endIndex < orders.length,
                    has_prev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo pedidos del usuario:', error);
        res.status(500).json({
            message: 'Error al obtener pedidos',
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ ACTUALIZAR ESTADO DEL PEDIDO
 */
const updateOrderStatusController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;

        console.log('🔄 === ACTUALIZANDO ESTADO DEL PEDIDO ===');
        console.log('📋 Order ID:', orderId);
        console.log('📊 Nuevo estado:', status);

        // ✅ VALIDAR ESTADO
        const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Estado inválido',
                success: false,
                error: true
            });
        }

        // ✅ BUSCAR PEDIDO
        const order = await OrderModel.findByOrderId(orderId);
        if (!order) {
            return res.status(404).json({
                message: 'Pedido no encontrado',
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR PERMISOS
        if (req.userRole !== 'ADMIN' && order.user_id && order.user_id.toString() !== req.userId) {
            return res.status(403).json({
                message: 'No tienes permisos para actualizar este pedido',
                success: false,
                error: true
            });
        }

        // ✅ ACTUALIZAR ESTADO
        await order.addStatusHistory(status, req.userId, notes);

        console.log('✅ Estado actualizado exitosamente');

        res.json({
            message: 'Estado del pedido actualizado exitosamente',
            success: true,
            error: false,
            data: order
        });

    } catch (error) {
        console.error('❌ Error actualizando estado del pedido:', error);
        res.status(500).json({
            message: 'Error al actualizar estado del pedido',
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ CANCELAR PEDIDO
 */
const cancelOrderController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        console.log('❌ === CANCELANDO PEDIDO ===');
        console.log('📋 Order ID:', orderId);

        // ✅ BUSCAR PEDIDO
        const order = await OrderModel.findByOrderId(orderId);
        if (!order) {
            return res.status(404).json({
                message: 'Pedido no encontrado',
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR PERMISOS
        if (req.userRole !== 'ADMIN' && order.user_id && order.user_id.toString() !== req.userId) {
            return res.status(403).json({
                message: 'No tienes permisos para cancelar este pedido',
                success: false,
                error: true
            });
        }

        // ✅ VERIFICAR SI SE PUEDE CANCELAR
        if (order.status === 'completed') {
            return res.status(400).json({
                message: 'No se puede cancelar un pedido completado',
                success: false,
                error: true
            });
        }

        // ✅ CANCELAR PEDIDO
        await order.cancel(req.userId, reason);

        console.log('✅ Pedido cancelado exitosamente');

        res.json({
            message: 'Pedido cancelado exitosamente',
            success: true,
            error: false,
            data: order
        });

    } catch (error) {
        console.error('❌ Error cancelando pedido:', error);
        res.status(500).json({
            message: 'Error al cancelar pedido',
            success: false,
            error: true,
            details: error.message
        });
    }
};

/**
 * ✅ OBTENER ESTADÍSTICAS DE PEDIDOS (ADMIN)
 */
const getOrderStatsController = async (req, res) => {
    try {
        console.log('📊 === OBTENIENDO ESTADÍSTICAS DE PEDIDOS ===');

        // ✅ VERIFICAR PERMISOS DE ADMIN
        if (req.userRole !== 'ADMIN') {
            return res.status(403).json({
                message: 'No tienes permisos para ver estadísticas',
                success: false,
                error: true
            });
        }

        const { startDate, endDate } = req.query;

        // ✅ OBTENER ESTADÍSTICAS
        const stats = await OrderModel.getOrderStats(startDate, endDate);

        // ✅ ESTADÍSTICAS ADICIONALES
        const totalOrders = await OrderModel.countDocuments();
        const pendingOrders = await OrderModel.countDocuments({ status: 'pending' });
        const completedOrders = await OrderModel.countDocuments({ status: 'completed' });
        const cancelledOrders = await OrderModel.countDocuments({ status: 'cancelled' });

        const responseData = {
            by_payment_method: stats,
            overall_stats: {
                total_orders: totalOrders,
                pending_orders: pendingOrders,
                completed_orders: completedOrders,
                cancelled_orders: cancelledOrders,
                completion_rate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
            }
        };

        console.log('✅ Estadísticas obtenidas exitosamente');

        res.json({
            message: 'Estadísticas obtenidas exitosamente',
            success: true,
            error: false,
            data: responseData
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            message: 'Error al obtener estadísticas',
            success: false,
            error: true,
            details: error.message
        });
    }
};

module.exports = {
    createOrderController,
    getOrderByIdController,
    getUserOrdersController,
    updateOrderStatusController,
    cancelOrderController,
    getOrderStatsController
};