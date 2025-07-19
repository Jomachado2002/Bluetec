    // backend/controller/bankTransfer/bankTransferController.js - CONTROLADOR DE TRANSFERENCIAS
    const BankTransferModel = require('../../models/bankTransferModel');
    const OrderModel = require('../../models/orderModel');


    /**
     * ✅ CREAR TRANSFERENCIA BANCARIA
     */
    const createBankTransferController = async (req, res) => {
        try {
            const { orderId } = req.params;
            const { customer_transfer_info } = req.body;

            console.log('💳 === CREANDO TRANSFERENCIA BANCARIA ===');
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

            // ✅ VERIFICAR QUE EL MÉTODO DE PAGO ES TRANSFERENCIA
            if (order.payment_method !== 'bank_transfer') {
                return res.status(400).json({
                    message: 'Este pedido no es por transferencia bancaria',
                    success: false,
                    error: true
                });
            }

            // ✅ VERIFICAR SI YA EXISTE TRANSFERENCIA
            const existingTransfer = await BankTransferModel.findOne({ order_id: order._id });
            if (existingTransfer) {
                return res.status(400).json({
                    message: 'Ya existe una transferencia para este pedido',
                    success: false,
                    error: true,
                    data: existingTransfer
                });
            }

            // ✅ CREAR TRANSFERENCIA
            const transferData = {
                order_id: order._id,
                customer_transfer_info: {
                    transfer_amount: order.total_amount,
                    ...customer_transfer_info
                },
                audit_info: {
                    ip_address: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('User-Agent'),
                    session_id: req.sessionId,
                    device_type: req.body.device_type || 'desktop'
                }
            };

            const newTransfer = new BankTransferModel(transferData);
            const savedTransfer = await newTransfer.save();

            // ✅ ACTUALIZAR PEDIDO
            order.bank_transfer_id = savedTransfer._id;
            await order.save();

            console.log('✅ Transferencia creada exitosamente:', savedTransfer.transfer_id);

            res.status(201).json({
                message: 'Transferencia creada exitosamente',
                success: true,
                error: false,
                data: {
                    transfer: savedTransfer,
                    bank_details: savedTransfer.bank_details,
                    instructions: {
                        step1: 'Realiza la transferencia a la cuenta bancaria indicada',
                        step2: 'Sube el comprobante de transferencia',
                        step3: 'Espera la verificación del administrador',
                        step4: 'Recibirás confirmación por email/WhatsApp'
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error creando transferencia:', error);
            res.status(500).json({
                message: 'Error al crear transferencia',
                success: false,
                error: true,
                details: error.message
            });
        }
    };

    /**
     * ✅ SUBIR COMPROBANTE DE TRANSFERENCIA
     */
    const uploadTransferProofController = async (req, res) => {
        try {
            const { transferId } = req.params;
            const { 
                proof_url, 
                file_name, 
                file_size, 
                file_type,
                reference_number, 
                transfer_date, 
                customer_bank, 
                customer_account, 
                transfer_notes,
                order_id 
            } = req.body;

            console.log('📤 === PROCESANDO COMPROBANTE DESDE FIREBASE ===');
            console.log('💳 Transfer ID:', transferId);
            console.log('🔗 Proof URL:', proof_url);

            // ✅ VALIDAR QUE SE RECIBIÓ LA URL
            if (!proof_url) {
                return res.status(400).json({
                    message: 'URL del comprobante es requerida',
                    success: false,
                    error: true
                });
            }

            // ✅ VALIDAR URL DE FIREBASE
            if (!proof_url.includes('firebasestorage.googleapis.com')) {
                return res.status(400).json({
                    message: 'URL del comprobante no válida',
                    success: false,
                    error: true
                });
            }

            // ✅ BUSCAR O CREAR TRANSFERENCIA
            let transfer = await BankTransferModel.findOne({ transfer_id: transferId });
            
            if (!transfer) {
                // Buscar pedido para crear transferencia
                const order = await OrderModel.findOne({ order_id: order_id });
                if (!order) {
                    return res.status(404).json({
                        message: 'Pedido no encontrado',
                        success: false,
                        error: true
                    });
                }

                // Crear nueva transferencia
                transfer = new BankTransferModel({
                    transfer_id: transferId,
                    order_id: order._id,
                    customer_transfer_info: {
                        reference_number,
                        transfer_date: transfer_date ? new Date(transfer_date) : new Date(),
                        customer_bank,
                        customer_account,
                        transfer_notes,
                        transfer_amount: order.total_amount
                    }
                });

                await transfer.save();
                console.log('✅ Nueva transferencia creada');
            } else {
                // Actualizar información existente
                transfer.customer_transfer_info = {
                    ...transfer.customer_transfer_info,
                    reference_number,
                    transfer_date: transfer_date ? new Date(transfer_date) : new Date(),
                    customer_bank,
                    customer_account,
                    transfer_notes
                };
            }

            // ✅ GUARDAR INFORMACIÓN DEL COMPROBANTE
            transfer.transfer_proof = {
                file_url: proof_url,
                file_name: file_name || 'comprobante.jpg',
                file_size: file_size || 0,
                file_type: file_type || 'image/jpeg',
                upload_date: new Date(),
                upload_method: 'firebase'
            };

            // ✅ ACTUALIZAR ESTADO
            transfer.admin_verification.status = 'pending';
            transfer.notifications.admin_notified_new = true;

            await transfer.save();

            console.log('✅ Comprobante procesado exitosamente');

            res.json({
                message: 'Comprobante procesado exitosamente',
                success: true,
                error: false,
                data: {
                    transfer: transfer,
                    next_steps: [
                        'Tu comprobante está siendo verificado',
                        'Recibirás notificación por email cuando sea aprobado',
                        'El proceso puede tomar hasta 24 horas'
                    ]
                }
            });

        } catch (error) {
            console.error('❌ Error procesando comprobante:', error);
            res.status(500).json({
                message: 'Error al procesar comprobante',
                success: false,
                error: true,
                details: error.message
            });
        }
    };

    /**
     * ✅ OBTENER TRANSFERENCIA POR ID
     */
    const getTransferByIdController = async (req, res) => {
        try {
            const { transferId } = req.params;

            console.log('🔍 === OBTENIENDO TRANSFERENCIA ===');
            console.log('💳 Transfer ID:', transferId);

            const transfer = await BankTransferModel.findByTransferId(transferId);
            if (!transfer) {
                return res.status(404).json({
                    message: 'Transferencia no encontrada',
                    success: false,
                    error: true
                });
            }

            // ✅ VERIFICAR PERMISOS
            if (req.userRole !== 'ADMIN' && transfer.order_id.user_id && transfer.order_id.user_id.toString() !== req.userId) {
                return res.status(403).json({
                    message: 'No tienes permisos para ver esta transferencia',
                    success: false,
                    error: true
                });
            }

            console.log('✅ Transferencia encontrada:', transfer.transfer_id);

            res.json({
                message: 'Transferencia obtenida exitosamente',
                success: true,
                error: false,
                data: transfer
            });

        } catch (error) {
            console.error('❌ Error obteniendo transferencia:', error);
            res.status(500).json({
                message: 'Error al obtener transferencia',
                success: false,
                error: true,
                details: error.message
            });
        }
    };

    /**
     * ✅ OBTENER TRANSFERENCIAS PENDIENTES (ADMIN)
     */
    const getPendingTransfersController = async (req, res) => {
        try {
            console.log('⏳ === OBTENIENDO TRANSFERENCIAS PENDIENTES ===');

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
            const stats = await BankTransferModel.getTransferStats(startDate, endDate);

            // ✅ ESTADÍSTICAS ADICIONALES
            const totalTransfers = await BankTransferModel.countDocuments();
            const pendingTransfers = await BankTransferModel.countDocuments({ 'admin_verification.status': 'pending' });
            const approvedTransfers = await BankTransferModel.countDocuments({ 'admin_verification.status': 'approved' });
            const rejectedTransfers = await BankTransferModel.countDocuments({ 'admin_verification.status': 'rejected' });
            const overdueTransfers = await BankTransferModel.getOverdueTransfers();

            const responseData = {
                by_status: stats,
                overall_stats: {
                    total_transfers: totalTransfers,
                    pending_transfers: pendingTransfers,
                    approved_transfers: approvedTransfers,
                    rejected_transfers: rejectedTransfers,
                    overdue_transfers: overdueTransfers.length,
                    approval_rate: totalTransfers > 0 ? Math.round((approvedTransfers / totalTransfers) * 100) : 0
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

    /**
     * ✅ APROBAR TRANSFERENCIA (ADMIN)
     */
    const approveTransferController = async (req, res) => {
        try {
            const { transferId } = req.params;
            const { notes, verification_amount } = req.body;

            console.log('✅ === APROBANDO TRANSFERENCIA ===');
            console.log('💳 Transfer ID:', transferId);
            console.log('👤 Admin:', req.userId);

            // ✅ VERIFICAR PERMISOS DE ADMIN
            if (req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    message: 'No tienes permisos para aprobar transferencias',
                    success: false,
                    error: true
                });
            }

            // ✅ BUSCAR TRANSFERENCIA
            const transfer = await BankTransferModel.findByTransferId(transferId);
            if (!transfer) {
                return res.status(404).json({
                    message: 'Transferencia no encontrada',
                    success: false,
                    error: true
                });
            }

            // ✅ VERIFICAR QUE ESTÁ PENDIENTE
            if (transfer.admin_verification.status !== 'pending') {
                return res.status(400).json({
                    message: 'Esta transferencia ya fue procesada',
                    success: false,
                    error: true,
                    current_status: transfer.admin_verification.status
                });
            }

            // ✅ APROBAR TRANSFERENCIA
            await transfer.approve(req.userId, notes, verification_amount);

            // ✅ ACTUALIZAR PEDIDO RELACIONADO
            const order = await OrderModel.findById(transfer.order_id);
            if (order) {
                order.payment_status = 'approved';
                order.status = 'confirmed';
                await order.save();
            }

            console.log('✅ Transferencia aprobada exitosamente');

            res.json({
                message: 'Transferencia aprobada exitosamente',
                success: true,
                error: false,
                data: {
                    transfer: transfer,
                    order_updated: !!order
                }
            });

        } catch (error) {
            console.error('❌ Error aprobando transferencia:', error);
            res.status(500).json({
                message: 'Error al aprobar transferencia',
                success: false,
                error: true,
                details: error.message
            });
        }
    };

    /**
     * ✅ RECHAZAR TRANSFERENCIA (ADMIN)
     */
    const rejectTransferController = async (req, res) => {
        try {
            const { transferId } = req.params;
            const { notes, reason } = req.body;

            console.log('❌ === RECHAZANDO TRANSFERENCIA ===');
            console.log('💳 Transfer ID:', transferId);
            console.log('👤 Admin:', req.userId);

            // ✅ VERIFICAR PERMISOS DE ADMIN
            if (req.userRole !== 'ADMIN') {
                return res.status(403).json({
                    message: 'No tienes permisos para rechazar transferencias',
                    success: false,
                    error: true
                });
            }

            // ✅ BUSCAR TRANSFERENCIA
            const transfer = await BankTransferModel.findByTransferId(transferId);
            if (!transfer) {
                return res.status(404).json({
                    message: 'Transferencia no encontrada',
                    success: false,
                    error: true
                });
            }

            // ✅ VERIFICAR QUE ESTÁ PENDIENTE
            if (transfer.admin_verification.status !== 'pending') {
                return res.status(400).json({
                    message: 'Esta transferencia ya fue procesada',
                    success: false,
                    error: true,
                    current_status: transfer.admin_verification.status
                });
            }

            // ✅ RECHAZAR TRANSFERENCIA
            await transfer.reject(req.userId, notes, reason);

            // ✅ ACTUALIZAR PEDIDO RELACIONADO
            const order = await OrderModel.findById(transfer.order_id);
            if (order) {
                order.payment_status = 'rejected';
                order.status = 'cancelled';
                await order.save();
            }

            console.log('✅ Transferencia rechazada exitosamente');

            res.json({
                message: 'Transferencia rechazada exitosamente',
                success: true,
                error: false,
                data: {
                    transfer: transfer,
                    order_updated: !!order
                }
            });

        } catch (error) {
            console.error('❌ Error rechazando transferencia:', error);
            res.status(500).json({
                message: 'Error al rechazar transferencia',
                success: false,
                error: true,
                details: error.message
            });
        }
    };

    /**
     * ✅ OBTENER ESTADÍSTICAS DE TRANSFERENCIAS (ADMIN)
     */
    const getTransferStatsController = async (req, res) => {
        try {
            console.log('📊 === OBTENIENDO ESTADÍSTICAS DE TRANSFERENCIAS ===');

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
            const stats = await BankTransferModel.getTransferStats(startDate, endDate);

            // ✅ ESTADÍSTICAS ADICIONALES
            const totalTransfers = await BankTransferModel.countDocuments();
            const pendingTransfers = await BankTransferModel.countDocuments({ 'admin_verification.status': 'pending' });
            const approvedTransfers = await BankTransferModel.countDocuments({ 'admin_verification.status': 'approved' });
            const rejectedTransfers = await BankTransferModel.countDocuments({ 'admin_verification.status': 'rejected' });
            const overdueTransfers = await BankTransferModel.getOverdueTransfers();

            const responseData = {
                by_status: stats,
                overall_stats: {
                    total_transfers: totalTransfers,
                    pending_transfers: pendingTransfers,
                    approved_transfers: approvedTransfers,
                    rejected_transfers: rejectedTransfers,
                    overdue_transfers: overdueTransfers.length,
                    approval_rate: totalTransfers > 0 ? Math.round((approvedTransfers / totalTransfers) * 100) : 0
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
    const submitTransferWithoutProofController = async (req, res) => {
        try {
            const { transferId } = req.params;
            const { 
                order_id, 
                reference_number, 
                transfer_date, 
                customer_bank, 
                customer_account, 
                transfer_notes,
                transfer_amount 
            } = req.body;

            console.log('📤 === ENVIANDO TRANSFERENCIA SIN COMPROBANTE ===');
            console.log('💳 Transfer ID:', transferId);
            console.log('📋 Datos recibidos:', req.body);

            // ✅ BUSCAR O CREAR TRANSFERENCIA
        let transfer = await BankTransferModel.findOne({ transfer_id: transferId });

                if (!transfer) {
                // Buscar pedido para crear transferencia
                const order = await OrderModel.findOne({ order_id: order_id });
                if (!order) {
                    return res.status(404).json({
                        message: 'Pedido no encontrado',
                        success: false,
                        error: true
                    });
                }

                // Crear nueva transferencia
                transfer = new BankTransferModel({
                    transfer_id: transferId,
                    order_id: order._id,
                    customer_transfer_info: {
                        reference_number,
                        transfer_date: transfer_date ? new Date(transfer_date) : new Date(),
                        customer_bank,
                        customer_account,
                        transfer_notes,
                        transfer_amount: transfer_amount || order.total_amount
                    },
                    admin_verification: {
                        status: 'pending'
                    },
                    submission_method: 'without_proof'
                });

                await transfer.save();
                console.log('✅ Nueva transferencia creada sin comprobante');
            } else {
                // Actualizar transferencia existente
                transfer.customer_transfer_info = {
                    ...transfer.customer_transfer_info,
                    reference_number,
                    transfer_date: transfer_date ? new Date(transfer_date) : new Date(),
                    customer_bank,
                    customer_account,
                    transfer_notes,
                    transfer_amount: transfer_amount || transfer.customer_transfer_info.transfer_amount
                };

                transfer.submission_method = 'without_proof';
                await transfer.save();
                console.log('✅ Transferencia actualizada sin comprobante');
            }

            res.json({
                message: 'Información de transferencia guardada exitosamente',
                success: true,
                error: false,
                data: {
                    transfer: transfer,
                    next_steps: [
                        'Información recibida correctamente',
                        'Puedes subir el comprobante después',
                        'También puedes enviarlo por WhatsApp',
                        'Te contactaremos para confirmar'
                    ]
                }
            });

        } catch (error) {
            console.error('❌ Error guardando transferencia:', error);
            res.status(500).json({
                message: 'Error al guardar transferencia',
                success: false,
                error: true,
                details: error.message
            });
        }
    };

    module.exports = {
        createBankTransferController,
        uploadTransferProofController,
        getTransferByIdController,
        getPendingTransfersController,
        approveTransferController,
        rejectTransferController,
        getTransferStatsController,
        submitTransferWithoutProofController
    };