// frontend/src/components/user/UserPurchases.js
import React, { useState, useEffect } from 'react';
import { 
  FaShoppingBag, 
  FaEye, 
  FaFilter, 
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUndo,
  FaExclamationTriangle
} from 'react-icons/fa';
import displayPYGCurrency from '../../helpers/displayCurrency';

const UserPurchases = ({ user }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    paymentMethod: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserPurchases();
    }
  }, [user, filters]);

  const fetchUserPurchases = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Filtrar por usuario
      if (user.bancardUserId) {
        queryParams.append('user_bancard_id', user.bancardUserId);
      }
      
      // Agregar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bancard/transactions?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });

      const result = await response.json();
      if (result.success) {
        setPurchases(result.data.transactions || []);
      }
    } catch (error) {
      console.error('Error al cargar compras:', error);
    } finally {
      setLoading(false);
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
      case 'approved': return 'Pagado';
      case 'rejected': return 'Rechazado';
      case 'rolled_back': return 'Devuelto';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      paymentMethod: ''
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-[#2A3190] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2A3190] flex items-center gap-3">
              <FaShoppingBag className="text-xl" />
              Mis Compras
            </h1>
            <p className="text-gray-600 mt-1">
              {purchases.length > 0 
                ? `Tienes ${purchases.length} compra${purchases.length !== 1 ? 's' : ''} registrada${purchases.length !== 1 ? 's' : ''}`
                : 'No tienes compras registradas'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <FaFilter className="mr-2 text-gray-600" />
          <h3 className="font-medium">Filtrar Compras</h3>
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
              <option value="approved">Pagado</option>
              <option value="pending">Pendiente</option>
              <option value="rejected">Rechazado</option>
              <option value="rolled_back">Devuelto</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Método de Pago</label>
            <select
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A3190]"
            >
              <option value="">Todos</option>
              <option value="saved_card">Tarjeta Guardada</option>
              <option value="new_card">Nueva Tarjeta</option>
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

      {/* Lista de compras */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes compras registradas</h3>
            <p className="text-gray-500">Tus futuras compras aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div key={purchase._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        Compra #{purchase.shop_process_id}
                      </h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(purchase.status)}
                        <span className={`text-sm font-medium ${
                          purchase.status === 'approved' ? 'text-green-600' :
                          purchase.status === 'rejected' ? 'text-red-600' :
                          purchase.status === 'rolled_back' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {getStatusLabel(purchase.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="text-xs" />
                        <span>{formatDate(purchase.transaction_date)}</span>
                      </div>
                      <div>
                        💳 {purchase.payment_method === 'saved_card' ? 'Tarjeta Guardada' : 'Nueva Tarjeta'}
                      </div>
                      <div>
                        📦 {purchase.cart_total_items || purchase.items?.length || 0} productos
                      </div>
                    </div>

                    {purchase.items && purchase.items.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-600">
                          🛍️ {purchase.items.slice(0, 2).map(item => item.name).join(', ')}
                          {purchase.items.length > 2 && ` y ${purchase.items.length - 2} más`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Monto y acciones */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#2A3190]">
                        {displayPYGCurrency(purchase.amount)}
                      </div>
                      {purchase.invoice_number && (
                        <div className="text-xs text-gray-500">
                          📄 {purchase.invoice_number}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPurchase(purchase);
                        setShowDetailsModal(true);
                      }}
                      className="bg-[#2A3190] text-white px-4 py-2 rounded-lg hover:bg-[#1e236b] transition-colors flex items-center gap-2"
                    >
                      <FaEye className="text-sm" />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailsModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-[#2A3190]">
                Detalles de Compra #{selectedPurchase.shop_process_id}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-96">
              
              {/* Información de la compra */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-gray-600">📅 Fecha:</span>
                  <div className="font-medium">{formatDate(selectedPurchase.transaction_date)}</div>
                </div>
                <div>
                  <span className="text-gray-600">💳 Método:</span>
                  <div className="font-medium">
                    {selectedPurchase.payment_method === 'saved_card' ? 'Tarjeta Guardada' : 'Nueva Tarjeta'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">🏦 Autorización:</span>
                  <div className="font-medium">{selectedPurchase.authorization_number || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">📱 Dispositivo:</span>
                  <div className="font-medium capitalize">{selectedPurchase.device_type || 'N/A'}</div>
                </div>
              </div>

              {/* Productos */}
              {selectedPurchase.items && selectedPurchase.items.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">🛍️ Productos:</h3>
                  <div className="space-y-3">
                    {selectedPurchase.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border border-gray-200 rounded-lg p-3">
                        <div>
                          <h4 className="font-medium text-gray-800">{item.name}</h4>
                          <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{displayPYGCurrency(item.total || (item.quantity * item.unitPrice))}</div>
                          <div className="text-sm text-gray-500">{displayPYGCurrency(item.unitPrice)} c/u</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen de pago */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold text-[#2A3190]">
                  <span>Total Pagado:</span>
                  <span>{displayPYGCurrency(selectedPurchase.amount)}</span>
                </div>
                {selectedPurchase.tax_amount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>IVA incluido:</span>
                    <span>{displayPYGCurrency(selectedPurchase.tax_amount)}</span>
                  </div>
                )}
              </div>

              {/* Notas del pedido */}
              {selectedPurchase.order_notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-1">📝 Notas:</h4>
                  <p className="text-yellow-700 text-sm">{selectedPurchase.order_notes}</p>
                </div>
              )}

              {/* Información de entrega */}
              {selectedPurchase.delivery_method && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">🚚 Método de Entrega:</h4>
                  <p className="text-blue-700 text-sm capitalize">{selectedPurchase.delivery_method}</p>
                </div>
              )}
            </div>

            <div className="border-t p-4 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPurchases;
