import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaWhatsapp, FaEnvelope, FaPhone, FaHome } from 'react-icons/fa';
import { MdDownload, MdPrint } from 'react-icons/md';

const PaymentSuccess = () => {
  const [paymentInfo, setPaymentInfo] = useState({
    shop_process_id: '',
    amount: 0,
    status: 'unknown'
  });
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);

  // Función para obtener parámetros de URL
  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      processId: urlParams.get('shop_process_id') || urlParams.get('id'),
      status: urlParams.get('status') || 'success',
      amount: urlParams.get('amount') || '0'
    };
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

  // Helper para limpiar carrito
  const clearLocalCart = () => {
    try {
      localStorage.removeItem('cartItems');
      if (window.fetchUserAddToCart) {
        window.fetchUserAddToCart();
      }
    } catch (error) {
      console.error('Error limpiando carrito:', error);
    }
  };

  useEffect(() => {
    // Obtener parámetros de la URL
    const { processId, status, amount } = getUrlParams();

    console.log('Parámetros recibidos:', { processId, status, amount });

    setPaymentInfo({
      shop_process_id: processId,
      amount: parseFloat(amount),
      status: status
    });

    // Verificar el estado del pago con el backend (opcional)
    if (processId) {
      verifyPaymentStatus(processId);
    }

    // Limpiar carrito después del pago exitoso
    setTimeout(() => {
      clearLocalCart();
    }, 2000);

    setLoading(false);
  }, []);

  const verifyPaymentStatus = async (processId) => {
    try {
      // Aquí podrías hacer una llamada a tu backend para verificar el estado
      // const response = await fetch(`/api/bancard/status/${processId}`);
      // const result = await response.json();
      console.log('Verificando estado del pago:', processId);
    } catch (error) {
      console.error('Error verificando estado del pago:', error);
    }
  };

  const contactWhatsApp = () => {
    const message = `Hola! Acabo de realizar un pago exitoso en BlueTec.%0A%0AID de transacción: ${paymentInfo.shop_process_id}%0AMonto: ${displayPYGCurrency(paymentInfo.amount)}%0A%0APor favor confirmen el proceso y el estado de mi pedido. Gracias!`;
    window.open(`https://wa.me/595984133733?text=${message}`, '_blank');
  };

  const sendEmail = () => {
    const subject = `Confirmación de pago - ${paymentInfo.shop_process_id}`;
    const body = `Estimados,%0A%0AAcabo de realizar un pago exitoso en BlueTec:%0A%0AID de transacción: ${paymentInfo.shop_process_id}%0AMonto: ${displayPYGCurrency(paymentInfo.amount)}%0A%0APor favor confirmen el proceso y me informen sobre el estado de mi pedido.%0A%0AGracias!`;
    window.location.href = `mailto:ventas@bluetec.com.py?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Mensaje de éxito */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8 border-l-4 border-green-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-4xl text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            ¡Pago Realizado con Éxito!
          </h1>
          
          <p className="text-gray-600 text-lg mb-6">
            Tu pago ha sido procesado correctamente. En breve nos pondremos en contacto contigo.
          </p>

          {/* Detalles de la transacción */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Detalles de la transacción</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">ID de transacción:</span>
                <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                  {paymentInfo.shop_process_id || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Monto pagado:</span>
                <span className="font-bold text-green-600 text-lg">
                  {displayPYGCurrency(paymentInfo.amount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Estado:</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Aprobado
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString('es-PY', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Próximos pasos</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Recibirás un email de confirmación en los próximos minutos</li>
              <li>• Nuestro equipo te contactará para coordinar la entrega</li>
              <li>• El tiempo de entrega es de 24-48 horas hábiles</li>
              <li>• Guarda el ID de transacción para futuras consultas</li>
            </ul>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            ¿Necesitas ayuda con tu pedido?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={contactWhatsApp}
              className="flex items-center justify-center gap-3 bg-[#25D366] text-white py-3 px-4 rounded-lg hover:bg-[#128C7E] transition-all duration-300 shadow-md"
            >
              <FaWhatsapp className="text-xl" />
              <span className="font-medium">Contactar por WhatsApp</span>
            </button>
            
            <button
              onClick={sendEmail}
              className="flex items-center justify-center gap-3 bg-[#2A3190] text-white py-3 px-4 rounded-lg hover:bg-[#1e236b] transition-all duration-300 shadow-md"
            >
              <FaEnvelope className="text-xl" />
              <span className="font-medium">Enviar Email</span>
            </button>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="flex items-center justify-center gap-2 mb-1">
              <FaPhone className="text-[#2A3190]" />
              También puedes llamarnos al: +595 984 133733
            </p>
            <p>Horario de atención: Lunes a Viernes de 8:00 a 18:00</p>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Información de contacto
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Oficina Principal</h3>
              <p className="text-gray-600 text-sm">
                Teodoro S. Mongelos casi Radio Operadores del Chaco n 3934<br/>
                Asunción, Paraguay
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Contacto</h3>
              <p className="text-gray-600 text-sm">
                WhatsApp: +595 984 133733<br/>
                Email: ventas@bluetec.com.py
              </p>
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 bg-[#2A3190] text-white py-3 px-6 rounded-lg hover:bg-[#1e236b] transition-all duration-300 shadow-md"
          >
            <FaHome />
            <span>Volver al inicio</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/categoria-producto'}
            className="flex items-center justify-center gap-2 border border-[#2A3190] text-[#2A3190] py-3 px-6 rounded-lg hover:bg-[#2A3190] hover:text-white transition-all duration-300"
          >
            <span>Seguir comprando</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Gracias por elegir BlueTec • Tu tecnología de confianza en Paraguay
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;