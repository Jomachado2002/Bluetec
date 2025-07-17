// frontend/src/pages/UnifiedOrderManagement.js
import React, { useState, useEffect } from 'react';
import { FaShoppingBag, FaEye, FaEdit, FaFilter, FaDownload, FaCreditCard, FaUniversity, FaFileInvoice, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SummaryApi from '../common';
import displayINRCurrency from '../helpers/displayCurrency';

const UnifiedOrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        status: '',
        payment_method: '',
        payment_status: '',
        startDate: '',
        endDate: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });

    useEffect(() => {
        fetchUnifiedOrders();
        fetchStats();
    }, [filters, pagination.page]);

    const fetchUnifiedOrders = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            });

            // Simularemos datos combinados de pedidos unificados y transacciones Bancard
            const mockUnifiedOrders = [
                // Pedido por transferencia bancaria
                {
                    _id: '1',
                    order_id: 'ORD-1704636834567-001',
                    order_type: 'unified_order', // Nuevo sistema
                    customer_info: {
                        name: 'Juan Pérez',
                        email: 'juan@email.com',
                        phone: '+595981234567'
                    },
                    total_amount: 1500000,
                    payment_method: 'bank_transfer',
                    payment_status: 'pending',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    items: [
                        { name: 'Notebook HP Pavilion', quantity: 1, total_price: 1500000 }
                    ],
                    delivery_location: {
                        address: 'Av. Mcal. López 1234, Asunción',
                        lat: -25.2637,
                        lng: -57.5759
                    },
                    bank_transfer_id: 'TRF-1704636834567-001',
                    transfer_status: 'pending_approval'
                },
                // Pedido por Bancard (transacción existente convertida)
                {
                    _id: '2',
                    order_id: 'ORD-1704550434567-002',
                    shop_process_id: 'SHOP-1704550434567-002', // Para compatibilidad Bancard
                    order_type: 'bancard_transaction', // Sistema legacy
                    customer_info: {
                        name: 'María González',
                        email: 'maria@email.com',
                        phone: '+595981234568'
                    },
                    total_amount: 800000,
                    payment_method: 'bancard',
                    payment_status: 'completed',
                    status: 'confirmed',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    items: [
                        { name: 'Mouse Logitech MX Master', quantity: 1, total_price: 400000 },
                        { name: 'Teclado Mecánico', quantity: 1, total_price: 400000 }
                    ],
                    bancard_transaction_id: 'TXN-BANCARD-123456',
                    authorization_number: 'AUTH123456',
                    ticket_number: 'TKT789012'
                },
                // Presupuesto
                {
                    _id: '3',
                    order_id: 'ORD-1704464034567-003',
                    order_type: 'unified_order',
                    customer_info: {
                        name: 'Carlos Mendoza',
                        email: 'carlos@email.com',
                        phone: '+595981234569'
                    },
                    total_amount: 2500000,
                    payment_method: 'quote',
                    payment_status: 'pending',
                    status: 'pending',
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    items: [
                        { name: 'Impresora HP LaserJet', quantity: 1, total_price: 1200000 },
                        { name: 'Scanner Epson', quantity: 1, total_price: 800000 },
                        { name: 'Papel A4 (5 resmas)', quantity: 1, total_price: 500000 }
                    ],
                    delivery_location: {
                        address: 'Av. España 5678, Fernando de la Mora',
                        lat: -25.3167,
                        lng: -57.5167
                    },
                    quote_valid_until: new Date(Date.now() + 432000000).toISOString() // 5 días
                }
            ];

            // Aplicar filtros
            let filteredOrders = mockUnifiedOrders;
            
            if (filters.status) {
                filteredOrders = filteredOrders.filter(order => order.status === filters.status);
            }
            
            if (filters.payment_method) {
                filteredOrders = filteredOrders.filter(order => order.payment_method === filters.payment_method);
            }
            
            if (filters.payment_status) {
                filteredOrders = filteredOrders.filter(order => order.payment_status === filters.payment_status);
            }
            
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredOrders = filteredOrders.filter(order => 
                    order.order_id.toLowerCase().includes(searchTerm) ||
                    order.customer_info.name.toLowerCase().includes(searchTerm) ||
                    order.customer_info.email.toLowerCase().includes(searchTerm)
                );
            }

            setOrders(filteredOrders);
            setPagination(prev => ({ ...prev, total: filteredOrders.length }));

        } catch (error) {
            console.error('Error obteniendo pedidos:', error);
            toast.error('Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            // Simular estadísticas combinadas
            const mockStats = {
                overall_stats: {
                    total_orders: 156,
                    pending_orders: 23,
                    completed_orders: 98,
                    cancelled_orders: 12,
                    completion_rate: 73
                },
                by_payment_method: [
                    { _id: 'bancard', count: 89, total_amount: 125000000 },
                    { _id: 'bank_transfer', count: 45, total_amount: 67500000 },
                    { _id: 'quote', count: 22, total_amount: 32500000 }
                ]
            };

            setStats(mockStats);
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${SummaryApi.orders.updateStatus.url}/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: newStatus,
                    notes: `Estado actualizado a ${newStatus} por administrador`
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Estado actualizado exitosamente');
                fetchUnifiedOrders();
                setShowEditModal(false);
            } else {
                toast.error(result.message || 'Error al actualizar estado');
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
            toast.error('Error de conexión');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
            confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmado' },
            processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Procesando' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
            approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'bancard':
                return <FaCreditCard className="text-blue-600" />;
            case 'bank_transfer':
                return <FaUniversity className="text-green-600" />;
            case 'quote':
                return <FaFileInvoice className="text-purple-600" />;
            default:
                return <FaCreditCard className="text-gray-600" />;
        }
    };

    const getPaymentMethodLabel = (method) => {
        switch (method) {
            case 'bancard':
                return 'Bancard';
            case 'bank_transfer':
                return 'Transferencia';
            case 'quote':
                return 'Presupuesto';
            default:
                return method;
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            payment_method: '',
            payment_status: '',
            startDate: '',
            endDate: '',
            search: ''
        });
    };

    const exportOrders = () => {
        toast.info('Función de exportación en desarrollo');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2A3190] flex items-center gap-3">
                            <FaShoppingBag className="text-xl" />
                            Gestión Unificada de Pedidos
                        </h1>
                        <p className="text-gray-600 mt-1">Administra todos los pedidos: Bancard, Transferencias y Presupuestos</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={exportOrders}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <FaDownload />
                            Exportar
                        </button>
                        <button
                            onClick={fetchUnifiedOrders}
                            className="bg-[#2A3190] text-white px-4 py-2 rounded-lg hover:bg-[#1e236b] transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Pedidos</p>
                            <p className="text-2xl font-bold text-[#2A3190]">
                                {stats.overall_stats?.total_orders || 0}
                            </p>
                        </div>
                        <FaShoppingBag className="text-3xl text-[#2A3190] opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Pendientes</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {stats.overall_stats?.pending_orders || 0}
                            </p>
                        </div>
                        <FaCreditCard className="text-3xl text-yellow-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Completados</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.overall_stats?.completed_orders || 0}
                            </p>
                        </div>
                        <FaUser className="text-3xl text-green-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Tasa Éxito</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.overall_stats?.completion_rate || 0}%
                            </p>
                        </div>
                        <FaUniversity className="text-3xl text-blue-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Estadísticas por método de pago */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.by_payment_method?.map((method) => (
                    <div key={method._id} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm flex items-center gap-2">
                                    {getPaymentMethodIcon(method._id)}
                                    {getPaymentMethodLabel(method._id)}
                                </p>
                                <p className="text-lg font-bold text-gray-900">{method.count} pedidos</p>
                                <p className="text-sm text-gray-600">{displayINRCurrency(method.total_amount)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                    <FaFilter className="mr-2 text-gray-600" />
                    <h3 className="font-medium">Filtrar Pedidos</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Estado</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                        >
                            <option value="">Todos</option>
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="processing">Procesando</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Método Pago</label>
                        <select
                            name="payment_method"
                            value={filters.payment_method}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                        >
                            <option value="">Todos</option>
                            <option value="bancard">Bancard</option>
                            <option value="bank_transfer">Transferencia</option>
                            <option value="quote">Presupuesto</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Estado Pago</label>
                        <select
                            name="payment_status"
                            value={filters.payment_status}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                        >
                            <option value="">Todos</option>
                            <option value="pending">Pendiente</option>
                            <option value="approved">Aprobado</option>
                            <option value="completed">Completado</option>
                            <option value="rejected">Rechazado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Desde</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Hasta</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Buscar</label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Pedido, cliente..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* Lista de pedidos */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Pedidos ({orders.length})</h3>
                
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-[#2A3190] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando pedidos...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay pedidos</h3>
                        <p className="text-gray-500">No se encontraron pedidos con los filtros aplicados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Pedido</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Cliente</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Total</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Método</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Estado</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Pago</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Fecha</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-2">
                                            <div>
                                                <p className="font-medium text-[#2A3190]">{order.order_id}</p>
                                                <p className="text-xs text-gray-500">
                                                    {order.items?.length || 0} productos
                                                    {order.order_type === 'bancard_transaction' && ' • Bancard'}
                                                    {order.order_type === 'unified_order' && ' • Nuevo'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div>
                                                <p className="font-medium">{order.customer_info.name}</p>
                                                <p className="text-sm text-gray-600">{order.customer_info.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <p className="font-bold text-green-600">
                                                {displayINRCurrency(order.total_amount)}
                                            </p>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                {getPaymentMethodIcon(order.payment_method)}
                                                <span className="text-sm">{getPaymentMethodLabel(order.payment_method)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="py-3 px-2">
                                            {getPaymentStatusBadge(order.payment_status)}
                                        </td>
                                        <td className="py-3 px-2">
                                            <p className="text-sm text-gray-600">
                                                {new Date(order.createdAt).toLocaleDateString('es-ES')}
                                            </p>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Ver detalles"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Editar"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de detalles */}
            {showDetailsModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-[#2A3190]">
                                Detalles del Pedido {selectedOrder.order_id}
                            </h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-96">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Información del cliente */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Nombre:</strong> {selectedOrder.customer_info.name}</p>
                                        <p><strong>Email:</strong> {selectedOrder.customer_info.email}</p>
                                        <p><strong>Teléfono:</strong> {selectedOrder.customer_info.phone}</p>
                                    </div>
                                </div>

                                {/* Estado del pedido */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Estado del Pedido</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Estado:</strong> {getStatusBadge(selectedOrder.status)}</p>
                                        <p><strong>Pago:</strong> {getPaymentStatusBadge(selectedOrder.payment_status)}</p>
                                        <p><strong>Método:</strong> 
                                            <span className="inline-flex items-center gap-1 ml-2">
                                                {getPaymentMethodIcon(selectedOrder.payment_method)}
                                                {getPaymentMethodLabel(selectedOrder.payment_method)}
                                            </span>
                                        </p>
                                        <p><strong>Tipo:</strong> 
                                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                                selectedOrder.order_type === 'bancard_transaction' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {selectedOrder.order_type === 'bancard_transaction' ? 'Sistema Legacy (Bancard)' : 'Sistema Nuevo'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Información específica según el tipo */}
                                {selectedOrder.payment_method === 'bancard' && selectedOrder.authorization_number && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">Información Bancard</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Autorización:</strong> {selectedOrder.authorization_number}</p>
                                            <p><strong>Ticket:</strong> {selectedOrder.ticket_number}</p>
                                            {selectedOrder.shop_process_id && (
                                                <p><strong>Shop Process ID:</strong> {selectedOrder.shop_process_id}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedOrder.payment_method === 'bank_transfer' && selectedOrder.bank_transfer_id && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">Información Transferencia</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Transfer ID:</strong> {selectedOrder.bank_transfer_id}</p>
                                            <p><strong>Estado Transferencia:</strong> 
                                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                                    selectedOrder.transfer_status === 'pending_approval' 
                                                        ? 'bg-yellow-100 text-yellow-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {selectedOrder.transfer_status === 'pending_approval' ? 'Pendiente Aprobación' : 'Aprobada'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedOrder.payment_method === 'quote' && selectedOrder.quote_valid_until && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">Información Presupuesto</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Válido hasta:</strong> {new Date(selectedOrder.quote_valid_until).toLocaleDateString('es-ES')}</p>
                                            <p><strong>Días restantes:</strong> 
                                                <span className="ml-2 px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                                    {Math.ceil((new Date(selectedOrder.quote_valid_until) - new Date()) / (1000 * 60 * 60 * 24))} días
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Ubicación de entrega */}
                                {selectedOrder.delivery_location && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3">Ubicación de Entrega</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Dirección:</strong> {selectedOrder.delivery_location.address}</p>
                                            <a
                                                href={`https://www.google.com/maps?q=${selectedOrder.delivery_location.lat},${selectedOrder.delivery_location.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                Ver en Google Maps →
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Productos */}
                                <div className="md:col-span-2">
                                    <h3 className="font-semibold text-gray-900 mb-3">Productos ({selectedOrder.items?.length || 0})</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.items?.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                                </div>
                                                <p className="font-semibold">{displayINRCurrency(item.total_price)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t p-6 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-bold text-[#2A3190]">
                                        Total: {displayINRCurrency(selectedOrder.total_amount)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Pedido creado: {new Date(selectedOrder.createdAt).toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    {selectedOrder.payment_method === 'bank_transfer' && selectedOrder.bank_transfer_id && (
                                        <button
                                            onClick={() => {
                                                // Navegar a la gestión de transferencias
                                                window.open(`/panel-admin/transferencias-bancarias?transfer=${selectedOrder.bank_transfer_id}`, '_blank');
                                            }}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Ver Transferencia
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición */}
            {showEditModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-[#2A3190]">
                                Editar Pedido
                            </h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Estado del Pedido
                                    </label>
                                    <select
                                        defaultValue={selectedOrder.status}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                        onChange={(e) => updateOrderStatus(selectedOrder.order_id, e.target.value)}
                                    >
                                        <option value="pending">Pendiente</option>
                                        <option value="confirmed">Confirmado</option>
                                        <option value="processing">Procesando</option>
                                        <option value="completed">Completado</option>
                                        <option value="cancelled">Cancelado</option>
                                    </select>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Nota:</strong> El cambio de estado se aplicará inmediatamente y se notificará al cliente.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t p-6 bg-gray-50">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedOrderManagement;