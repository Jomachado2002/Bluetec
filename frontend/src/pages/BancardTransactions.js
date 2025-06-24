import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
    FaCreditCard, 
    FaUndo, 
    FaEye, 
    FaSearch, 
    FaFilter, 
    FaExclamationTriangle, 
    FaCheckCircle, 
    FaTimesCircle, 
    FaClock,
    FaSyncAlt,  // ✅ AGREGAR ESTA LÍNEA
    FaFileInvoiceDollar
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import SummaryApi from '../common';
import displayPYGCurrency from '../helpers/displayCurrency';

const BancardTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showRollbackModal, setShowRollbackModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [rollbackReason, setRollbackReason] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        startDate: '',
        endDate: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    useEffect(() => {
        fetchTransactions();
    }, [filters, pagination.page]);

    const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
        const queryParams = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value);
        });
        
        queryParams.append('page', pagination.page);
        queryParams.append('limit', pagination.limit);

        const response = await fetch(`${SummaryApi.baseURL}/api/bancard/transactions?${queryParams.toString()}`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
            setTransactions(result.data.transactions || []);
            setPagination(prev => ({
                ...prev,
                total: result.data.pagination.total,
                pages: result.data.pagination.pages
            }));
        } else {
            toast.error(result.message || "Error al cargar las transacciones");
        }
    } catch (error) {
        console.error("Error:", error);
        toast.error("Error de conexión");
    } finally {
        setIsLoading(false);
    }
}, [filters, pagination.page, pagination.limit]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset a página 1
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            startDate: '',
            endDate: '',
            search: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleRollback = async () => {
        if (!selectedTransaction || !rollbackReason.trim()) {
            toast.error("Debe proporcionar una razón para el rollback");
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`${SummaryApi.baseURL}/api/bancard/transactions/${selectedTransaction._id}/rollback`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: 'include',
                body: JSON.stringify({ reason: rollbackReason })
            });

            const result = await response.json();
            
            if (result.success) {
                toast.success("Transacción reversada exitosamente");
                setShowRollbackModal(false);
                setSelectedTransaction(null);
                setRollbackReason('');
                fetchTransactions();
            } else {
                if (result.requiresManualReversal) {
                    toast.warn("La transacción requiere reversión manual. Contacte a Bancard.");
                } else {
                    toast.error(result.message || "Error al reversar transacción");
                }
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    const checkTransactionStatus = async (transaction) => {
        try {
            const response = await fetch(`${SummaryApi.baseURL}/api/bancard/transactions/${transaction._id}/status`, {
                method: 'GET',
                credentials: 'include'
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Estado consultado correctamente");
                console.log("Estado de la transacción:", result.data);
                // Opcional: mostrar modal con detalles
            } else {
                toast.error("Error al consultar estado");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error de conexión");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <FaCheckCircle className="text-green-500" />;
            case 'rejected': return <FaTimesCircle className="text-red-500" />;
            case 'rolled_back': return <FaUndo className="text-orange-500" />;
            case 'pending': return <FaClock className="text-yellow-500" />;
            case 'failed': return <FaExclamationTriangle className="text-red-500" />;
            default: return <FaClock className="text-gray-500" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved': return 'Aprobado';
            case 'rejected': return 'Rechazado';
            case 'rolled_back': return 'Reversado';
            case 'pending': return 'Pendiente';
            case 'failed': return 'Fallido';
            default: return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'rolled_back': return 'bg-orange-100 text-orange-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center">
                    <FaCreditCard className="mr-2 text-blue-600" />
                    Transacciones Bancard
                </h1>
                
                <button
                    onClick={fetchTransactions}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                >
                    <FaSyncAlt className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex items-center mb-3">
                    <FaFilter className="mr-2 text-gray-600" />
                    <h3 className="font-medium">Filtros de Búsqueda</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                        </label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendiente</option>
                            <option value="approved">Aprobado</option>
                            <option value="rejected">Rechazado</option>
                            <option value="rolled_back">Reversado</option>
                            <option value="failed">Fallido</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Desde
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Hasta
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Búsqueda
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="ID, descripción, cliente..."
                                className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm"
                            />
                            <FaSearch className="absolute left-2 top-3 text-gray-400 text-sm" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Tabla de transacciones */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando transacciones...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-8 text-center">
                        <FaCreditCard className="text-5xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No se encontraron transacciones.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Venta</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.map((transaction) => (
                                    <tr key={transaction._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">
                                            <div>
                                                <div className="font-medium text-gray-900">#{transaction.shop_process_id}</div>
                                                <div className="text-xs text-gray-500">{transaction.bancard_process_id}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {transaction.customer_info?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {transaction.customer_info?.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <div className="font-medium text-gray-900">
                                                {displayPYGCurrency(transaction.amount)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {transaction.currency}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center">
                                                {getStatusIcon(transaction.status)}
                                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                                                    {getStatusLabel(transaction.status)}
                                                </span>
                                            </div>
                                            {transaction.authorization_number && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Auth: {transaction.authorization_number}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                                            <div>{formatDate(transaction.transaction_date)}</div>
                                            {transaction.confirmation_date && (
                                                <div className="text-xs text-gray-400">
                                                    Conf: {formatDate(transaction.confirmation_date)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {transaction.sale_id ? (
                                                <Link
                                                    to={`/panel-admin/ventas/${transaction.sale_id._id}`}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                                                    title="Ver venta relacionada"
                                                >
                                                    <FaFileInvoiceDollar className="mr-1" />
                                                    {transaction.sale_id.saleNumber}
                                                </Link>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Sin venta</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => checkTransactionStatus(transaction)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Consultar estado"
                                                >
                                                    <FaEye />
                                                </button>
                                                
                                                {transaction.status === 'approved' && !transaction.is_rolled_back && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTransaction(transaction);
                                                            setShowRollbackModal(true);
                                                        }}
                                                        className="text-orange-600 hover:text-orange-800"
                                                        title="Reversar transacción"
                                                    >
                                                        <FaUndo />
                                                    </button>
                                                )}

                                                {transaction.is_rolled_back && (
                                                    <div className="text-xs text-orange-600">
                                                        <div>Reversado</div>
                                                        <div>{formatDate(transaction.rollback_date)}</div>
                                                    </div>
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

            {/* Paginación */}
            {!isLoading && transactions.length > 0 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                                disabled={pagination.page === pagination.pages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Mostrando{' '}
                                    <span className="font-medium">
                                        {((pagination.page - 1) * pagination.limit) + 1}
                                    </span>{' '}
                                    a{' '}
                                    <span className="font-medium">
                                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                                    </span>{' '}
                                    de{' '}
                                    <span className="font-medium">{pagination.total}</span>{' '}
                                    resultados
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                        disabled={pagination.page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Anterior
                                    </button>
                                    
                                    {[...Array(Math.min(5, pagination.pages))].map((_, index) => {
                                        const pageNumber = Math.max(1, pagination.page - 2) + index;
                                        if (pageNumber > pagination.pages) return null;
                                        
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    pageNumber === pagination.page
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}
                                    
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                                        disabled={pagination.page === pagination.pages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Siguiente
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rollback */}
            {showRollbackModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="font-bold text-lg text-gray-800 flex items-center">
                                <FaUndo className="mr-2 text-orange-600" />
                                Reversar Transacción
                            </h2>
                            <button 
                                className="text-2xl text-gray-600 hover:text-black" 
                                onClick={() => {
                                    setShowRollbackModal(false);
                                    setSelectedTransaction(null);
                                    setRollbackReason('');
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center">
                                    <FaExclamationTriangle className="text-yellow-600 mr-2" />
                                    <h3 className="font-medium text-yellow-800">¡Atención!</h3>
                                </div>
                                <p className="text-yellow-700 text-sm mt-1">
                                    Esta acción reversará la transacción #{selectedTransaction.shop_process_id} 
                                    por {displayPYGCurrency(selectedTransaction.amount)}. Esta acción no se puede deshacer.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Razón del rollback *
                                </label>
                                <textarea
                                    value={rollbackReason}
                                    onChange={(e) => setRollbackReason(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    rows="3"
                                    placeholder="Explique el motivo de la reversión..."
                                    required
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div>
                                    <span className="text-gray-600">Cliente:</span>
                                    <div className="font-medium">{selectedTransaction.customer_info?.name}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Fecha:</span>
                                    <div className="font-medium">{formatDate(selectedTransaction.transaction_date)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Autorización:</span>
                                    <div className="font-medium">{selectedTransaction.authorization_number || 'N/A'}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Ambiente:</span>
                                    <div className="font-medium capitalize">{selectedTransaction.environment}</div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRollbackModal(false);
                                        setSelectedTransaction(null);
                                        setRollbackReason('');
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRollback}
                                    disabled={!rollbackReason.trim() || isLoading}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <FaUndo className="mr-2" />
                                            Confirmar Rollback
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BancardTransactions;