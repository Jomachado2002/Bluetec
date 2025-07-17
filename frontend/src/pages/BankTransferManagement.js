// frontend/src/pages/BankTransferManagement.js
import React, { useState, useEffect } from 'react';
import { FaUniversity, FaEye, FaCheck, FaTimes, FaFilter, FaDownload, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SummaryApi from '../common';
import displayINRCurrency from '../helpers/displayCurrency';

const BankTransferManagement = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalAction, setApprovalAction] = useState(''); // 'approve' | 'reject'
    const [approvalNotes, setApprovalNotes] = useState('');
    const [verificationAmount, setVerificationAmount] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({
        status: 'pending',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchTransfers();
        fetchStats();
    }, [filters]);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            let url = SummaryApi.bankTransfers.getPending.url;
            
            // Si no es solo pendientes, usar endpoint de estadísticas
            if (filters.status !== 'pending') {
                url = SummaryApi.bankTransfers.getStats.url;
            }

            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${url}?${queryParams}`, {
                method: 'GET',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                // Para el ejemplo, usaremos datos mock basados en la estructura del backend
                const mockTransfers = [
                    {
                        _id: '1',
                        transfer_id: 'TRF-1704636834567-001',
                        order_id: {
                            _id: 'order1',
                            order_id: 'ORD-1704636834567-001',
                            customer_info: {
                                name: 'Juan Pérez',
                                email: 'juan@email.com',
                                phone: '+595981234567'
                            },
                            total_amount: 1500000
                        },
                        customer_transfer_info: {
                            transfer_amount: 1500000,
                            reference_number: 'TXN123456',
                            customer_bank: 'Banco Itaú',
                            customer_account: '****1234',
                            transfer_date: new Date().toISOString()
                        },
                        transfer_proof: {
                            file_url: '/uploads/bank_transfers/transfer-proof-1.jpg',
                            file_name: 'comprobante_transferencia.jpg',
                            uploaded_at: new Date().toISOString()
                        },
                        admin_verification: {
                            status: 'pending',
                            verified_by: null,
                            verification_date: null,
                            admin_notes: ''
                        },
                        createdAt: new Date().toISOString(),
                        days_since_submission: 1,
                        has_proof: true
                    },
                    {
                        _id: '2',
                        transfer_id: 'TRF-1704550434567-002',
                        order_id: {
                            _id: 'order2',
                            order_id: 'ORD-1704550434567-002',
                            customer_info: {
                                name: 'María González',
                                email: 'maria@email.com',
                                phone: '+595981234568'
                            },
                            total_amount: 800000
                        },
                        customer_transfer_info: {
                            transfer_amount: 800000,
                            reference_number: 'TXN789012',
                            customer_bank: 'Banco Continental',
                            customer_account: '****5678',
                            transfer_date: new Date(Date.now() - 86400000).toISOString()
                        },
                        transfer_proof: {
                            file_url: '/uploads/bank_transfers/transfer-proof-2.jpg',
                            file_name: 'comprobante_maria.jpg',
                            uploaded_at: new Date(Date.now() - 86400000).toISOString()
                        },
                        admin_verification: {
                            status: 'approved',
                            verified_by: 'admin123',
                            verification_date: new Date().toISOString(),
                            admin_notes: 'Transferencia verificada correctamente'
                        },
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        days_since_submission: 2,
                        has_proof: true
                    }
                ];

                // Filtrar según el estado seleccionado
                const filteredTransfers = mockTransfers.filter(transfer => {
                    if (filters.status && filters.status !== transfer.admin_verification.status) {
                        return false;
                    }
                    return true;
                });

                setTransfers(filteredTransfers);
            }
        } catch (error) {
            console.error('Error obteniendo transferencias:', error);
            toast.error('Error al cargar transferencias');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(SummaryApi.bankTransfers.getStats.url, {
                method: 'GET',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
        }
    };

    const handleApproveTransfer = async () => {
        if (!selectedTransfer) return;

        try {
            const response = await fetch(`${SummaryApi.bankTransfers.approve.url}/${selectedTransfer.transfer_id}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    notes: approvalNotes,
                    verification_amount: parseFloat(verificationAmount) || selectedTransfer.customer_transfer_info.transfer_amount
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Transferencia aprobada exitosamente');
                fetchTransfers();
                closeApprovalModal();
            } else {
                toast.error(result.message || 'Error al aprobar transferencia');
            }
        } catch (error) {
            console.error('Error aprobando transferencia:', error);
            toast.error('Error de conexión al aprobar transferencia');
        }
    };

    const handleRejectTransfer = async () => {
        if (!selectedTransfer) return;

        try {
            const response = await fetch(`${SummaryApi.bankTransfers.reject.url}/${selectedTransfer.transfer_id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    notes: approvalNotes,
                    reason: rejectionReason
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Transferencia rechazada');
                fetchTransfers();
                closeApprovalModal();
            } else {
                toast.error(result.message || 'Error al rechazar transferencia');
            }
        } catch (error) {
            console.error('Error rechazando transferencia:', error);
            toast.error('Error de conexión al rechazar transferencia');
        }
    };

    const openApprovalModal = (transfer, action) => {
        setSelectedTransfer(transfer);
        setApprovalAction(action);
        setApprovalNotes('');
        setVerificationAmount(transfer.customer_transfer_info.transfer_amount.toString());
        setRejectionReason('');
        setShowApprovalModal(true);
    };

    const closeApprovalModal = () => {
        setShowApprovalModal(false);
        setSelectedTransfer(null);
        setApprovalAction('');
        setApprovalNotes('');
        setVerificationAmount('');
        setRejectionReason('');
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente', icon: FaClock },
            approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado', icon: FaCheck },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado', icon: FaTimes },
            requires_review: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Requiere Revisión', icon: FaExclamationTriangle }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="text-xs" />
                {config.label}
            </span>
        );
    };

    const getDaysColor = (days) => {
        if (days <= 1) return 'text-green-600';
        if (days <= 3) return 'text-yellow-600';
        return 'text-red-600';
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            status: 'pending',
            startDate: '',
            endDate: ''
        });
    };

    const exportTransfers = () => {
        toast.info('Función de exportación en desarrollo');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2A3190] flex items-center gap-3">
                            <FaUniversity className="text-xl" />
                            Gestión de Transferencias Bancarias
                        </h1>
                        <p className="text-gray-600 mt-1">Administra y verifica las transferencias bancarias</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={exportTransfers}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <FaDownload />
                            Exportar
                        </button>
                        <button
                            onClick={fetchTransfers}
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
                            <p className="text-gray-600 text-sm">Total Transferencias</p>
                            <p className="text-2xl font-bold text-[#2A3190]">
                                {stats.overall_stats?.total_transfers || 0}
                            </p>
                        </div>
                        <FaUniversity className="text-3xl text-[#2A3190] opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Pendientes</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {stats.overall_stats?.pending_transfers || 0}
                            </p>
                        </div>
                        <FaClock className="text-3xl text-yellow-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Aprobadas</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.overall_stats?.approved_transfers || 0}
                            </p>
                        </div>
                        <FaCheck className="text-3xl text-green-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Tasa Aprobación</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.overall_stats?.approval_rate || 0}%
                            </p>
                        </div>
                        <FaUniversity className="text-3xl text-blue-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                    <FaFilter className="mr-2 text-gray-600" />
                    <h3 className="font-medium">Filtrar Transferencias</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Estado</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                        >
                            <option value="">Todos</option>
                            <option value="pending">Pendientes</option>
                            <option value="approved">Aprobadas</option>
                            <option value="rejected">Rechazadas</option>
                            <option value="requires_review">Requiere Revisión</option>
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

                    <div className="flex items-end">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de transferencias */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                    Transferencias ({transfers.length})
                </h3>
                
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-[#2A3190] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando transferencias...</p>
                    </div>
                ) : transfers.length === 0 ? (
                    <div className="text-center py-12">
                        <FaUniversity className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay transferencias</h3>
                        <p className="text-gray-500">No se encontraron transferencias con los filtros aplicados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Transferencia</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Pedido</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Cliente</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Monto</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Banco Cliente</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Estado</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Días</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map((transfer) => (
                                    <tr key={transfer._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-2">
                                            <div>
                                                <p className="font-medium text-[#2A3190]">{transfer.transfer_id}</p>
                                                <p className="text-xs text-gray-500">Ref: {transfer.customer_transfer_info.reference_number}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <p className="font-medium text-gray-900">{transfer.order_id.order_id}</p>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div>
                                                <p className="font-medium">{transfer.order_id.customer_info.name}</p>
                                                <p className="text-sm text-gray-600">{transfer.order_id.customer_info.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <p className="font-bold text-green-600">
                                                {displayINRCurrency(transfer.customer_transfer_info.transfer_amount)}
                                            </p>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div>
                                                <p className="text-sm font-medium">{transfer.customer_transfer_info.customer_bank}</p>
                                                <p className="text-xs text-gray-500">{transfer.customer_transfer_info.customer_account}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            {getStatusBadge(transfer.admin_verification.status)}
                                        </td>
                                        <td className="py-3 px-2">
                                            <p className={`text-sm font-medium ${getDaysColor(transfer.days_since_submission)}`}>
                                                {transfer.days_since_submission} días
                                            </p>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTransfer(transfer);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Ver detalles"
                                                >
                                                    <FaEye />
                                                </button>
                                                
                                                {transfer.admin_verification.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => openApprovalModal(transfer, 'approve')}
                                                            className="text-green-600 hover:text-green-800 p-1"
                                                            title="Aprobar"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            onClick={() => openApprovalModal(transfer, 'reject')}
                                                            className="text-red-600 hover:text-red-800 p-1"
                                                            title="Rechazar"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </>
                                                )}
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
            {showDetailsModal && selectedTransfer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-[#2A3190]">
                                Detalles de Transferencia {selectedTransfer.transfer_id}
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
                                {/* Información del pedido */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Información del Pedido</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Pedido:</strong> {selectedTransfer.order_id.order_id}</p>
                                        <p><strong>Cliente:</strong> {selectedTransfer.order_id.customer_info.name}</p>
                                        <p><strong>Email:</strong> {selectedTransfer.order_id.customer_info.email}</p>
                                        <p><strong>Teléfono:</strong> {selectedTransfer.order_id.customer_info.phone}</p>
                                        <p><strong>Total Pedido:</strong> {displayINRCurrency(selectedTransfer.order_id.total_amount)}</p>
                                    </div>
                                </div>

                                {/* Información de la transferencia */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Datos de Transferencia</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Referencia:</strong> {selectedTransfer.customer_transfer_info.reference_number}</p>
                                        <p><strong>Monto:</strong> {displayINRCurrency(selectedTransfer.customer_transfer_info.transfer_amount)}</p>
                                        <p><strong>Banco Cliente:</strong> {selectedTransfer.customer_transfer_info.customer_bank}</p>
                                        <p><strong>Cuenta Cliente:</strong> {selectedTransfer.customer_transfer_info.customer_account}</p>
                                        <p><strong>Fecha Transferencia:</strong> {new Date(selectedTransfer.customer_transfer_info.transfer_date).toLocaleDateString('es-ES')}</p>
                                    </div>
                                </div>

                                {/* Comprobante */}
                                {selectedTransfer.transfer_proof?.file_url && (
                                    <div className="md:col-span-2">
                                        <h3 className="font-semibold text-gray-900 mb-3">Comprobante de Transferencia</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm mb-2">
                                                <strong>Archivo:</strong> {selectedTransfer.transfer_proof.file_name}
                                            </p>
                                            <a
                                                href={selectedTransfer.transfer_proof.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                Ver comprobante →
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Estado de verificación */}
                                <div className="md:col-span-2">
                                    <h3 className="font-semibold text-gray-900 mb-3">Estado de Verificación</h3>
                                    <div className="space-y-2">
                                        <p><strong>Estado:</strong> {getStatusBadge(selectedTransfer.admin_verification.status)}</p>
                                        {selectedTransfer.admin_verification.verification_date && (
                                            <p><strong>Fecha Verificación:</strong> {new Date(selectedTransfer.admin_verification.verification_date).toLocaleDateString('es-ES')}</p>
                                        )}
                                        {selectedTransfer.admin_verification.admin_notes && (
                                            <p><strong>Notas Admin:</strong> {selectedTransfer.admin_verification.admin_notes}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t p-6 bg-gray-50">
                            <div className="flex justify-end gap-3">
                                {selectedTransfer.admin_verification.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowDetailsModal(false);
                                                openApprovalModal(selectedTransfer, 'approve');
                                            }}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <FaCheck />
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDetailsModal(false);
                                                openApprovalModal(selectedTransfer, 'reject');
                                            }}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                        >
                                            <FaTimes />
                                            Rechazar
                                        </button>
                                    </>
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
            )}

            {/* Modal de aprobación/rechazo */}
            {showApprovalModal && selectedTransfer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-[#2A3190]">
                                {approvalAction === 'approve' ? 'Aprobar' : 'Rechazar'} Transferencia
                            </h2>
                            <button
                                onClick={closeApprovalModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-gray-700 mb-2">
                                    <strong>Transferencia:</strong> {selectedTransfer.transfer_id}
                                </p>
                                <p className="text-gray-700 mb-2">
                                    <strong>Monto:</strong> {displayINRCurrency(selectedTransfer.customer_transfer_info.transfer_amount)}
                                </p>
                                <p className="text-gray-700 mb-4">
                                    <strong>Cliente:</strong> {selectedTransfer.order_id.customer_info.name}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {approvalAction === 'approve' && (
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Monto Verificado
                                        </label>
                                        <input
                                            type="number"
                                            value={verificationAmount}
                                            onChange={(e) => setVerificationAmount(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                            placeholder="Monto verificado"
                                        />
                                    </div>
                                )}

                                {approvalAction === 'reject' && (
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Motivo del Rechazo
                                        </label>
                                        <select
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                        >
                                            <option value="">Seleccionar motivo</option>
                                            <option value="amount_mismatch">Monto no coincide</option>
                                            <option value="invalid_proof">Comprobante inválido</option>
                                            <option value="duplicate_transfer">Transferencia duplicada</option>
                                            <option value="expired_order">Pedido expirado</option>
                                            <option value="other">Otro motivo</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Notas del Administrador
                                    </label>
                                    <textarea
                                        value={approvalNotes}
                                        onChange={(e) => setApprovalNotes(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
                                        rows="3"
                                        placeholder="Notas adicionales sobre la verificación..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t p-6 bg-gray-50">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={closeApprovalModal}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                
                                {approvalAction === 'approve' ? (
                                    <button
                                        onClick={handleApproveTransfer}
                                        disabled={!verificationAmount}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <FaCheck />
                                        Aprobar Transferencia
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRejectTransfer}
                                        disabled={!rejectionReason}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <FaTimes />
                                        Rechazar Transferencia
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankTransferManagement;