import React, { useState, useEffect } from 'react';
import { 
  FaCreditCard, 
  FaPlus, 
  FaTrash, 
  FaShieldAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
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

  // Cargar tarjetas al montar el componente
  useEffect(() => {
    if (user?.id) {
      fetchUserCards();
    }
  }, [user]);

  const fetchUserCards = async () => {
    setLoading(true);
    try {
      const userCards = await onFetchCards(user.id);
      setCards(userCards || []);
    } catch (error) {
      console.error('Error al cargar tarjetas:', error);
      setErrors({ fetch: 'Error al cargar las tarjetas' });
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
    try {
      // Generar card_id único
      const cardId = Date.now();
      
      const result = await onRegisterCard({
        card_id: cardId,
        user_id: user.id,
        user_cell_phone: user.phone || '12345678',
        user_mail: user.email,
        return_url: `${window.location.origin}/mis-tarjetas`
      });

      if (result.success && result.data?.process_id) {
        setProcessId(result.data.process_id);
        setShowRegisterForm(false);
        setShowIframe(true);
        loadBancardScript();
      } else {
        setErrors({ register: result.message || 'Error al iniciar registro' });
      }
    } catch (error) {
      console.error('Error al registrar tarjeta:', error);
      setErrors({ register: 'Error al registrar tarjeta' });
    } finally {
      setRegisteringCard(false);
    }
  };

  const handleDeleteCard = async (aliasToken) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
      return;
    }

    try {
      const result = await onDeleteCard(user.id, aliasToken);
      if (result.success) {
        await fetchUserCards(); // Recargar la lista
      } else {
        setErrors({ delete: result.message || 'Error al eliminar tarjeta' });
      }
    } catch (error) {
      console.error('Error al eliminar tarjeta:', error);
      setErrors({ delete: 'Error al eliminar tarjeta' });
    }
  };

  const loadBancardScript = () => {
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
      console.log('✅ Script de Bancard cargado');
      setTimeout(initializeBancardIframe, 100);
    };
    
    script.onerror = () => {
      console.error('❌ Error cargando script de Bancard');
      setShowIframe(false);
      setRegisteringCard(false);
      setErrors({ iframe: 'Error cargando el sistema de registro' });
    };

    document.head.appendChild(script);
  };

  const initializeBancardIframe = () => {
    try {
      if (window.Bancard && window.Bancard.Cards) {
        const styles = {
          'input-background-color': '#ffffff',
          'input-text-color': '#555555',
          'input-border-color': '#cccccc',
          'button-background-color': '#2A3190',
          'button-text-color': '#ffffff',
          'button-border-color': '#2A3190',
          'form-background-color': '#ffffff'
        };

        const container = document.getElementById('bancard-card-container');
        if (container) {
          container.innerHTML = '';
          window.Bancard.Cards.createForm('bancard-card-container', processId, styles);
          console.log('✅ Iframe de registro inicializado');
        }
      } else {
        console.log('⏳ Bancard.Cards no disponible, reintentando...');
        setTimeout(initializeBancardIframe, 1000);
      }
    } catch (error) {
      console.error('❌ Error inicializando iframe:', error);
      setErrors({ iframe: 'Error al cargar formulario de registro' });
    }
  };

  const closeIframe = () => {
    setShowIframe(false);
    setProcessId('');
    
    // Limpiar script
    const script = document.getElementById('bancard-script');
    if (script) {
      script.remove();
    }
    
    // Recargar tarjetas por si se registró una nueva
    fetchUserCards();
  };

  const getCardBrandColor = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'bg-blue-600';
      case 'mastercard':
        return 'bg-red-600';
      case 'american express':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Si se muestra el iframe de registro
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
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>

          <div className="p-4">
            <div 
              id="bancard-card-container" 
              className="w-full"
              style={{ 
                minHeight: '500px',
                width: '100%',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}
            >
              <div className="p-4 text-center text-gray-500">
                <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                <p>Cargando formulario de registro...</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <FaShieldAlt />
              <span className="text-sm font-medium">Registro seguro SSL</span>
            </div>
            <p className="text-xs text-gray-500">
              Tus datos están protegidos por Bancard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Encabezado */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2A3190] flex items-center gap-3">
                <FaCreditCard className="text-xl" />
                Mis Tarjetas
              </h1>
              <p className="text-gray-600 mt-1">Gestiona tus métodos de pago registrados</p>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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
                <p className="text-gray-600 mb-6">
                  Al continuar, se abrirá un formulario seguro de Bancard para registrar tu tarjeta.
                  Tus datos estarán protegidos y encriptados.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <FaShieldAlt />
                    <span className="font-medium">Información de Seguridad</span>
                  </div>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Tus datos de tarjeta no se guardan en nuestros servidores</li>
                    <li>• El proceso está certificado por Bancard</li>
                    <li>• Cumplimos con estándares PCI DSS</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRegisterForm(false)}
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
                        className="text-white/80 hover:text-white p-1 rounded"
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
        <div className="mt-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Información sobre tus tarjetas</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Las tarjetas registradas te permiten realizar pagos más rápidos</li>
                  <li>• Tus datos están protegidos con encriptación de nivel bancario</li>
                  <li>• Puedes eliminar una tarjeta en cualquier momento</li>
                  <li>• Máximo 5 tarjetas por usuario</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardManagementPage;