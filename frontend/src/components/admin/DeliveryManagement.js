// frontend/src/components/admin/DeliveryManagement.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaTruck, FaCalendarAlt, FaEnvelope, FaSpinner } from 'react-icons/fa';
import { deliveryStatuses, getNextStatus } from '../../helpers/deliveryHelpers';

const DeliveryManagement = ({ transaction, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    delivery_status: transaction.delivery_status || 'payment_confirmed',
    delivery_notes: '',
    estimated_delivery_date: '',
    tracking_number: transaction.tracking_number || '',
    courier_company: transaction.courier_company || '',
    notify_customer: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bancard/transactions/${transaction._id}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`✅ Estado actualizado a: ${deliveryStatuses[formData.delivery_status]?.title}`);
        if (formData.notify_customer) {
          toast.info('📧 Email enviado al cliente');
        }
        onUpdate();
        onClose();
      } else {
        toast.error(result.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-[#2A3190] flex items-center gap-2">
            <FaTruck />
            Gestionar Delivery
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Pedido Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium">Pedido #{transaction.shop_process_id}</p>
            <p className="text-sm text-gray-600">{transaction.customer_info?.name}</p>
          </div>

          {/* Estado Actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Delivery</label>
            <select
              name="delivery_status"
              value={formData.delivery_status}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2A3190] focus:border-[#2A3190]"
              required
            >
              {Object.entries(deliveryStatuses).map(([key, status]) => (
                <option key={key} value={key}>
                  {status.icon} {status.title}
                </option>
              ))}
            </select>
          </div>

          {/* Tracking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número de Tracking</label>
            <input
              type="text"
              name="tracking_number"
              value={formData.tracking_number}
              onChange={handleChange}
              placeholder="Ej: TRK123456789"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2A3190] focus:border-[#2A3190]"
            />
          </div>

          {/* Courier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Empresa de Courier</label>
            <select
              name="courier_company"
              value={formData.courier_company}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2A3190] focus:border-[#2A3190]"
            >
              <option value="">Seleccionar courier</option>
              <option value="Courier Interno">Courier Interno</option>
              <option value="Servientrega">Servientrega</option>
              <option value="DHL">DHL</option>
              <option value="FedEx">FedEx</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Fecha Estimada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaCalendarAlt />
              Fecha Estimada de Entrega
            </label>
            <input
              type="datetime-local"
              name="estimated_delivery_date"
              value={formData.estimated_delivery_date}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2A3190] focus:border-[#2A3190]"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas para el Cliente</label>
            <textarea
              name="delivery_notes"
              value={formData.delivery_notes}
              onChange={handleChange}
              rows="3"
              placeholder="Ej: El pedido saldrá mañana por la mañana"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2A3190] focus:border-[#2A3190]"
            />
          </div>

          {/* Notificar Cliente */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="notify_customer"
              checked={formData.notify_customer}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <FaEnvelope />
              Enviar email de notificación al cliente
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#2A3190] text-white rounded-lg hover:bg-[#1e236b] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : '✅'}
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryManagement;