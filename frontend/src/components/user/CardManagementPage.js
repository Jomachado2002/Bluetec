import React, { useState, useEffect } from 'react';
import { 
  FaCreditCard, 
  FaPlus, 
  FaTrash, 
  FaShieldAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser
} from 'react-icons/fa';

const CardManagementPage = ({ 
  user, 
  onRegisterCard, 
  onDeleteCard, 
  onFetchCards 
}) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registeringCard, setRegisteringCard] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [processId, setProcessId] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log('🔄 CardManagement mounted with user:', user);
    if (user?.id) {
      fetchUserCards();
    }
  }, [user]);

  const fetchUserCards = async () => {
    setLoading(true);
    setErrors({});
    try {
      console.log('📋 Obteniendo tarjetas para usuario:', user?.id);
      const userCards = await onFetchCards(user.id);
      console.log('📋 Tarjetas obtenidas:', userCards);
      setCards(userCards || []);
    } catch (error) {
      console.error('❌ Error al cargar tarjetas:', error);
      setErrors({ fetch: 'Error al cargar las tarjetas. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCard = async () => {
    if (!user?.id) {
      setErrors({ register: 'Usuario no válido' });
      return;
    }

    setRegisteringCard(true);
    setErrors({});
    
    try {
      console.log('💳 Iniciando registro de tarjeta para usuario:', user);
      
      const cardId = Date.now() + Math.floor(Math.random() * 1000);
      
      const cardData = {
        card_id: cardId,
        user_id: user.id,
        user_cell_phone: user.phone || '12345678',
        user_mail: user.email,
        return_url: `${window.location.origin}/mi-perfil?tab=cards&status=registered`
      };

      console.log('📤 Enviando datos de catastro:', cardData);

      const result = await onRegisterCard(cardData);

      if (result.success && result.data?.process_id) {
        console.log('✅ Catastro iniciado exitosamente:', result.data);
        setProcessId(result.data.process_id);
        setShowRegisterForm(false);
        setShowIframe(true);
        // ✅ CARGAR SCRIPT INMEDIATAMENTE
        loadBancardScript(result.data.process_id);
      } else {
        console.error('❌ Error en catastro:', result);
        setErrors({ register: result.message || 'Error al iniciar registro' });
      }
    } catch (error) {
      console.error('❌ Error al registrar tarjeta:', error);
      setErrors({ register: 'Error al registrar tarjeta. Intenta nuevamente.' });
    } finally {
      setRegisteringCard(false);
    }
  };

  const handleDeleteCard = async (aliasToken) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
      return;
    }

    setErrors({});
    try {
      console.log('🗑️ Eliminando tarjeta:', aliasToken);
      const result = await onDeleteCard(user.id, aliasToken);
      if (result.success) {
        console.log('✅ Tarjeta eliminada exitosamente');
        await fetchUserCards();
      } else {
        setErrors({ delete: result.message || 'Error al eliminar tarjeta' });
      }
    } catch (error) {
      console.error('❌ Error al eliminar tarjeta:', error);
      setErrors({ delete: 'Error al eliminar tarjeta. Intenta nuevamente.' });
    }
  };

  // ✅ FUNCIÓN CORREGIDA SEGÚN DOCUMENTACIÓN BANCARD
  const loadBancardScript = (processIdToUse) => {
    console.log('🔄 Cargando script de Bancard para catastro...');
    
    // Remover script anterior si existe
    const existingScript = document.getElementById('bancard-script');
    if (existingScript) {
      existingScript.remove();
      console.log('🗑️ Script anterior removido');
    }

    // ✅ URL CORRECTA SEGÚN DOCUMENTACIÓN
    const environment = process.env.REACT_APP_BANCARD_ENVIRONMENT || 'staging';
    const baseUrl = environment === 'production' 
      ? 'https://vpos.infonet.com.py' 
      : 'https://vpos.infonet.com.py:8888';

    const scriptUrl = `${baseUrl}/checkout/javascript/dist/bancard-checkout-4.0.0.js`;
    console.log('📥 Cargando script desde:', scriptUrl);

    const script = document.createElement('script');
    script.id = 'bancard-script';
    script.src = scriptUrl;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Script de Bancard cargado');
      console.log('🔍 window.Bancard disponible:', !!window.Bancard);
      
      if (window.Bancard) {
        console.log('🔍 Propiedades de Bancard:', Object.keys(window.Bancard));
        console.log('🔍 Bancard.Cards disponible:', !!window.Bancard.Cards);
        console.log('🔍 Bancard.Checkout disponible:', !!window.Bancard.Checkout);
      }
      
      // ✅ INICIALIZAR INMEDIATAMENTE
      setTimeout(() => {
        initializeBancardIframe(processIdToUse);
      }, 500); // Pequeño delay para asegurar carga completa
    };
    
    script.onerror = (error) => {
      console.error('❌ Error cargando script de Bancard:', error);
      console.error('❌ URL que falló:', scriptUrl);
      setShowIframe(false);
      setRegisteringCard(false);
      setErrors({ iframe: 'Error cargando el sistema de registro. Intenta nuevamente.' });
    };

    document.head.appendChild(script);
  };

  // ✅ FUNCIÓN DE INICIALIZACIÓN CORREGIDA
  const initializeBancardIframe = (processIdToUse) => {
    try {
      console.log('🎯 Inicializando iframe de catastro...');
      console.log('🎯 Process ID a usar:', processIdToUse);
      
      // ✅ VERIFICACIONES SEGÚN DOCUMENTACIÓN
      console.log('🔍 Verificando window.Bancard:', !!window.Bancard);
      
      if (!window.Bancard) {
        console.error('❌ window.Bancard no está definido');
        setTimeout(() => initializeBancardIframe(processIdToUse), 1000);
        return;
      }

      // ✅ VERIFICAR DIFERENTES POSIBLES FUNCIONES
      const hasCards = !!window.Bancard.Cards;
      const hasCreateForm = !!window.Bancard.createForm;
      const hasCheckout = !!window.Bancard.Checkout;
      
      console.log('🔍 Funciones disponibles:', {
        'Bancard.Cards': hasCards,
        'Bancard.createForm': hasCreateForm,
        'Bancard.Checkout': hasCheckout,
        'Todas las propiedades': Object.keys(window.Bancard)
      });

      // ✅ ESTILOS SEGÚN DOCUMENTACIÓN
      const styles = {
        'input-background-color': '#ffffff',
        'input-text-color': '#555555',
        'input-border-color': '#cccccc',
        'button-background-color': '#2A3190',
        'button-text-color': '#ffffff',
        'button-border-color': '#2A3190',
        'form-background-color': '#ffffff',
        'form-border-color': '#dddddd',
        'header-background-color': '#f8f9fa',
        'header-text-color': '#333333'
      };

      const container = document.getElementById('bancard-card-container');
      if (!container) {
        console.error('❌ Contenedor bancard-card-container no encontrado');
        setErrors({ iframe: 'Error en la configuración del formulario' });
        return;
      }

      // Limpiar contenedor
      container.innerHTML = '';
      container.style.display = 'block';
      container.style.minHeight = '500px';
      container.style.width = '100%';
      
      console.log('📦 Contenedor preparado:', container);

      // ✅ INTENTAR DIFERENTES MÉTODOS SEGÚN DOCUMENTACIÓN
      let iframeCreated = false;

      // Método 1: Bancard.Cards.createForm (según documentación página 26)
      if (window.Bancard.Cards && window.Bancard.Cards.createForm) {
        try {
          console.log('🔄 Intentando Bancard.Cards.createForm...');
          window.Bancard.Cards.createForm('bancard-card-container', processIdToUse, styles);
          iframeCreated = true;
          console.log('✅ Iframe creado con Bancard.Cards.createForm');
        } catch (error) {
          console.error('❌ Error con Bancard.Cards.createForm:', error);
        }
      }

      // Método 2: Bancard.createForm (alternativo)
      if (!iframeCreated && window.Bancard.createForm) {
        try {
          console.log('🔄 Intentando Bancard.createForm...');
          window.Bancard.createForm('bancard-card-container', processIdToUse, styles);
          iframeCreated = true;
          console.log('✅ Iframe creado con Bancard.createForm');
        } catch (error) {
          console.error('❌ Error con Bancard.createForm:', error);
        }
      }

      // Método 3: Bancard.Checkout.createForm (fallback)
      if (!iframeCreated && window.Bancard.Checkout && window.Bancard.Checkout.createForm) {
        try {
          console.log('🔄 Intentando Bancard.Checkout.createForm...');
          window.Bancard.Checkout.createForm('bancard-card-container', processIdToUse, styles);
          iframeCreated = true;
          console.log('✅ Iframe creado con Bancard.Checkout.createForm');
        } catch (error) {
          console.error('❌ Error con Bancard.Checkout.createForm:', error);
        }
      }

      if (!iframeCreated) {
        console.error('❌ No se pudo crear el iframe con ningún método');
        console.error('❌ Funciones disponibles:', Object.keys(window.Bancard));
        setErrors({ iframe: 'Error al cargar formulario de registro' });
        return;
      }

      // ✅ VERIFICAR QUE EL IFRAME SE CREÓ
      setTimeout(() => {
        const iframe = container.querySelector('iframe');
        if (iframe) {
          console.log('✅ Iframe encontrado:', iframe);
          iframe.style.width = '100%';
          iframe.style.minHeight = '500px';
          iframe.style.border = 'none';
          
          // ✅ ESCUCHAR MENSAJES DEL IFRAME
          window.addEventListener('message', handleIframeMessage, false);
          setRegisteringCard(false);
        } else {
          console.log('⚠️ No se encontró iframe después de 2 segundos');
          console.log('⚠️ Contenido del contenedor:', container.innerHTML);
          setErrors({ iframe: 'El formulario tardó en cargar. Intenta nuevamente.' });
          setRegisteringCard(false);
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error inicializando iframe:', error);
      setErrors({ iframe: 'Error al cargar formulario de registro' });
      setRegisteringCard(false);
    }
  };

  // ✅ MANEJAR MENSAJES DEL IFRAME
  const handleIframeMessage = (event) => {
    try {
      console.log('📨 Mensaje del iframe de catastro:', event.data);
      
      if (typeof event.data === 'object' && event.data.status) {
        if (event.data.status === 'add_new_card_success') {
          console.log('✅ Tarjeta catastrada exitosamente');
          setTimeout(() => {
            closeIframe();
            fetchUserCards();
          }, 2000);
        } else if (event.data.status === 'add_new_card_fail') {
          console.log('❌ Error en catastro de tarjeta');
          setErrors({ iframe: event.data.description || 'Error al catastrar tarjeta' });
        }
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje del iframe:', error);
    }
  };

  const closeIframe = () => {
    setShowIframe(false);
    setProcessId('');
    
    // Limpiar script y event listeners
    const script = document.getElementById('bancard-script');
    if (script) {
      script.remove();
    }
    
    window.removeEventListener('message', handleIframeMessage, false);
  };

  const getCardBrandColor = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'bg-gradient-to-r from-blue-600 to-blue-700';
      case 'mastercard':
        return 'bg-gradient-to-r from-red-600 to-red-700';
      case 'american express':
        return 'bg-gradient-to-r from-green-600 to-green-700';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
  };

  // ✅ MOSTRAR IFRAME DE CATASTRO
  if (showIframe) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b bg-[#2A3190] text-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaShieldAlt />
              Registrar Nueva Tarjeta - Bancard
            </h2>
            <button
              onClick={closeIframe}
              className="text-white hover:text-gray-200 text-xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Información del usuario */}
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center gap-3">
              <FaUser className="text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">{user?.name}</p>
                <p className="text-sm text-blue-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* ✅ LOADING STATE MEJORADO */}
          {registeringCard && (
            <div className="p-4 bg-yellow-50 border-b">
              <div className="flex items-center gap-2 text-yellow-800">
                <FaSpinner className="animate-spin" />
                <span>Inicializando formulario de Bancard...</span>
              </div>
            </div>
          )}

          {/* Contenedor del iframe */}
          <div className="p-4">
            <div 
              id="bancard-card-container" 
              className="w-full border border-gray-200 rounded-lg"
              style={{ 
                minHeight: '500px',
                width: '100%',
                backgroundColor: '#ffffff'
              }}
            >
              {/* ✅ MENSAJE INICIAL MEJORADO */}
              <div className="p-4 text-center text-gray-500">
                <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                <p>Cargando formulario de registro seguro...</p>
                <p className="text-sm mt-2">
                  Conectando con Bancard...
                </p>
                
                {/* ✅ DEBUG INFO EN DESARROLLO */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 text-xs text-left bg-gray-100 p-2 rounded">
                    <p><strong>Debug Info:</strong></p>
                    <p>Process ID: {processId}</p>
                    <p>Environment: {process.env.REACT_APP_BANCARD_ENVIRONMENT || 'staging'}</p>
                    <p>User ID: {user?.id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instrucciones */}
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-yellow-800 mb-2">📝 Datos de prueba:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Cédula válida Visa/MasterCard:</strong> 6587520</li>
                <li>• <strong>Cédula válida Bancard:</strong> 9661000</li>
                <li>• Completa los demás campos con datos reales de tu tarjeta</li>
              </ul>
            </div>

            {/* ✅ BOTÓN DE REINTENTAR EN CASO DE ERROR */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    console.log('🔄 Reintentando cargar iframe...');
                    setErrors({});
                    setRegisteringCard(true);
                    setTimeout(() => {
                      loadBancardScript(processId);
                    }, 500);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>

          {/* Footer con información de seguridad */}
          <div className="p-4 bg-gray-50 border-t text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <FaShieldAlt />
              <span className="text-sm font-medium">Conexión segura SSL</span>
            </div>
            <p className="text-xs text-gray-500">
              Tus datos están protegidos por Bancard y nunca se almacenan en nuestros servidores
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2A3190] flex items-center gap-3">
              <FaCreditCard className="text-xl" />
              Mis Tarjetas Registradas
            </h1>
            <p className="text-gray-600 mt-1">Gestiona tus métodos de pago para compras rápidas</p>
          </div>
          
          <button
            onClick={() => setShowRegisterForm(true)}
            className="flex items-center gap-2 bg-[#2A3190] text-white px-4 py-2 rounded-lg hover:bg-[#1e236b] transition-colors"
          >
            <FaPlus className="text-sm" />
            Registrar Nueva Tarjeta
          </button>
        </div>
      </div>

      {/* Mensajes de error */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <FaExclamationTriangle />
            <span className="font-medium">Errores encontrados:</span>
          </div>
          {Object.values(errors).map((error, index) => (
            <p key={index} className="text-red-700 text-sm">{error}</p>
          ))}
        </div>
      )}

      {/* Modal de confirmación para registrar tarjeta */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#2A3190] mb-4">Registrar Nueva Tarjeta</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-800 mb-2">👤 Usuario:</h3>
                <p className="text-blue-700 text-sm mb-1"><strong>Nombre:</strong> {user?.name}</p>
                <p className="text-blue-700 text-sm mb-1"><strong>Email:</strong> {user?.email}</p>
                <p className="text-blue-700 text-sm"><strong>ID Bancard:</strong> {user?.id}</p>
              </div>
              
              <p className="text-gray-600 mb-6">
                Al continuar, se abrirá un formulario seguro de Bancard para registrar tu tarjeta.
                Tus datos estarán protegidos y encriptados.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <FaShieldAlt />
                  <span className="font-medium">Información Importante</span>
                </div>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Tus datos de tarjeta no se guardan en nuestros servidores</li>
                  <li>• El proceso está certificado por Bancard</li>
                  <li>• Cumplimos con estándares PCI DSS</li>
                  <li>• Máximo 5 tarjetas por usuario</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRegisterForm(false);
                    setErrors({});
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegisterCard}
                  disabled={registeringCard}
                  className="flex-1 bg-[#2A3190] text-white py-2 rounded-lg hover:bg-[#1e236b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registeringCard ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Continuar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de tarjetas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Tarjetas Registradas</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-3xl text-[#2A3190] mx-auto mb-4" />
            <p className="text-gray-600">Cargando tus tarjetas...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12">
            <FaCreditCard className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes tarjetas registradas</h3>
            <p className="text-gray-500 mb-6">Registra tu primera tarjeta para realizar pagos más rápidos</p>
            <button
              onClick={() => setShowRegisterForm(true)}
              className="bg-[#2A3190] text-white px-6 py-3 rounded-lg hover:bg-[#1e236b] transition-colors flex items-center gap-2 mx-auto"
            >
              <FaPlus />
              Registrar Primera Tarjeta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, index) => (
              <div key={index} className="relative">
                <div className={`${getCardBrandColor(card.card_brand)} rounded-xl p-6 text-white shadow-lg`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm opacity-80">Tarjeta</p>
                      <p className="font-semibold">{card.card_brand || 'Tarjeta'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(card.alias_token)}
                      className="text-white/80 hover:text-white p-1 rounded transition-colors"
                      title="Eliminar tarjeta"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-lg font-mono tracking-wider">
                      {card.card_masked_number || '**** **** **** ****'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs opacity-80">Vence</p>
                      <p className="text-sm">{card.expiration_date || '--/--'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-80">Tipo</p>
                      <p className="text-sm capitalize">{card.card_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {card.bancard_proccessed && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Bancard
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">💳</span>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Información sobre tus tarjetas</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Las tarjetas registradas te permiten realizar pagos más rápidos en el carrito</li>
              <li>• Tus datos están protegidos con encriptación de nivel bancario</li>
              <li>• Puedes eliminar una tarjeta en cualquier momento</li>
              <li>• Máximo 5 tarjetas por usuario</li>
              <li>• Para testing usa: Cédula 6587520 (Visa/MasterCard) o 9661000 (Bancard)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardManagementPage;