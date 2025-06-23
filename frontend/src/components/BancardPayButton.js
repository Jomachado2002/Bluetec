import React, { useState } from 'react';
import { FaCreditCard, FaLock, FaSpinner } from 'react-icons/fa';
import { MdSecurity } from 'react-icons/md';

const BancardPayButton = ({ 
  cartItems = [], 
  totalAmount = 0, 
  customerData = {},
  onPaymentStart = () => {},
  onPaymentSuccess = () => {},
  onPaymentError = () => {},
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: customerData.name || '',
    email: customerData.email || '',
    phone: customerData.phone || '',
    address: customerData.address || ''
  });
  const [errors, setErrors] = useState({});

  // Función para formatear moneda PYG
  const displayPYGCurrency = (num) => {
    const formatter = new Intl.NumberFormat('es-PY', {
        style: "currency",
        currency: 'PYG',
        minimumFractionDigits: 0
    });
    return formatter.format(num);
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    
    if (cartItems.length === 0) {
      newErrors.cart = 'No hay productos en el carrito';
    }
    
    if (totalAmount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo específico
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Procesar pago con Bancard
  const processPayment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    onPaymentStart();

    try {
      // ✅ VERIFICAR URL DEL BACKEND
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      console.log('🔗 URL del backend:', backendUrl);
      
      if (!backendUrl) {
        throw new Error('REACT_APP_BACKEND_URL no está configurada');
      }

      // Preparar datos para el backend
      const paymentRequest = {
        amount: totalAmount.toFixed(2),
        currency: 'PYG',
        description: `Compra en BlueTec - ${cartItems.length} productos`,
        customer_info: formData,
        items: cartItems.map(item => ({
          name: item.productId?.productName || item.name || 'Producto',
          quantity: item.quantity,
          unitPrice: item.productId?.sellingPrice || item.unitPrice || 0,
          total: (item.productId?.sellingPrice || item.unitPrice || 0) * item.quantity
        }))
      };

      console.log('📤 Enviando solicitud de pago a Bancard:');
      console.log('URL:', `${backendUrl}/api/bancard/create-payment`);
      console.log('Payload:', paymentRequest);

      // Llamar a la API para crear el pago
      const response = await fetch(`${backendUrl}/api/bancard/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(paymentRequest)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      // ✅ VERIFICAR SI LA RESPUESTA ES VÁLIDA
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('📥 Response body:', result);

      if (result.success && result.data) {
        console.log('✅ Pago creado exitosamente:', result.data);
        
        // Redirigir al iframe de Bancard
        if (result.data.iframe_url) {
          console.log('🔗 Redirigiendo a Bancard:', result.data.iframe_url);
          
          // Guardar datos del pago para referencia
          sessionStorage.setItem('bancard_payment', JSON.stringify({
            shop_process_id: result.data.shop_process_id,
            amount: totalAmount,
            customer: formData,
            timestamp: Date.now()
          }));
          
          // Redirigir a Bancard
          window.location.href = result.data.iframe_url;
          
          onPaymentSuccess(result.data);
        } else {
          throw new Error('No se recibió URL de pago de Bancard');
        }
      } else {
        console.error('❌ Error en resultado:', result);
        throw new Error(result.message || 'Error al crear el pago');
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      
      // ✅ DETERMINAR TIPO DE ERROR
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🚫 Error de conexión - Backend no disponible');
        alert('No se puede conectar con el servidor. Verifica que el backend esté funcionando en el puerto 8080.');
      } else if (error.message.includes('HTTP 404')) {
        console.error('🚫 Endpoint no encontrado');
        alert('El endpoint de pago no existe. Verifica las rutas del backend.');
      } else if (error.message.includes('HTTP 500')) {
        console.error('🚫 Error interno del servidor');
        alert('Error interno del servidor. Revisa los logs del backend.');
      } else {
        console.error('🚫 Error desconocido:', error.message);
        alert(`Error al procesar el pago: ${error.message}`);
      }
      
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  // Si el formulario está visible
  if (showForm) {
    return (
      <div className="space-y-4">
        {/* Resumen */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Resumen del pago</h3>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Total a pagar:</span>
            <span className="font-bold text-blue-800">{displayPYGCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Productos:</span>
            <span className="text-blue-800">{cartItems.length} items</span>
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-lg p-3 text-xs">
            <p><strong>Backend URL:</strong> {process.env.REACT_APP_BACKEND_URL || 'NO CONFIGURADA'}</p>
            <p><strong>Monto:</strong> {totalAmount}</p>
            <p><strong>Items:</strong> {cartItems.length}</p>
          </div>
        )}

        {/* Formulario de datos */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Datos del comprador</h3>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Tu nombre completo"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="tu@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+595 XXX XXXXXX"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Dirección (opcional)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Tu dirección de entrega"
            />
          </div>
        </div>

        {/* Información de seguridad */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 text-green-800 mb-1">
            <FaLock className="text-sm" />
            <span className="font-semibold text-sm">Pago 100% seguro</span>
          </div>
          <p className="text-green-700 text-xs">
            Procesado por Bancard, la plataforma de pagos más confiable de Paraguay.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          
          <button
            onClick={processPayment}
            disabled={loading || disabled}
            className="flex-2 bg-[#2A3190] text-white py-3 px-4 rounded-lg hover:bg-[#1e236b] transition-all duration-300 flex items-center justify-center gap-2 font-semibold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <FaCreditCard />
                Pagar con Bancard
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Vista inicial del botón
  return (
    <div className="space-y-3">
      {/* Botón principal de Bancard */}
      <button
        onClick={() => setShowForm(true)}
        disabled={disabled || cartItems.length === 0 || totalAmount <= 0}
        className="w-full bg-[#2A3190] text-white py-4 rounded-lg hover:bg-[#1e236b] transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaCreditCard className="text-xl" />
        <span>Pagar con Bancard</span>
        <span className="text-sm font-normal">
          ({displayPYGCurrency(totalAmount)})
        </span>
      </button>

      {/* Información de Bancard */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex items-center justify-center gap-2 text-blue-800 mb-2">
          <MdSecurity className="text-lg" />
          <span className="font-semibold text-sm">Pago seguro con Bancard</span>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          <div className="flex items-center justify-center gap-4">
            <span>✓ Tarjetas de crédito</span>
            <span>✓ Tarjetas de débito</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <span>✓ Billeteras digitales</span>
            <span>✓ Transferencias</span>
          </div>
        </div>
      </div>

      {/* Certificaciones de seguridad */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <FaLock className="text-green-500" />
          <span>Cifrado SSL</span>
        </div>
        <div className="flex items-center gap-1">
          <MdSecurity className="text-green-500" />
          <span>PCI DSS</span>
        </div>
      </div>

      {/* Errores de validación generales */}
      {errors.cart && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{errors.cart}</p>
        </div>
      )}
      
      {errors.amount && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{errors.amount}</p>
        </div>
      )}
    </div>
  );
};

export default BancardPayButton;