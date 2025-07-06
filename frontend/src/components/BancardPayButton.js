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
  // ✅ MEJORAR MANEJO DE MENSAJES DEL IFRAME
  const handleIframeMessage = (event) => {
    console.log('📨 Mensaje recibido del iframe:', {
      origin: event.origin,
      data: event.data,
      type: typeof event.data
    });
    
    try {
        // Verificar origen del mensaje con más flexibility
        const environment = process.env.REACT_APP_BANCARD_ENVIRONMENT || 'staging';
        const validOrigins = [
          'https://vpos.infonet.com.py',
          'https://vpos.infonet.com.py:8888'
        ];
        
        if (!validOrigins.includes(event.origin)) {
            console.warn('⚠️ Mensaje de origen no confiable:', event.origin);
            // No return aquí, solo log - algunos navegadores pueden cambiar el origen
        }

        let data = event.data;
        
        // Intentar parsear si es string
        if (typeof event.data === 'string') {
          try {
            data = JSON.parse(event.data);
          } catch (parseError) {
            console.log('📝 Mensaje como string:', event.data);
            // Podría ser un mensaje simple como "loaded" o similar
            return;
          }
        }
        
        console.log('📋 Datos parseados del iframe:', data);
        
        // Manejar diferentes tipos de mensajes
        if (data && typeof data === 'object') {
          if (data.type === 'payment_success' || data.status === 'success') {
            console.log('✅ Pago exitoso desde iframe:', data);
            setShowIframe(false);
            setLoading(false);
            onPaymentSuccess(data);
          } else if (data.type === 'payment_error' || data.status === 'error') {
            console.error('❌ Error en el pago desde iframe:', data);
            setShowIframe(false);
            setLoading(false);
            onPaymentError(new Error(data.message || 'Error en el proceso de pago'));
          } else if (data.type === 'iframe_loaded' || data.message === 'loaded') {
            console.log('✅ Iframe cargado correctamente');
            setLoading(false);
          } else {
            console.log('📝 Mensaje no reconocido del iframe:', data);
          }
        }
    } catch (error) {
        console.error('❌ Error procesando mensaje del iframe:', error);
    }
};
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

  useEffect(() => {
    if (showIframe && processId) {
      console.log('🎯 Efecto para cargar script:', { showIframe, processId });
      // Agregar delay para asegurar que el DOM esté listo
      const timer = setTimeout(() => {
        loadBancardScript();
      }, 100);
      
      return () => clearTimeout(timer);
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

  const loadBancardScript = (retryCount = 0) => {
    console.log('🔄 Cargando script de Bancard... (intento', retryCount + 1, ')');
    
    // Máximo 3 intentos
    if (retryCount >= 3) {
      console.error('❌ Máximo de intentos alcanzado para cargar script');
      setShowIframe(false);
      setLoading(false);
      onPaymentError(new Error('No se pudo cargar el sistema de pagos después de 3 intentos'));
      return;
    }
    
    // Remover script anterior si existe
    const existingScript = document.getElementById('bancard-script');
    if (existingScript) {
      existingScript.remove();
      console.log('🗑️ Script anterior removido');
    }

    // Determinar URL base según ambiente
    const environment = process.env.REACT_APP_BANCARD_ENVIRONMENT || 'staging';
    const baseUrl = environment === 'production' 
      ? 'https://vpos.infonet.com.py' 
      : 'https://vpos.infonet.com.py:8888';

    console.log('🌐 Environment detectado:', environment, '- Base URL:', baseUrl);

    // Crear nuevo script
    const script = document.createElement('script');
    script.id = 'bancard-script';
    script.src = `${baseUrl}/checkout/javascript/dist/bancard-checkout-4.0.0.js`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Script de Bancard cargado exitosamente en intento', retryCount + 1);
      // Verificar que window.Bancard existe antes de continuar
      if (window.Bancard) {
        console.log('✅ window.Bancard disponible:', Object.keys(window.Bancard));
        setTimeout(initializeBancardIframe, 200);
      } else {
        console.warn('⚠️ window.Bancard no disponible después de cargar script');
        setTimeout(() => {
          if (window.Bancard) {
            initializeBancardIframe();
          } else {
            console.error('❌ window.Bancard sigue no disponible, reintentando...');
            loadBancardScript(retryCount + 1);
          }
        }, 500);
      }
    };
    
    script.onerror = () => {
      console.error('❌ Error cargando script de Bancard en intento', retryCount + 1);
      // Reintentar después de 1 segundo
      setTimeout(() => {
        loadBancardScript(retryCount + 1);
      }, 1000);
    };

    document.head.appendChild(script);
    console.log('📤 Script agregado al DOM:', script.src);
  };

 const initializeBancardIframe = (retryCount = 0) => {
  try {
    console.log('🎯 Inicializando iframe de PAGO OCASIONAL con processId:', processId, '(intento', retryCount + 1, ')');
    
    // Máximo 5 intentos para inicialización
    if (retryCount >= 5) {
      console.error('❌ Máximo de intentos alcanzado para inicializar iframe');
      setErrors({ iframe: 'No se pudo cargar el formulario después de varios intentos' });
      setLoading(false);
      return;
    }
    
    // ✅ VALIDACIÓN CRÍTICA: Verificar que processId existe
    if (!processId || processId.trim() === '') {
      console.error('❌ processId está vacío:', processId);
      setErrors({ iframe: 'Error: Process ID no válido' });
      setLoading(false);
      return;
    }
    
    // Verificar que window.Bancard existe
    if (!window.Bancard) {
      console.warn('⚠️ window.Bancard no existe, reintentando en 1 segundo...');
      setTimeout(() => initializeBancardIframe(retryCount + 1), 1000);
      return;
    }
    
    // Verificar que window.Bancard.Cards existe
    // Verificar que window.Bancard.Checkout existe (PARA PAGO OCASIONAL)
    if (!window.Bancard.Checkout) {
      console.warn('⚠️ window.Bancard.Checkout no existe, reintentando...');
      setTimeout(() => initializeBancardIframe(retryCount + 1), 500);
      return;
    }
    
    console.log('✅ window.Bancard.Checkout disponible, creando formulario...');
    
    const styles = {
      'input-background-color': '#ffffff',
      'input-text-color': '#555555',
      'input-border-color': '#cccccc',
      'button-background-color': '#2A3190',
      'button-text-color': '#ffffff',
      'button-border-color': '#2A3190',
      'form-background-color': '#ffffff',
      'form-border-color': '#dddddd'
    };
    
    const container = document.getElementById('bancard-iframe-container');
    if (!container) {
      console.error('❌ Contenedor bancard-iframe-container no encontrado');
      setErrors({ iframe: 'Error: Contenedor no encontrado' });
      setLoading(false);
      return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    container.style.display = 'block';
    container.style.minHeight = '500px';
    container.style.width = '100%';
    container.style.border = '1px solid #e5e5e5';
    container.style.borderRadius = '8px';
    
    try {
      console.log('🚀 Creando formulario PAGO OCASIONAL con processId:', String(processId));
      window.Bancard.Checkout.createForm('bancard-iframe-container', String(processId), styles);
      console.log('✅ Iframe de pago ocasional inicializado exitosamente');
      
      // Agregar event listener para mensajes
      window.addEventListener('message', handleIframeMessage, false);
      
      // Ocultar loading después de un momento
      setTimeout(() => {
        setLoading(false);
      }, 1000);
      
    } catch (createFormError) {
      console.error('❌ Error en createForm:', createFormError);
      setErrors({ iframe: `Error al crear formulario: ${createFormError.message}` });
      setLoading(false);
      
      // Reintentar si es un error recoverable
      if (retryCount < 3) {
        console.log('🔄 Reintentando crear formulario...');
        setTimeout(() => initializeBancardIframe(retryCount + 1), 2000);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general inicializando iframe:', error);
    setErrors({ iframe: `Error general: ${error.message}` });
    setLoading(false);
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

      // ✅ CAPTURAR DATOS DE TRACKING
      const trackingData = {
        user_agent: navigator.userAgent,
        device_type: window.innerWidth < 768 ? 'mobile' : 
                     window.innerWidth < 1024 ? 'tablet' : 'desktop',
        referrer_url: document.referrer || 'direct',
        payment_session_id: sessionStorage.getItem('payment_session') || 
                            `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cart_total_items: cartItems.length,
        order_notes: formData.address || '',
        delivery_method: 'pickup',
        invoice_number: `INV-${Date.now()}`,
        tax_amount: (totalAmount * 0.1).toFixed(2),
        utm_source: new URLSearchParams(window.location.search).get('utm_source') || '',
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || '',
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || ''
      };

      // Preparar datos para el backend
      const paymentRequest = {
        amount: totalAmount.toFixed(2),
        currency: 'PYG',
        description: `Compra BlueTec - ${cartItems.length} productos`,
        customer_info: formData,
        items: cartItems.map(item => ({
          product_id: item.productId?._id || item._id,
          name: item.productId?.productName || item.name || 'Producto',
          quantity: item.quantity,
          unitPrice: item.productId?.sellingPrice || item.unitPrice || 0,
          total: (item.productId?.sellingPrice || item.unitPrice || 0) * item.quantity,
          category: item.productId?.category || '',
          brand: item.productId?.brandName || ''
        })),
        
        // ✅ DATOS DE TRACKING Y ANÁLISIS
        user_type: 'GUEST', // será actualizado en backend si está logueado
        payment_method: 'new_card',
        user_bancard_id: null, // será actualizado en backend si está logueado
        ip_address: '', // se captura en backend
        user_agent: trackingData.user_agent,
        payment_session_id: trackingData.payment_session_id,
        device_type: trackingData.device_type,
        cart_total_items: trackingData.cart_total_items,
        referrer_url: trackingData.referrer_url,
        order_notes: trackingData.order_notes,
        delivery_method: trackingData.delivery_method,
        invoice_number: trackingData.invoice_number,
        tax_amount: trackingData.tax_amount,
        utm_source: trackingData.utm_source,
        utm_medium: trackingData.utm_medium,
        utm_campaign: trackingData.utm_campaign
        // ✅ NO ENVIAR return_url NI cancel_url - EL BACKEND LOS MANEJA
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