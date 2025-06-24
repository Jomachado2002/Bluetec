import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaLock, FaSpinner, FaTimes } from 'react-icons/fa';
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
  const [showIframe, setShowIframe] = useState(false);
  const [processId, setProcessId] = useState('');
  const [formData, setFormData] = useState({
    name: customerData.name || '',
    email: customerData.email || '',
    phone: customerData.phone || '',
    address: customerData.address || ''
  });
  const [errors, setErrors] = useState({});

  // ✅ DEBUG: Verificar configuración al montar
  useEffect(() => {
    console.log('🔧 DEBUG - Configuración BancardPayButton:', {
      backendUrl: process.env.REACT_APP_BACKEND_URL,
      environment: process.env.REACT_APP_BANCARD_ENVIRONMENT,
      totalAmount,
      cartItemsCount: cartItems.length,
      customerData,
      disabled
    });
  }, [totalAmount, cartItems.length, customerData, disabled]);

  // ✅ CARGAR SCRIPT DE BANCARD CUANDO NECESITEMOS EL IFRAME
  useEffect(() => {
    if (showIframe && processId) {
      loadBancardScript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIframe, processId]);

  // ✅ LIMPIAR SCRIPT AL DESMONTAR
  useEffect(() => {
    return () => {
      const script = document.getElementById('bancard-script');
      if (script) {
        script.remove();
      }
    };
  }, []);

  const loadBancardScript = () => {
    console.log('🔄 Cargando script de Bancard...');
    
    // Remover script anterior si existe
    const existingScript = document.getElementById('bancard-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Determinar URL base según ambiente
    const environment = process.env.REACT_APP_BANCARD_ENVIRONMENT || 'staging';
    const baseUrl = environment === 'production' 
      ? 'https://vpos.infonet.com.py' 
      : 'https://vpos.infonet.com.py:8888';

    // Crear nuevo script
    const script = document.createElement('script');
    script.id = 'bancard-script';
    script.src = `${baseUrl}/checkout/javascript/dist/bancard-checkout-4.0.0.js`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Script de Bancard cargado exitosamente');
      setTimeout(initializeBancardIframe, 100); // Pequeño delay para asegurar carga
    };
    
    script.onerror = () => {
      console.error('❌ Error cargando script de Bancard');
      setShowIframe(false);
      setLoading(false);
      onPaymentError(new Error('Error cargando el sistema de pagos'));
    };

    document.head.appendChild(script);
  };

  const initializeBancardIframe = () => {
    try {
      if (window.Bancard && window.Bancard.Checkout) {
        console.log('🎯 Inicializando iframe de Bancard con processId:', processId);
        
        // ✅ ESTILOS COMPLETOS COMO EN TU EJEMPLO
        const styles = {
          'input-background-color': '#ffffff',
          'input-text-color': '#555555',
          'input-border-color': '#cccccc',
          'button-background-color': '#2A3190', // Color BlueTec
          'button-text-color': '#ffffff',
          'button-border-color': '#2A3190',
          'form-background-color': '#ffffff',
          'form-border-color': '#dddddd',
          'header-background-color': '#f5f5f5',
          'header-text-color': '#333333',
          'hr-border-color': '#eeeeee',
          'label-kyc-text-color': '#555555',
          'input-error-color': '#b50b0b',
          'input-cvv-color': '#0a0a0a',
          'input-border-radius': '5px',
          'form-font-size': '1rem',
          'form-font-family': '',
          'floating-placeholder': 'true',
          'label-text-color': '#555555',
          'tab-main-color': '#2A3190',
          'tab-background-color': '#ffffff'
        };

        // Limpiar contenedor
        const container = document.getElementById('bancard-iframe-container');
        if (container) {
          container.innerHTML = '';
          
          // ✅ ASEGURAR QUE EL CONTENEDOR SEA VISIBLE
          container.style.display = 'block';
          container.style.minHeight = '500px';
          container.style.width = '100%';
          
          // ✅ CREAR EL IFRAME DE BANCARD
          try {
            window.Bancard.Checkout.createForm('bancard-iframe-container', processId, styles);
            console.log('✅ Iframe de Bancard inicializado exitosamente');
            
            // ✅ VERIFICAR QUE EL IFRAME SE HAYA CREADO
            setTimeout(() => {
              const iframe = container.querySelector('iframe');
              if (iframe) {
                console.log('✅ Iframe encontrado:', iframe);
                iframe.style.width = '100%';
                iframe.style.minHeight = '500px';
                iframe.style.border = 'none';
              } else {
                console.log('⚠️ No se encontró iframe, verificando contenido del contenedor...');
                console.log('Contenido del contenedor:', container.innerHTML);
              }
              setLoading(false);
            }, 1000);
            
          } catch (iframeError) {
            console.error('❌ Error creando iframe:', iframeError);
            setLoading(false);
          }
          
        } else {
          console.error('❌ Contenedor bancard-iframe-container no encontrado');
          setLoading(false);
        }
      } else {
        console.log('⏳ window.Bancard no disponible aún, reintentando...');
        setTimeout(initializeBancardIframe, 1000); // Aumentar tiempo de espera
      }
    } catch (error) {
      console.error('❌ Error inicializando iframe de Bancard:', error);
      setLoading(false);
      onPaymentError(error);
    }
  };

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

  // ✅ PROCESAR PAGO CON BANCARD
  const processPayment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    onPaymentStart();

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      console.log('🔗 Configuración de pago:', {
        backendUrl,
        totalAmount,
        customerData: formData
      });
      
      if (!backendUrl) {
        throw new Error('REACT_APP_BACKEND_URL no está configurada. Verifica tu archivo .env.local');
      }

      // ✅ VERIFICAR CONEXIÓN CON BACKEND PRIMERO
      console.log('🔍 Verificando conexión con backend...');
      try {
        const healthResponse = await fetch(`${backendUrl}/api/bancard/health`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!healthResponse.ok) {
          throw new Error(`Backend no disponible (${healthResponse.status})`);
        }
        
        const healthData = await healthResponse.json();
        console.log('✅ Backend disponible:', healthData);
      } catch (healthError) {
        console.error('❌ Error de conexión con backend:', healthError);
        throw new Error('No se puede conectar con el servidor. Verifica que el backend esté ejecutándose en el puerto 8080.');
      }

      // Preparar datos para el backend
      const paymentRequest = {
        amount: totalAmount.toFixed(2),
        currency: 'PYG',
        description: `Compra BlueTec - ${cartItems.length} productos`,
        customer_info: formData,
        items: cartItems.map(item => ({
          name: item.productId?.productName || item.name || 'Producto',
          quantity: item.quantity,
          unitPrice: item.productId?.sellingPrice || item.unitPrice || 0,
          total: (item.productId?.sellingPrice || item.unitPrice || 0) * item.quantity
        }))
      };

      console.log('📤 Enviando solicitud de pago:', paymentRequest);

      // ✅ LLAMAR A LA API PARA CREAR EL PAGO
      const response = await fetch(`${backendUrl}/api/bancard/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(paymentRequest)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorMessage = `Error HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('📥 Respuesta del backend:', result);

      if (result.success && result.data && result.data.process_id) {
        console.log('✅ Pago creado exitosamente:', result.data);
        
        // ✅ MOSTRAR IFRAME EN LUGAR DE REDIRECCIONAR
        setProcessId(result.data.process_id);
        setShowForm(false);
        setShowIframe(true);
        
        // Guardar datos del pago para referencia
        sessionStorage.setItem('bancard_payment', JSON.stringify({
          shop_process_id: result.data.shop_process_id,
          process_id: result.data.process_id,
          amount: totalAmount,
          customer: formData,
          timestamp: Date.now()
        }));
        
        onPaymentSuccess(result.data);
      } else {
        console.error('❌ Respuesta inválida:', result);
        throw new Error(result.message || 'La respuesta del servidor no contiene los datos necesarios');
      }
    } catch (error) {
      console.error('❌ Error completo en processPayment:', error);
      setLoading(false);
      
      let userMessage = 'Error desconocido';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userMessage = 'No se puede conectar con el servidor. Verifica que el backend esté funcionando.';
      } else if (error.message.includes('REACT_APP_BACKEND_URL')) {
        userMessage = 'Error de configuración. Contacta al soporte técnico.';
      } else if (error.message.includes('Backend no disponible')) {
        userMessage = 'El servidor de pagos no está disponible. Intenta nuevamente en unos minutos.';
      } else {
        userMessage = error.message;
      }
      
      alert(`Error al procesar el pago: ${userMessage}`);
      onPaymentError(error);
    }
  };

  // ✅ CERRAR IFRAME
  const closeIframe = () => {
    setShowIframe(false);
    setProcessId('');
    setLoading(false);
    
    // Limpiar script
    const script = document.getElementById('bancard-script');
    if (script) {
      script.remove();
    }
  };

  // ✅ SI MOSTRAMOS EL IFRAME
  if (showIframe) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header del modal */}
          <div className="flex justify-between items-center p-4 border-b bg-[#2A3190] text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaLock />
              Pago Seguro - Bancard
            </h2>
            <button
              onClick={closeIframe}
              className="text-white hover:text-gray-200 text-xl"
            >
              <FaTimes />
            </button>
          </div>

          {/* Información del pago */}
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total a pagar:</span>
              <span className="font-bold text-xl text-[#2A3190]">
                {displayPYGCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Contenedor del iframe de Bancard */}
          <div className="p-4">
            {loading && (
              <div className="text-center py-8">
                <FaSpinner className="animate-spin text-3xl text-[#2A3190] mx-auto mb-4" />
                <p className="text-gray-600">Cargando formulario de pago...</p>
              </div>
            )}
            
            {/* ✅ CONTENEDOR PARA EL IFRAME DE BANCARD - MEJORADO */}
            <div 
              id="bancard-iframe-container" 
              className="w-full"
              style={{ 
                display: loading ? 'none' : 'block',
                minHeight: '500px',
                width: '100%',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}
            >
              {/* El iframe se cargará aquí */}
              {!loading && (
                <div className="p-4 text-center text-gray-500">
                  <p>Cargando formulario de pago seguro...</p>
                  <p className="text-sm mt-2">Si no aparece el formulario, verifica tu conexión.</p>
                </div>
              )}
            </div>
            
            {/* ✅ BOTÓN DE RESPALDO EN CASO DE PROBLEMAS */}
            {!loading && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    console.log('🔄 Reintentando cargar iframe...');
                    setLoading(true);
                    setTimeout(() => {
                      initializeBancardIframe();
                    }, 500);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  ¿No aparece el formulario? Haz clic para recargar
                </button>
              </div>
            )}
          </div>

          {/* Footer con información de seguridad */}
          <div className="p-4 bg-gray-50 border-t text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <FaLock />
              <span className="text-sm font-medium">Conexión segura SSL</span>
            </div>
            <p className="text-xs text-gray-500">
              Tus datos están protegidos por Bancard
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SI EL FORMULARIO ESTÁ VISIBLE
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

  // ✅ VISTA INICIAL DEL BOTÓN
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